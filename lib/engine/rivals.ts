import { getRival, PRICE_WAR_RIVAL_ID } from "../data/campaign/rivals";
import type { CompanyTurnResult } from "./company";
import type { GameState, Level, RivalObjectiveState, RivalState, StrategyEvent } from "./types";

const PRICE_WAR_TURNS = 5;
const PRICE_PRESSURE_OPTIONS = [
  "대표 상품 가격을 조정하기",
  "마케팅 홍보로 손님 신뢰 회복하기",
  "마케팅 예산을 올려 손님에게 알리기",
  "R&D 예산으로 품질 높이기",
  "CEO 행동 카드로 빠르게 대응하기",
];

export function createPriceWarRivalState(_level: Level): RivalState {
  const rival = getRival(PRICE_WAR_RIVAL_ID)!;
  return {
    schemaVersion: 1,
    activeRivalId: rival.id,
    chapterId: rival.chapterId,
    status: "active",
    turnInChapter: 0,
    turnsTotal: PRICE_WAR_TURNS,
    playerMarketShare: 20,
    rivalMarketShare: 34,
    specialMovesUsed: [],
    responsesUsed: [],
    currentTaunt: rival.intro,
    objectiveStates: [],
  };
}

export function advanceRivalTurn(game: GameState, result: CompanyTurnResult | null): void {
  if (!game.campaign?.enabled) return;
  if (!game.rival) game.rival = createPriceWarRivalState(game.level);
  if (game.rival.status !== "active") return;

  const player = game.companies.find((company) => company.id === game.playerCompanyId);
  if (!player) return;

  const nextTurn = game.rival.turnInChapter + 1;
  const moveId = `price-cut-${nextTurn}`;
  const usedSpecial = nextTurn === 2 || nextTurn === 4;
  if (usedSpecial && !game.rival.specialMovesUsed.includes(moveId)) {
    player.reputation = Math.max(0, player.reputation - 8);
    game.rival.specialMovesUsed.push(moveId);
    addRivalPressureEvent(game, nextTurn);
  }

  const revenuePull = Math.max(0, result?.revenue ?? player.lastRevenue);
  const qualityPull = player.quality * 600;
  const reputationPull = player.reputation * 500;
  const cashPull = Math.min(80_000, player.cash) * 0.25;
  const playerPower = revenuePull + qualityPull + reputationPull + cashPull;
  const rivalPower = 90_000 + nextTurn * 4_000 + (usedSpecial ? 12_000 : 0);
  const playerShare = Math.round((playerPower / Math.max(1, playerPower + rivalPower)) * 100);
  const rivalShare = Math.max(0, 100 - playerShare);

  game.rival.turnInChapter = nextTurn;
  game.rival.playerMarketShare = playerShare;
  game.rival.rivalMarketShare = rivalShare;
  game.rival.objectiveStates = priceWarObjectives(game);

  const rival = getRival(game.rival.activeRivalId);
  if (nextTurn >= game.rival.turnsTotal) {
    const progress = priceWarProgress(game);
    game.rival.status = progress.passed >= progress.total ? "won" : "lost";
    game.rival.currentTaunt =
      game.rival.status === "won"
        ? rival?.victoryText ?? "가격 전쟁에서 이겼습니다."
        : rival?.defeatText ?? "가격 전쟁을 다시 준비해 보세요.";
    return;
  }

  const taunts = rival?.taunts ?? [];
  game.rival.currentTaunt = usedSpecial
    ? taunts[1] ?? "경쟁자가 가격을 더 낮췄습니다."
    : taunts[nextTurn % Math.max(1, taunts.length)] ?? "다음 분기를 준비해 보세요.";
}

export function respondToRivalPressure(game: GameState, _sourceId: string): boolean {
  if (!game.rival || game.rival.status !== "active") return false;
  const activeEvent = game.strategy.majorEvents.find(
    (event) => event.kind === "rival_price_pressure" && event.status === "active",
  );
  if (!activeEvent) return false;

  const moveId = game.rival.specialMovesUsed[game.rival.specialMovesUsed.length - 1];
  if (moveId && !game.rival.responsesUsed.includes(moveId)) {
    game.rival.responsesUsed.push(moveId);
    game.rival.playerMarketShare = Math.min(100, game.rival.playerMarketShare + 6);
  }
  game.strategy.majorEvents = game.strategy.majorEvents.map((event) =>
    event.id === activeEvent.id ? { ...event, status: "resolved" } : event,
  );
  game.rival.currentTaunt = "대응이 통했습니다. 손님들이 다시 우리 회사를 보고 있습니다.";
  return true;
}

export function getRivalResponseGuide(game: GameState): {
  active: boolean;
  eventId?: string;
  title?: string;
  options: string[];
} {
  const activeEvent = game.strategy?.majorEvents.find(
    (event) => event.kind === "rival_price_pressure" && event.status === "active",
  );
  if (!game.rival || !activeEvent) return { active: false, options: [] };
  return {
    active: true,
    eventId: activeEvent.id,
    title: activeEvent.title,
    options: PRICE_PRESSURE_OPTIONS,
  };
}

export function priceWarProgress(game: GameState): { passed: number; total: number } {
  const objectives = game.rival?.objectiveStates.length ? game.rival.objectiveStates : priceWarObjectives(game);
  return {
    passed: objectives.filter((objective) => objective.passed).length,
    total: objectives.length,
  };
}

function priceWarObjectives(game: GameState): RivalObjectiveState[] {
  const player = game.companies.find((company) => company.id === game.playerCompanyId);
  const cash = player?.cash ?? 0;
  const reputation = player?.reputation ?? 0;
  const quality = player?.quality ?? 0;
  const marketShare = game.rival?.playerMarketShare ?? 0;
  const responses = game.rival?.responsesUsed.length ?? 0;

  return [
    state("cash", "현금 10만 이상 유지", cash, 100_000),
    state("reputation", "평판 60 이상 유지", reputation, 60),
    state("quality", "품질 45 이상 유지", quality, 45),
    state("market-share", "손님 점유율 30% 이상", marketShare, 30),
    state("rival-response", "가격 압박 대응 1회 이상", responses, 1),
  ];
}

function addRivalPressureEvent(game: GameState, chapterTurn: number): void {
  const id = `rival-price-pressure-${chapterTurn}`;
  if (game.strategy.majorEvents.some((event) => event.id === id)) return;
  const event: StrategyEvent = {
    id,
    kind: "rival_price_pressure",
    title: "경쟁자의 가격 압박",
    body: "경쟁자가 낮은 가격으로 손님을 흔들고 있습니다. 가격, 홍보, 품질 카드 같은 실제 행동으로 대응해 보세요.",
    severity: "major",
    status: "active",
    createdTurn: game.turn,
    expiresTurn: game.turn + 2,
    responseActionTypes: [],
  };
  game.strategy.majorEvents = [...game.strategy.majorEvents, event].slice(-6);
}

function state(id: string, label: string, current: number, target: number): RivalObjectiveState {
  return {
    id,
    label,
    current: Math.round(current),
    target,
    passed: current >= target,
  };
}
