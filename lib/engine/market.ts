import type { Company, LevelConfig, MacroState, Stock } from "./types";
import { BUILDINGS } from "./buildings";
import { getIndustry } from "../data/industries";
import { type RngState, nextGaussian } from "./rng";

// Stock market: each company is investable. Prices track a fundamental value
// (derived from profit, cash, quality, reputation, assets) with sentiment and
// a noisy random walk on top. Events apply discrete shocks via `shockStock`.

const SHARES = 100_000; // shares outstanding per company (kept uniform)

/** Book/enterprise value of a company, independent of its share price. */
export function fundamentalValue(company: Company): number {
  const buildingsValue = company.buildings
    .filter((b) => b.turnsLeft <= 0)
    .reduce((s, b) => s + BUILDINGS[b.type].cost * b.level * 0.5, 0);

  const recent = company.profitHistory.slice(-4);
  const avgProfit = recent.length
    ? recent.reduce((a, b) => a + b, 0) / recent.length
    : company.lastProfit;

  const value =
    company.cash * 0.4 -
    company.debt * 0.5 +
    avgProfit * 9 +
    company.quality * 4_000 +
    company.reputation * 2_500 +
    buildingsValue +
    company.employees * 1_500;

  return Math.max(50_000, value);
}

export function createStocks(companies: Company[]): Record<string, Stock> {
  const out: Record<string, Stock> = {};
  for (const c of companies) {
    const price = round2(fundamentalValue(c) / SHARES);
    out[c.id] = {
      companyId: c.id,
      price: Math.max(5, price),
      history: [Math.max(5, price)],
      sharesOutstanding: SHARES,
    };
  }
  return out;
}

/** Advance all stock prices one turn toward fundamentals plus market noise. */
export function tickStocks(
  stocks: Record<string, Stock>,
  companies: Company[],
  macro: MacroState,
  config: LevelConfig,
  rng: RngState,
): void {
  const byId = new Map(companies.map((c) => [c.id, c]));
  for (const id of Object.keys(stocks)) {
    const stock = stocks[id];
    const company = byId.get(id);
    if (!company) continue;

    const fair = fundamentalValue(company) / stock.sharesOutstanding;
    const gap = (fair - stock.price) / stock.price;
    const industry = getIndustry(company.industryId);

    const drift =
      gap * 0.25 + // mean-reversion toward fundamentals
      macro.sentiment * 0.03 +
      industry.trend;
    const noise = nextGaussian(rng, 0, 0.04 * industry.volatility * config.volatility);

    stock.price = Math.max(1, stock.price * (1 + drift + noise));
    stock.history.push(round2(stock.price));
    if (stock.history.length > 60) stock.history.shift();
  }
}

/** Apply a discrete shock (from an event) to a single stock. */
export function shockStock(
  stocks: Record<string, Stock>,
  companyId: string,
  pct: number,
): void {
  const s = stocks[companyId];
  if (!s) return;
  s.price = Math.max(1, s.price * (1 + pct));
}

/** Apply a market-wide shock to every stock (e.g. crash / rally). */
export function shockMarket(stocks: Record<string, Stock>, pct: number): void {
  for (const id of Object.keys(stocks)) shockStock(stocks, id, pct);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
