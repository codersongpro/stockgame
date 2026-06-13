import type { CountryDef, EconomyPhase, LevelConfig, MacroState } from "./types";
import { type RngState, nextGaussian, nextInt, weightedPick } from "./rng";

// Macro economy: business cycle phases, price regimes (inflation / deflation /
// stagflation) and central-bank monetary policy (rate hikes & cuts).

export const PHASE_LABELS: Record<EconomyPhase, string> = {
  boom: "호황",
  normal: "안정",
  recession: "경기침체",
  inflation: "인플레이션",
  deflation: "디플레이션",
  stagflation: "스태그플레이션",
};

export const PHASE_EMOJI: Record<EconomyPhase, string> = {
  boom: "🚀",
  normal: "🙂",
  recession: "📉",
  inflation: "🔥",
  deflation: "🧊",
  stagflation: "🌫️",
};

export function createMacro(country: CountryDef, rng: RngState): MacroState {
  return {
    phase: "normal",
    gdpGrowth: country.baseGrowth,
    inflation: country.baseInflation,
    interestRate: country.baseRate,
    sentiment: 0,
    phaseTurnsLeft: nextInt(rng, 3, 6),
  };
}

// Transition probabilities between phases (kept simple but plausible).
const TRANSITIONS: Record<EconomyPhase, { item: EconomyPhase; weight: number }[]> = {
  normal: [
    { item: "normal", weight: 3 },
    { item: "boom", weight: 2 },
    { item: "recession", weight: 1.5 },
    { item: "inflation", weight: 1.5 },
  ],
  boom: [
    { item: "boom", weight: 2 },
    { item: "inflation", weight: 2.5 },
    { item: "normal", weight: 2 },
  ],
  recession: [
    { item: "recession", weight: 2 },
    { item: "normal", weight: 2.5 },
    { item: "deflation", weight: 1.5 },
    { item: "stagflation", weight: 1 },
  ],
  inflation: [
    { item: "inflation", weight: 2 },
    { item: "normal", weight: 2 },
    { item: "stagflation", weight: 1.5 },
    { item: "boom", weight: 1 },
  ],
  deflation: [
    { item: "deflation", weight: 1.5 },
    { item: "recession", weight: 2 },
    { item: "normal", weight: 2 },
  ],
  stagflation: [
    { item: "stagflation", weight: 2 },
    { item: "recession", weight: 2 },
    { item: "normal", weight: 1.5 },
  ],
};

interface PhaseTarget {
  growth: number;
  inflation: number;
  sentiment: number;
}

function phaseTargets(country: CountryDef, phase: EconomyPhase): PhaseTarget {
  const g = country.baseGrowth;
  const i = country.baseInflation;
  switch (phase) {
    case "boom":
      return { growth: g + 2.5, inflation: i + 1.0, sentiment: 0.6 };
    case "recession":
      return { growth: g - 3.0, inflation: i - 0.5, sentiment: -0.5 };
    case "inflation":
      return { growth: g + 0.5, inflation: i + 4.0, sentiment: -0.1 };
    case "deflation":
      return { growth: g - 1.5, inflation: -1.0, sentiment: -0.3 };
    case "stagflation":
      return { growth: g - 2.0, inflation: i + 3.5, sentiment: -0.6 };
    default:
      return { growth: g, inflation: i, sentiment: 0.1 };
  }
}

/**
 * Advance the macro economy by one turn. Mutates and returns `macro`.
 * `phaseChanged` lets the caller emit a news event when a regime shifts.
 */
export function tickEconomy(
  macro: MacroState,
  country: CountryDef,
  config: LevelConfig,
  rng: RngState,
): { phaseChanged: boolean; rateChange: number } {
  let phaseChanged = false;

  macro.phaseTurnsLeft -= 1;
  if (macro.phaseTurnsLeft <= 0) {
    const next = weightedPick(rng, TRANSITIONS[macro.phase]);
    phaseChanged = next !== macro.phase;
    macro.phase = next;
    macro.phaseTurnsLeft = nextInt(rng, 3, 6);
  }

  // Ease the indicators toward the current phase's targets with some noise.
  const t = phaseTargets(country, macro.phase);
  const noise = config.volatility;
  macro.gdpGrowth += (t.growth - macro.gdpGrowth) * 0.4 + nextGaussian(rng, 0, 0.4 * noise);
  macro.inflation += (t.inflation - macro.inflation) * 0.4 + nextGaussian(rng, 0, 0.3 * noise);
  macro.sentiment += (t.sentiment - macro.sentiment) * 0.5 + nextGaussian(rng, 0, 0.1);
  macro.sentiment = Math.max(-1, Math.min(1, macro.sentiment));

  // Central-bank policy: a Taylor-rule-ish response to inflation & growth.
  const targetRate =
    country.baseRate + (macro.inflation - country.baseInflation) * 0.8 + (macro.gdpGrowth - country.baseGrowth) * 0.2;
  const prevRate = macro.interestRate;
  macro.interestRate += (targetRate - macro.interestRate) * 0.5;
  macro.interestRate = Math.max(0, Math.min(15, macro.interestRate));
  const rateChange = macro.interestRate - prevRate;

  return { phaseChanged, rateChange };
}

/** Demand multiplier applied across the market for the current phase. */
export function demandMultiplier(macro: MacroState): number {
  return 1 + macro.gdpGrowth / 100 + macro.sentiment * 0.1;
}
