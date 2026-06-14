import type { Company, LevelConfig, MacroState, Stock } from "./types";
import { BUILDINGS } from "./buildings";
import { getIndustry } from "../data/industries";
import { COMPANY_PRESETS, EXTRA_LISTINGS, type CompanyPreset } from "../data/companyPresets";
import { type RngState, nextGaussian, nextRange } from "./rng";

// Stock market: each company is investable. Prices track a fundamental value
// (derived from profit, cash, quality, reputation, assets) with sentiment and
// a noisy random walk on top. Events apply discrete shocks via `shockStock`.

const SHARES = 1_000; // shares outstanding per company (kept uniform)

/** Every company holds the same fraction of its own shares as treasury stock,
 * so only the remaining "free float" is buyable on the market (no 100% takeover). */
export const TREASURY_RATIO = 0.3;
const TREASURY = Math.round(SHARES * TREASURY_RATIO);

/** Per-share metrics for the trading UI. Works for both real (Company-backed)
 * and synthetic external listings. */
export interface StockMetrics {
  per: number | null;
  pbr: number | null;
  roe: number | null;
}

export function stockMetrics(stock: Stock, company?: Company): StockMetrics {
  const cap = stock.price * stock.sharesOutstanding;
  if (company) {
    const book = fundamentalValue(company); // book value / equity proxy
    const annual = company.lastProfit * 4; // annualised net profit
    return {
      per: annual > 0 ? cap / annual : null,
      pbr: book > 0 ? cap / book : null,
      roe: book > 0 ? (annual / book) * 100 : null,
    };
  }
  // External listing (no Company): synthesise book from the anchor and earnings
  // from a stable baseline ROE so the ratios stay plausible.
  const book = (stock.anchor ?? stock.price) * stock.sharesOutstanding;
  const r = stock.roeBase ?? 0.1;
  const annual = book * r;
  return {
    per: annual > 0 ? cap / annual : null,
    pbr: book > 0 ? cap / book : null,
    roe: r * 100,
  };
}

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
      treasury: TREASURY,
    };
  }
  return out;
}

const EXT_BASE_VALUE = 700_000; // synthetic enterprise value base for listings

/**
 * Build the broader market: every company preset that is NOT an active in-game
 * competitor, plus extra fictional listings. These are fully investable but
 * have no Company object, so prices follow a synthetic anchor + random walk.
 */
export function createExternalStocks(
  companies: Company[],
  rng: RngState,
): Record<string, Stock> {
  const taken = new Set(companies.map((c) => c.basedOn).filter(Boolean) as string[]);
  const listings: CompanyPreset[] = [
    ...COMPANY_PRESETS.filter((p) => !taken.has(p.id)),
    ...EXTRA_LISTINGS,
  ];
  const out: Record<string, Stock> = {};
  for (const p of listings) {
    const industry = getIndustry(p.industryId);
    const ev =
      EXT_BASE_VALUE *
      p.scale *
      (1 + industry.trend * 6) *
      nextRange(rng, 0.7, 1.4);
    const fair = ev / SHARES;
    const price = Math.max(5, round2(fair));
    out[p.id] = {
      companyId: p.id,
      price,
      history: [price],
      sharesOutstanding: SHARES,
      treasury: TREASURY,
      external: true,
      name: p.name,
      logoColor: p.logoColor,
      industryId: p.industryId,
      countryId: p.countryId,
      anchor: fair,
      roeBase: nextRange(rng, 0.05, 0.2),
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
    if (!company) {
      // External listing (no Company): synthetic anchor + random walk.
      if (stock.external) tickExternalStock(stock, macro, config, rng);
      continue;
    }

    const fair = fundamentalValue(company) / stock.sharesOutstanding;
    const gap = (fair - stock.price) / stock.price;
    const industry = getIndustry(company.industryId);

    const drift =
      gap * 0.25 + // mean-reversion toward fundamentals
      macro.sentiment * 0.03 +
      industry.trend;
    // Noise kept below typical event shocks (3–9%) so news clearly leads the
    // move instead of being drowned out by random walk.
    const noise = nextGaussian(rng, 0, 0.025 * industry.volatility * config.volatility);

    stock.price = Math.max(1, stock.price * (1 + drift + noise));
    stock.history.push(round2(stock.price));
    if (stock.history.length > 60) stock.history.shift();
  }
}

/** Advance one external (no-Company) listing toward its drifting anchor. */
function tickExternalStock(
  stock: Stock,
  macro: MacroState,
  config: LevelConfig,
  rng: RngState,
): void {
  const industry = stock.industryId ? getIndustry(stock.industryId) : null;
  const trend = industry?.trend ?? 0.01;
  const vol = industry?.volatility ?? 1;

  // Anchor (fundamental baseline) drifts slowly with the industry trend.
  const anchor = (stock.anchor ?? stock.price) * (1 + trend + nextGaussian(rng, 0, 0.01));
  stock.anchor = anchor;

  const gap = (anchor - stock.price) / stock.price;
  const drift = gap * 0.2 + macro.sentiment * 0.03 + trend;
  const noise = nextGaussian(rng, 0, 0.03 * vol * config.volatility);

  stock.price = Math.max(1, stock.price * (1 + drift + noise));
  stock.history.push(round2(stock.price));
  if (stock.history.length > 60) stock.history.shift();
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
  // Events fire after tickStocks pushed this turn's bar, so sync the latest
  // history point with the shocked price. Otherwise the news move only shows
  // up next turn, blended with fresh noise/mean-reversion — making prices look
  // like they react randomly rather than to the news.
  if (s.history.length) s.history[s.history.length - 1] = round2(s.price);
}

/** Apply a market-wide shock to every stock (e.g. crash / rally). */
export function shockMarket(stocks: Record<string, Stock>, pct: number): void {
  for (const id of Object.keys(stocks)) shockStock(stocks, id, pct);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
