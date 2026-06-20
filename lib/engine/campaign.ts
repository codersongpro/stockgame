import {
  FIRST_CAMPAIGN_MISSION_IDS_BY_LEVEL,
  getCampaignMission,
} from "../data/learning/campaigns";
import type {
  CampaignEvaluation,
  CampaignMission,
  CampaignObjective,
  CampaignObjectiveState,
  CampaignProgress,
  Company,
  GameState,
  Level,
} from "./types";
import type { TurnSummary } from "./tick";

export function createCampaignProgress(level: Level): CampaignProgress {
  const firstMissionId = FIRST_CAMPAIGN_MISSION_IDS_BY_LEVEL[level];
  return {
    enabled: true,
    activeMissionId: firstMissionId,
    completedMissionIds: [],
    unlockedMissionIds: firstMissionId ? [firstMissionId] : [],
    bestStarsByMissionId: {},
    attemptsByMissionId: {},
    currentObjectiveState: [],
  };
}

export function getActiveCampaignMission(game: GameState): CampaignMission | undefined {
  if (!game.campaign?.enabled) return undefined;
  return getCampaignMission(game.campaign.activeMissionId);
}

export function evaluateCampaignBeforeTurn(game: GameState): CampaignEvaluation | null {
  const mission = getActiveCampaignMission(game);
  if (!mission || mission.timing !== "before_turn") return null;
  return evaluateMission(game, mission, null);
}

export function evaluateCampaignAfterTurn(
  game: GameState,
  summary: TurnSummary,
): CampaignEvaluation | null {
  const mission = getActiveCampaignMission(game);
  if (!mission || mission.timing !== "after_turn") return null;
  return evaluateMission(game, mission, summary);
}

export function advanceCampaign(game: GameState, evaluation: CampaignEvaluation | null): void {
  if (!game.campaign?.enabled || !evaluation) return;

  const mission = getCampaignMission(evaluation.missionId);
  if (!mission) return;

  const campaign = game.campaign;
  const completed = new Set(campaign.completedMissionIds);
  const unlocked = new Set(campaign.unlockedMissionIds);
  const attemptsByMissionId = { ...campaign.attemptsByMissionId };
  const bestStarsByMissionId = { ...campaign.bestStarsByMissionId };

  attemptsByMissionId[mission.id] = (attemptsByMissionId[mission.id] ?? 0) + 1;

  if (evaluation.success) {
    completed.add(mission.id);
    bestStarsByMissionId[mission.id] = Math.max(
      bestStarsByMissionId[mission.id] ?? 0,
      evaluation.stars,
    );
    if (mission.nextMissionId) unlocked.add(mission.nextMissionId);
  }

  game.campaign = {
    ...campaign,
    activeMissionId: evaluation.success && mission.nextMissionId
      ? mission.nextMissionId
      : mission.id,
    completedMissionIds: [...completed],
    unlockedMissionIds: [...unlocked],
    bestStarsByMissionId,
    attemptsByMissionId,
    currentObjectiveState: evaluation.objectiveStates,
    lastMessage: evaluation.message,
  };
}

function evaluateMission(
  game: GameState,
  mission: CampaignMission,
  summary: TurnSummary | null,
): CampaignEvaluation {
  const player = game.companies.find((company) => company.id === game.playerCompanyId);
  if (!player) {
    return {
      missionId: mission.id,
      success: false,
      stars: 0,
      message: mission.retryText,
      objectiveStates: [],
    };
  }

  const objectiveStates = mission.objectives.map((objective) =>
    evaluateObjective(game, player, objective, summary),
  );
  const passed = objectiveStates.filter((state) => state.passed).length;
  const success = passed === mission.objectives.length;
  const stars = success ? Math.max(1, Math.ceil((passed / mission.objectives.length) * 3)) : 0;

  return {
    missionId: mission.id,
    success,
    stars,
    message: success ? mission.successText : mission.retryText,
    objectiveStates,
  };
}

function evaluateObjective(
  game: GameState,
  player: Company,
  objective: CampaignObjective,
  summary: TurnSummary | null,
): CampaignObjectiveState {
  const current = currentValue(game, player, objective, summary);
  const passed = objective.kind === "production_at_most"
    ? current <= objective.target
    : current >= objective.target;

  return {
    objectiveId: objective.id,
    passed,
    current,
    target: objective.target,
  };
}

function currentValue(
  _game: GameState,
  player: Company,
  objective: CampaignObjective,
  summary: TurnSummary | null,
): number {
  if (objective.kind === "production_at_most") return player.decisions.productionTarget;
  if (objective.kind === "cash_at_least") return player.cash;
  if (objective.kind === "profit_at_least") return summary?.playerResult?.profit ?? player.lastProfit;
  if (objective.kind === "quality_at_least") return player.quality;
  return player.reputation;
}
