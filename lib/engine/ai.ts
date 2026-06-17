import type { BuildingType, Character, Company, GameState } from "./types";
import { getIndustry } from "../data/industries";
import { getCountry } from "../data/countries";
import { getIndustryProducts } from "../data/products";
import { estimateDemand, productionCapacity } from "./company";
import {
  buildBuilding,
  buyAsset,
  buyStock,
  emptyCell,
  hireCharacter,
  poachCharacter,
  raiseSalary,
  sellStock,
  upgradeBuilding,
} from "./actions";
import { fundamentalValue } from "./market";
import { type RngState, nextFloat, nextRange, pick, shuffle } from "./rng";

// Heuristic AI that runs each turn for non-player companies: it tunes its
// operating decisions, expands its campus, hires talent and invests — so the
// player always has live competitors on the leaderboard (single and multi).

export function runAiTurn(state: GameState, company: Company): void {
  const rng = state.rng;
  const industry = getIndustry(company.industryId);
  // Stronger, more driven competitors: higher baseline aggression so AIs keep
  // investing in the things that win market share (quality, marketing, scale).
  const aggression = 0.5 + nextFloat(rng) * 0.4; // per-AI personality

  // --- Operating decisions ---
  const capacity = productionCapacity(company, state.config);
  // Price near the market, undercutting only slightly to win share and charging a
  // quality premium when earned. Demand is now competitive (a share of the
  // market), so steady, sustainable pricing beats a fixed list price over time.
  const moodAdj = 1 + state.macro.sentiment * 0.05;
  const qualityPremium = Math.max(0, (company.quality - 35) / 400);
  const undercut = 0.97 + (1 - aggression) * 0.02; // 0.97–0.99 of base
  company.decisions.price = Math.max(
    industry.unitCost * 1.25,
    industry.basePrice * (undercut + qualityPremium) * moodAdj,
  );
  // Produce to expected demand (not blindly to capacity): overstocking unsold
  // goods is the classic way to bleed cash, so a smart AI builds just above what
  // it can sell, capped by capacity. Existing inventory offsets what to make.
  const country = getCountry(company.countryId);
  tuneProductLineup(company);
  const expectedDemand = estimateDemand(company, industry, country, state.macro, state.config);
  const targetStock = expectedDemand * (1.02 + aggression * 0.06);
  company.decisions.productionTarget = Math.round(
    Math.max(0, Math.min(capacity, targetStock - company.inventory)),
  );

  // Reinvest into the things that drive share (quality, marketing, morale).
  // Floors keep early-game AIs competitive; the revenue share scales them up.
  // Kept sustainable so the wider field stays roughly break-even, not bankrupt.
  const stress = company.cash < 180_000 || company.debt > Math.max(120_000, company.cash * 0.7) || company.lastProfit < -45_000;
  const revenueBase = company.lastRevenue > 0 ? company.lastRevenue : Math.max(20_000, company.cash * 0.08);
  const opBudget = Math.min(
    stress ? company.cash * 0.05 : company.cash * 0.12,
    Math.max(stress ? 8_000 : 18_000, revenueBase * (stress ? 0.07 : 0.16)),
  );
  company.decisions.marketingBudget = Math.round(opBudget * (stress ? 0.45 : 0.38));
  company.decisions.rndBudget = Math.round(opBudget * (stress ? 0.2 : 0.38) * (0.6 + industry.rndDependence));
  company.decisions.welfareBudget = Math.round(opBudget * (stress ? 0.08 : 0.16));
  company.decisions.safetyBudget = Math.round(opBudget * (stress ? 0.04 : 0.08));

  // --- Expansion: build through the game, more when flush with cash. ---
  if (!stress && company.cash > 650_000 && company.debt < company.cash * 0.8 && nextFloat(rng) < 0.42) {
    expand(state, company);
    // A cash-rich AI puts a second building down the same quarter to compound.
    if (company.cash > 1_800_000 && nextFloat(rng) < 0.45) expand(state, company);
  }

  // --- Hiring: keep a solid bench of strong talent ---
  if (!stress && company.cash > 450_000 && company.debt < company.cash * 0.7 && company.hired.length < 5 && nextFloat(rng) < 0.35) {
    const affordable = state.talentPool
      .filter((c) => c.salary < Math.max(18_000, company.lastRevenue * 0.25))
      .sort((a, b) => statSum(b) - statSum(a));
    if (affordable.length) hireCharacter(state, company, affordable[0].id);
  }

  // --- Poaching: flip low-loyalty rivals to grow the bench ---
  if (!stress && company.cash > 750_000 && company.hired.length < 5 && nextFloat(rng) < 0.15) {
    const rivals = shuffle(rng, state.companies.filter((c) => c.id !== company.id && c.isAI));
    for (const rival of rivals) {
      const weak = rival.hired
        .filter((c) => (c.loyalty ?? 70) < 50)
        .sort((a, b) => statSum(b) - statSum(a));
      if (!weak.length) continue;
      const t = weak[0];
      const cost = Math.round(t.salary * (1.3 + (t.loyalty ?? 70) / 100));
      if (company.cash > cost) { poachCharacter(state, company, rival.id, t.id); break; }
    }
  }
  // Raise salaries before disloyal staff quit.
  for (const ch of company.hired) {
    if ((ch.loyalty ?? 70) < 45 && company.cash > ch.salary * 3 && nextFloat(rng) < 0.4) {
      raiseSalary(company, ch.id, Math.round(ch.salary * 1.15), 0);
    }
  }

  // --- Investing: deploy genuinely spare cash; take profits sometimes ---
  if (!stress && company.cash > 650_000 && nextFloat(rng) < 0.35) investSpareCash(state, company, aggression, rng);
}

function tuneProductLineup(company: Company): void {
  const industry = getIndustry(company.industryId);
  const products = getIndustryProducts(company.industryId);
  company.productEnabled = products.map((product, index) => {
    if (index === 0) return true;
    if (product.isRndUnlock && !company.rndUnlockDone) return false;
    return company.quality >= product.qualityRequired;
  });
  company.productPrices = products.map((product, index) => {
    if (!company.productEnabled[index]) return company.productPrices[index] ?? 0;
    const tierRef = industry.basePrice * product.priceRatio;
    const qualityPremium = Math.min(0.45, Math.max(0, company.quality - product.qualityRequired) / 180);
    return Math.round(tierRef * (1 + qualityPremium));
  });
}

/** Build the most useful available building, or upgrade if the map is full. */
function expand(state: GameState, company: Company): void {
  const cell = emptyCell(company, state.config.mapSize);
  if (cell) {
    const want = chooseBuilding(company, state);
    if (want) buildBuilding(state, company, want, cell.x, cell.y);
  } else {
    const b = company.buildings.find((b) => b.turnsLeft <= 0);
    if (b) upgradeBuilding(state, company, b.id);
  }
}

function statSum(c: Character): number {
  return Object.values(c.stats).reduce((a, b) => a + b, 0);
}

function chooseBuilding(company: Company, state: GameState): BuildingType | null {
  const enabled = state.config.enabledBuildings;
  const capacity = productionCapacity(company, state.config);
  // Prioritise capacity if production is bottlenecked, then diversify into
  // welfare/research/marketing buildings to grow quality and morale.
  const order: BuildingType[] =
    capacity < company.decisions.productionTarget * 1.1
      ? ["factory", "warehouse", "store", "rnd", "lab", "office", "hr", "power", "cafeteria", "gym", "park"]
      : ["store", "rnd", "lab", "office", "factory", "warehouse", "hr", "cafeteria", "gym", "dorm", "power", "park"];
  return order.find((t) => enabled.includes(t)) ?? null;
}

function investSpareCash(
  state: GameState,
  company: Company,
  aggression: number,
  rng: RngState,
): void {
  const spare = company.cash - 500_000;
  if (spare < 50_000) return;

  // Risk appetite from aggression: aggressive AIs buy stocks/crypto, cautious
  // AIs prefer ETFs/bonds/gold.
  const budget = spare * (0.2 + aggression * 0.3);

  if (aggression > 0.6 && nextFloat(rng) < 0.6) {
    // Buy an undervalued competitor's stock.
    const targets = state.companies.filter((c) => c.id !== company.id);
    if (targets.length) {
      const t = targets.sort(
        (a, b) =>
          fundamentalValue(b) / state.stocks[b.id].price -
          fundamentalValue(a) / state.stocks[a.id].price,
      )[0];
      const shares = Math.floor((budget * 0.5) / state.stocks[t.id].price);
      if (shares > 0) buyStock(state, company, t.id, shares);
    }
  } else {
    const safe = state.config.enabledAssets.filter((a) =>
      ["etf", "bond", "gold", "deposit"].includes(a),
    );
    if (safe.length) {
      const cls = pick(rng, safe);
      const units = Math.floor((budget * 0.5) / state.assets[cls].price);
      if (units > 0) buyAsset(state, company, cls, units);
    }
  }

  // Occasionally take profits on a stock holding.
  if (nextFloat(rng) < 0.2) {
    const holdings = Object.entries(company.portfolio.stocks);
    if (holdings.length) {
      const [id, sh] = holdings[Math.floor(nextRange(rng, 0, holdings.length))];
      sellStock(state, company, id, Math.ceil(sh / 2));
    }
  }
}
