import type {
  Company,
  CompanyDecisions,
  CountryDef,
  IndustryDef,
  LevelConfig,
  MacroState,
} from "./types";
import { aggregateBuildingCaps, totalUpkeep, tickConstruction } from "./buildings";
import { roleBonuses, totalSalary, updateLoyalty } from "./characters";
import { demandMultiplier } from "./economy";
import { getCountry } from "../data/countries";
import { getIndustry } from "../data/industries";
import { getIndustryProducts } from "../data/products";
import type { RngState } from "./rng";

// Per-company turn resolution: produce, sell, and book profit; then update
// quality/reputation/morale/safety. Buildings and hired talent feed in as
// capability and role bonuses.

const BASE_CAPACITY = 400;

export interface CompanyTurnResult {
  revenue: number;
  unitsSold: number;
  unitsProduced: number;
  profit: number;
  quitCount: number;
}

export function defaultDecisions(industry: IndustryDef): CompanyDecisions {
  return {
    price: industry.basePrice,
    productionTarget: industry.baseDemand,
    marketingBudget: 0,
    rndBudget: 0,
    welfareBudget: 0,
    safetyBudget: 0,
  };
}

/** Operational production capacity from buildings + base. */
export function productionCapacity(company: Company, config: LevelConfig): number {
  const caps = aggregateBuildingCaps(company.buildings, config.adjacencyBonus);
  return BASE_CAPACITY + caps.productionCapacity + company.employees * 20;
}

/**
 * How strongly a company pulls customers, from its own decisions and stats
 * (price, marketing, quality, reputation). This is the company-specific part of
 * demand, normalised around ~1, so it can be compared across industries to model
 * competition for a shared pool of customers.
 */
export function marketAttractiveness(
  company: Company,
  industry: IndustryDef,
  config: LevelConfig,
): number {
  const caps = aggregateBuildingCaps(company.buildings, config.adjacencyBonus);
  const bonuses = roleBonuses(company);
  const price = Math.max(1, company.decisions.price);

  const priceRatio = industry.basePrice / price;
  // No artificial floor — demand falls naturally with price.
  // Above 2× base price, an additional quadratic penalty kicks in so that
  // raising price beyond the normal range cannot exploit inelastic demand
  // to generate unlimited revenue.
  const premiumPenalty =
    price > industry.basePrice * 2
      ? Math.pow((industry.basePrice * 2) / price, 2)
      : 1;
  const priceFactor = Math.pow(priceRatio, industry.demandElasticity) * premiumPenalty;

  const marketingFactor =
    1 +
    Math.min(
      0.9,
      Math.sqrt(Math.max(0, company.decisions.marketingBudget) / 5000) *
        0.05 *
        (1 + caps.marketingReach / 50),
    ) *
      bonuses.marketingMult;

  const qualityFactor = 1 + company.quality / 200;
  const reputationFactor = 0.7 + (company.reputation / 100) * 0.6;

  return Math.max(0.01, priceFactor * marketingFactor * qualityFactor * reputationFactor);
}

/**
 * Estimate market demand at the company's current decisions.
 *
 * `marketPressure` is the average attractiveness of all competitors this turn.
 * When provided, demand is scaled by the company's share of that pull, so a
 * static strategy steadily loses customers as rivals keep improving — standing
 * still is no longer enough to stay on top. Omitted (e.g. UI previews) → no
 * competitive pressure is applied.
 */
export function estimateDemand(
  company: Company,
  industry: IndustryDef,
  country: CountryDef,
  macro: MacroState,
  config: LevelConfig,
  marketPressure?: number,
): number {
  const ownPull = marketAttractiveness(company, industry, config);

  // Competitive share: rewards staying ahead of the field and gently penalises
  // falling behind as rivals improve. Bounded so it pressures without bankrupting
  // a company that simply isn't the market leader.
  const shareFactor =
    marketPressure && marketPressure > 0
      ? clamp(Math.pow(ownPull / marketPressure, 0.5), 0.72, 1.7)
      : 1;

  const demand =
    industry.baseDemand *
    country.marketSize *
    demandMultiplier(macro) *
    ownPull *
    shareFactor;

  return Math.max(0, Math.round(demand));
}

export function runCompanyTurn(
  company: Company,
  macro: MacroState,
  config: LevelConfig,
  rng: RngState,
  marketPressure?: number,
): CompanyTurnResult {
  const industry = getIndustry(company.industryId);
  const country = getCountry(company.countryId);

  // Advance any in-progress construction first.
  tickConstruction(company);

  const caps = aggregateBuildingCaps(company.buildings, config.adjacencyBonus);
  const bonuses = roleBonuses(company);
  const d = company.decisions;

  // --- Production ---
  const capacity = BASE_CAPACITY + caps.productionCapacity + company.employees * 20;
  const efficiency = Math.min(0.6, caps.productionEfficiency + bonuses.productionEfficiency);
  const unitCost = industry.unitCost * country.laborCost * (1 - efficiency);

  const wantToProduce = Math.max(0, Math.min(d.productionTarget, capacity));
  // Production can draw on cash PLUS a short-term working-capital line tied to
  // recent sales. Previously a company at zero cash could produce nothing, which
  // guaranteed an unrecoverable loss spiral (only fixed costs, no revenue).
  const workingCapital = Math.max(company.cash * 0.7, company.lastRevenue * 0.6, 60_000);
  const affordableUnits = unitCost > 0 ? Math.floor(Math.max(0, workingCapital) / unitCost) : wantToProduce;
  const produced = Math.max(0, Math.min(wantToProduce, affordableUnits));
  company.inventory += produced;
  const productionCost = produced * unitCost;

  // --- Sales ---
  const demand = estimateDemand(company, industry, country, macro, config, marketPressure);
  const unitsSold = Math.min(company.inventory, demand);
  company.inventory -= unitsSold;

  // Check if R&D quality threshold was crossed → unlock 4th product
  const productDefs = getIndustryProducts(company.industryId);
  if (!company.rndUnlockDone && company.quality >= 75 && productDefs[3]) {
    company.rndUnlockDone = true;
  }

  // Compute effective price as weighted average across active product lines.
  // productEnabled lets the player choose which products to sell.
  // Demand share is penalised when price is too high relative to the product tier
  // or when quality is insufficient for the tier.
  const productPrices = company.productPrices ?? productDefs.map((p) => Math.round(industry.basePrice * p.priceRatio));
  const productEnabled = company.productEnabled ?? productDefs.map((_, i) => i === 0);
  let totalShare = 0;
  let weightedPrice = 0;
  for (let i = 0; i < productDefs.length; i++) {
    const def = productDefs[i];
    const pPrice = productPrices[i] ?? 0;
    const enabled = productEnabled[i] ?? false;
    const meetsQuality = company.quality >= def.qualityRequired;
    const isRndOk = i < 3 || (company.rndUnlockDone ?? false);
    if (!enabled || !meetsQuality || !isRndOk || pPrice <= 0) continue;

    // Quality penalty: selling premium tier with just-enough quality reduces appeal
    const qualityScale = def.qualityRequired > 0
      ? clamp(company.quality / Math.max(1, def.qualityRequired), 0.5, 1.2)
      : 1;

    // Price penalty: charge >1.5× tier reference → demand share shrinks
    const tierRef = industry.basePrice * def.priceRatio;
    const pricePenalty = pPrice > tierRef * 1.5
      ? Math.pow(tierRef * 1.5 / pPrice, industry.demandElasticity + 0.5)
      : pPrice < tierRef * 0.5
        ? 0.85 // too cheap undercuts perceived quality slightly
        : 1;

    const share = def.demandShare * qualityScale * pricePenalty;
    totalShare += share;
    weightedPrice += share * pPrice;
  }
  const effectivePrice = totalShare > 0 ? weightedPrice / totalShare : d.price;

  const revenue = unitsSold * effectivePrice;

  // --- Costs & profit ---
  const upkeep = totalUpkeep(company.buildings);
  const salaries = totalSalary(company);
  const interest = (company.debt * (macro.interestRate / 100)) / 4 * bonuses.financeCostMult;
  const fixedCosts = upkeep + salaries + interest;
  const welfareBudget = Math.max(0, d.welfareBudget ?? 0);
  const safetyBudget = Math.max(0, d.safetyBudget ?? 0);
  const grossProfit =
    revenue - productionCost - d.marketingBudget - d.rndBudget - welfareBudget - safetyBudget - fixedCosts;
  const tax = grossProfit > 0 ? grossProfit * country.taxRate : 0;
  const profit = grossProfit - tax;

  company.cash += profit;
  company.lastRevenue = revenue;
  company.lastProfit = profit;
  company.profitHistory.push(Math.round(profit));
  if (company.profitHistory.length > 40) company.profitHistory.shift();

  // --- Stat updates ---
  // Quality grows with R&D (budget + lab power), more for R&D-heavy industries.
  const rndPower = caps.rndPower + bonuses.rndPower + Math.sqrt(Math.max(0, d.rndBudget) / 3000);
  const qualityGain = rndPower * 0.15 * (0.5 + industry.rndDependence) - 0.5; // slight decay
  company.quality = clamp(company.quality + qualityGain, 0, 100);

  // Morale from HR buildings/leaders + welfare spending, minus stress if unpaid.
  const moraleTarget = 55 + caps.morale + bonuses.moraleAdd + Math.min(25, welfareBudget / 4000);
  company.morale = clamp(company.morale + (moraleTarget - company.morale) * 0.3, 0, 100);

  // Reputation drifts with profitability and any positive bonuses. A single
  // down quarter shouldn't tank reputation (that fed the loss spiral); the
  // penalty is milder than the reward so recovery stays possible.
  const repDrift = (profit > 0 ? 1 : -0.7) + bonuses.reputationAdd + caps.reputation * 0.1;
  company.reputation = clamp(company.reputation + repDrift * 0.5, 0, 100);

  // Safety eases toward a level set by R&D investment and morale.
  const safetyTarget =
    45 + company.morale * 0.2 + bonuses.safetyAdd + Math.min(20, d.rndBudget / 4000) + Math.min(25, safetyBudget / 3500);
  company.safety = clamp(company.safety + (safetyTarget - company.safety) * 0.25, 0, 100);

  // --- Talent loyalty / quitting ---
  const canPay = company.cash > salaries;
  const quit = updateLoyalty(company, canPay, rng);

  // Auto-borrow a little if cash goes negative (with a small debt penalty).
  if (company.cash < 0) {
    const shortfall = -company.cash;
    company.debt += shortfall * 1.03;
    company.cash = 0;
  }

  return {
    revenue,
    unitsSold,
    unitsProduced: produced,
    profit,
    quitCount: quit.length,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
