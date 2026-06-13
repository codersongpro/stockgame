import type { AssetClass, AssetMarketItem, LevelConfig, MacroState } from "./types";
import { type RngState, nextGaussian } from "./rng";

// Non-stock investment assets. Each class reacts differently to the macro
// environment so players learn real asset-allocation trade-offs
// (safe vs risky, rate-sensitive vs inflation-hedge).

interface AssetSeed {
  id: AssetClass;
  name: string;
  emoji: string;
  price: number;
  risk: number;
  desc: string;
}

const ASSET_SEEDS: AssetSeed[] = [
  { id: "deposit", name: "예금·적금", emoji: "🏦", price: 100, risk: 0.01, desc: "안전. 금리만큼 이자가 붙어요." },
  { id: "bond", name: "채권", emoji: "📜", price: 100, risk: 0.05, desc: "안전자산. 금리와 반대로 움직여요." },
  { id: "etf", name: "ETF·펀드", emoji: "🧺", price: 100, risk: 0.12, desc: "여러 종목에 분산 투자." },
  { id: "realestate", name: "부동산", emoji: "🏠", price: 100, risk: 0.1, desc: "경기·금리에 민감, 임대수익." },
  { id: "gold", name: "금", emoji: "🥇", price: 100, risk: 0.12, desc: "위기에 강한 안전자산." },
  { id: "oil", name: "원유", emoji: "🛢️", price: 100, risk: 0.18, desc: "경기·지정학에 민감." },
  { id: "fx", name: "외환(달러)", emoji: "💵", price: 100, risk: 0.1, desc: "위험회피 때 강세." },
  { id: "crypto", name: "암호화폐", emoji: "🪙", price: 100, risk: 0.4, desc: "초고변동·고위험." },
];

export function createAssets(): Record<AssetClass, AssetMarketItem> {
  const out = {} as Record<AssetClass, AssetMarketItem>;
  for (const s of ASSET_SEEDS) {
    out[s.id] = {
      id: s.id,
      name: s.name,
      emoji: s.emoji,
      price: s.price,
      history: [s.price],
      risk: s.risk,
      desc: s.desc,
    };
  }
  return out;
}

/** Deterministic per-turn drift for an asset given the macro environment. */
function driftFor(id: AssetClass, macro: MacroState): number {
  const realRate = macro.interestRate - macro.inflation;
  switch (id) {
    case "deposit":
      return macro.interestRate / 100 / 4; // quarterly interest, low
    case "bond":
      // Bonds fall when rates rise, rise when rates fall / sentiment sours.
      return -(macro.interestRate - 3) / 100 - macro.sentiment * 0.01;
    case "etf":
      return macro.gdpGrowth / 100 + macro.sentiment * 0.03;
    case "realestate":
      return macro.gdpGrowth / 200 - (macro.interestRate - 3) / 150;
    case "gold":
      return macro.inflation / 200 - macro.sentiment * 0.02 - realRate / 300;
    case "oil":
      return macro.gdpGrowth / 150 + macro.inflation / 300;
    case "fx":
      return -macro.sentiment * 0.025 + (macro.interestRate - 3) / 300;
    case "crypto":
      return macro.sentiment * 0.06 - (macro.interestRate - 3) / 200;
    default:
      return 0;
  }
}

/** Advance all asset prices by one turn. */
export function tickAssets(
  assets: Record<AssetClass, AssetMarketItem>,
  macro: MacroState,
  config: LevelConfig,
  rng: RngState,
): void {
  for (const id of Object.keys(assets) as AssetClass[]) {
    const a = assets[id];
    const drift = driftFor(id, macro);
    const shock = nextGaussian(rng, 0, a.risk * config.volatility);
    const change = drift + shock;
    a.price = Math.max(1, a.price * (1 + change));
    a.history.push(round2(a.price));
    if (a.history.length > 60) a.history.shift();
  }
}

/** Apply an external shock (from an event) to one asset class. */
export function shockAsset(
  assets: Record<AssetClass, AssetMarketItem>,
  id: AssetClass,
  pct: number,
): void {
  const a = assets[id];
  if (!a) return;
  a.price = Math.max(1, a.price * (1 + pct));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
