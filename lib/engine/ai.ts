import type { BuildingType, Character, Company, GameState } from "./types";
import { getIndustry } from "../data/industries";
import { productionCapacity } from "./company";
import {
  buildBuilding,
  buyAsset,
  buyStock,
  emptyCell,
  hireCharacter,
  sellStock,
  upgradeBuilding,
} from "./actions";
import { fundamentalValue } from "./market";
import { type RngState, nextFloat, nextRange, pick } from "./rng";

// Heuristic AI that runs each turn for non-player companies: it tunes its
// operating decisions, expands its campus, hires talent and invests — so the
// player always has live competitors on the leaderboard (single and multi).

export function runAiTurn(state: GameState, company: Company): void {
  const rng = state.rng;
  const industry = getIndustry(company.industryId);
  const aggression = 0.4 + nextFloat(rng) * 0.4; // per-AI personality

  // --- Operating decisions ---
  const capacity = productionCapacity(company, state.config);
  // Price at base; only add a small premium when quality is genuinely high (>40)
  // so that pricing above market is justified by quality-factor gains in demand.
  const moodAdj = 1 + state.macro.sentiment * 0.05;
  const qualityPremium = Math.max(0, (company.quality - 40) / 500);
  company.decisions.price = Math.max(
    industry.unitCost * 1.2,
    industry.basePrice * (1 + qualityPremium) * moodAdj,
  );
  company.decisions.productionTarget = Math.round(capacity * (0.7 + aggression * 0.3));

  // Use a 40k floor so early-game AI is competitive before revenue builds up;
  // player's default is 30k so this keeps AI from being systematically under-funded.
  const opBudget = Math.max(40_000, company.lastRevenue * 0.25);
  company.decisions.marketingBudget = Math.round(opBudget * 0.5);
  company.decisions.rndBudget = Math.round(opBudget * 0.5 * (0.5 + industry.rndDependence));
  company.decisions.welfareBudget = Math.round(opBudget * 0.15);

  // --- Expansion: lower threshold so AI keeps building through mid-game ---
  // 900k was too high: at university start-cash of 1M, one building drops AI
  // below the threshold permanently. 500k lets them expand throughout the game.
  if (company.cash > 500_000 && company.debt < company.cash * 1.5 && nextFloat(rng) < 0.7) {
    const cell = emptyCell(company, state.config.mapSize);
    if (cell) {
      const want = chooseBuilding(company, state);
      if (want) buildBuilding(state, company, want, cell.x, cell.y);
    } else {
      // Map full -> try upgrading a random building.
      const b = company.buildings.find((b) => b.turnsLeft <= 0);
      if (b) upgradeBuilding(state, company, b.id);
    }
  }

  // --- Hiring: grab an affordable talent for a free role ---
  if (company.cash > 350_000 && company.debt < company.cash && company.hired.length < 5 && nextFloat(rng) < 0.45) {
    const affordable = state.talentPool
      .filter((c) => c.salary < Math.max(15_000, company.lastRevenue * 0.25))
      .sort((a, b) => statSum(b) - statSum(a));
    if (affordable.length) hireCharacter(state, company, affordable[0].id);
  }

  // --- Investing: only deploy genuinely spare cash; take profits sometimes ---
  if (company.cash > 600_000 && nextFloat(rng) < 0.45) investSpareCash(state, company, aggression, rng);
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
