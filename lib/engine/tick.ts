import type { GameState, NewsItem } from "./types";
import { getCountry } from "../data/countries";
import { PHASE_EMOJI, PHASE_LABELS, tickEconomy } from "./economy";
import { runAiTurn } from "./ai";
import { runCompanyTurn, type CompanyTurnResult } from "./company";
import { tickStocks } from "./market";
import { tickAssets } from "./assets";
import { generateEvents } from "./events";
import { decayRelations } from "./relations";
import { recordNetWorth } from "./ranking";
import { refreshTalentPool } from "./characters";
import { nextFloat } from "./rng";

export interface TurnSummary {
  turn: number;
  playerResult: CompanyTurnResult | null;
  rateChange: number;
  phaseChanged: boolean;
  events: NewsItem[];
}

let monetaryCounter = 0;

/** Advance the whole simulation by one turn. Mutates and returns a summary. */
export function advanceTurn(state: GameState): TurnSummary {
  if (state.status === "ended") {
    return { turn: state.turn, playerResult: null, rateChange: 0, phaseChanged: false, events: [] };
  }

  const homeCountry = getCountry(
    state.companies.find((c) => c.id === state.playerCompanyId)?.countryId ?? "us",
  );

  decayRelations(state.relations);

  // 1) Macro economy + central-bank policy.
  const { phaseChanged, rateChange } = tickEconomy(
    state.macro,
    homeCountry,
    state.config,
    state.rng,
  );

  const enabled = new Set(state.config.enabledEventLayers);
  if (phaseChanged && enabled.has("macro")) {
    pushNews(state, {
      layer: "macro",
      tone: state.macro.phase === "boom" ? "positive" : state.macro.phase === "normal" ? "neutral" : "negative",
      emoji: PHASE_EMOJI[state.macro.phase],
      title: `경제 국면 전환: ${PHASE_LABELS[state.macro.phase]}`,
      body: `경제가 ${PHASE_LABELS[state.macro.phase]} 국면에 들어섰습니다.`,
      tags: ["macro", state.macro.phase],
    });
  }
  if (Math.abs(rateChange) >= 0.1 && enabled.has("monetary")) {
    const hike = rateChange > 0;
    pushNews(state, {
      layer: "monetary",
      tone: "neutral",
      emoji: hike ? "📈" : "📉",
      title: `${homeCountry.centralBank} 기준금리 ${hike ? "인상" : "인하"}`,
      body: `기준금리가 ${state.macro.interestRate.toFixed(2)}%로 ${hike ? "올랐" : "내렸"}습니다.`,
      tags: ["monetary"],
    });
  }

  // 2) AI competitors act (decisions, expansion, hiring, investing).
  for (const company of state.companies) {
    if (company.isAI) runAiTurn(state, company);
  }

  // 3) Resolve every company's operating turn.
  let playerResult: CompanyTurnResult | null = null;
  for (const company of state.companies) {
    const result = runCompanyTurn(company, state.macro, state.config, state.rng);
    if (company.id === state.playerCompanyId) playerResult = result;
  }

  // 4) Update markets.
  tickStocks(state.stocks, state.companies, state.macro, state.config, state.rng);
  tickAssets(state.assets, state.macro, state.config, state.rng);

  // 5) Fire events (shocks on top of the regular market move).
  const events = generateEvents(state);

  // 6) Record net worth history for charts/leaderboard.
  recordNetWorth(state);

  // 7) Occasionally refresh the talent pool.
  if (nextFloat(state.rng) < 0.4) {
    const hiredIds = new Set(state.companies.flatMap((c) => c.hired.map((h) => h.id)));
    state.talentPool = refreshTalentPool(state.talentPool, hiredIds, state.rng);
  }

  // 8) Advance the clock.
  state.turn += 1;
  if (state.turn >= state.maxTurns) state.status = "ended";
  state.updatedAt = Date.now();

  return { turn: state.turn, playerResult, rateChange, phaseChanged, events };
}

function pushNews(state: GameState, item: Omit<NewsItem, "id" | "turn">): void {
  state.news.push({ ...item, id: `sys-${state.turn}-${monetaryCounter++}`, turn: state.turn });
}
