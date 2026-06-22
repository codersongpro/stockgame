import { getRival, PRICE_WAR_CHAPTER_ID, PRICE_WAR_RIVAL_ID } from "../data/campaign/rivals";
import type { CompanyTurnResult } from "./company";
import type { GameState, Level, RivalObjectiveState, RivalState } from "./types";

const PRICE_WAR_TURNS = 5;

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

  return [
    state("cash", "현금 10만 이상 유지", cash, 100_000),
    state("reputation", "평판 60 이상 유지", reputation, 60),
    state("quality", "품질 45 이상 유지", quality, 45),
    state("market-share", "손님 점유 30% 이상", marketShare, 30),
  ];
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
