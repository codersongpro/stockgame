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
  StrategyAction,
} from "./types";
import type { TurnSummary } from "./tick";
import { getRivalry } from "./relations";
import { portfolioValue } from "./ranking";
import { hasRecentAction, recordStrategyAction } from "./strategy";
import { updateCityState } from "./city";

const CAMPAIGN_SCHEMA_VERSION = 2;

export function createCampaignProgress(level: Level): CampaignProgress {
  const firstMissionId = FIRST_CAMPAIGN_MISSION_IDS_BY_LEVEL[level];
  return {
    schemaVersion: CAMPAIGN_SCHEMA_VERSION,
    enabled: true,
    activeMissionId: firstMissionId,
    completedMissionIds: [],
    unlockedMissionIds: firstMissionId ? [firstMissionId] : [],
    bestStarsByMissionId: {},
    attemptsByMissionId: {},
    currentObjectiveState: [],
  };
}

export function recordCampaignAction(
  game: GameState,
  action: Omit<StrategyAction, "id" | "turn">,
): void {
  recordStrategyAction(game, action);
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

  updateCityState(game);
  const objectiveStates = mission.objectives.map((objective) => evaluateObjective(game, player, objective, summary));
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
  const passed = passesObjective(current, objective);

  return {
    objectiveId: objective.id,
    passed,
    current,
    target: objective.target,
  };
}

function currentValue(
  game: GameState,
  player: Company,
  objective: CampaignObjective,
  summary: TurnSummary | null,
): number {
  if (objective.kind === "decision_at_most" || objective.kind === "decision_at_least") {
    const metric = objective.metric;
    if (metric === "price"
      || metric === "productionTarget"
      || metric === "marketingBudget"
      || metric === "rndBudget"
      || metric === "welfareBudget"
      || metric === "safetyBudget") {
      return player.decisions[metric];
    }
    return 0;
  }

  if (objective.kind === "product_price_between") {
    return player.productPrices?.[objective.productIndex ?? 0] ?? player.decisions.price;
  }

  if (objective.kind === "company_metric_at_least" || objective.kind === "company_metric_at_most") {
    const metric = objective.metric;
    if (metric === "cash"
      || metric === "debt"
      || metric === "inventory"
      || metric === "quality"
      || metric === "reputation"
      || metric === "morale"
      || metric === "safety") {
      return player[metric];
    }
    return 0;
  }

  if (objective.kind === "turn_metric_at_least" || objective.kind === "turn_metric_at_most") {
    const metric = objective.metric;
    const result = summary?.playerResult;
    if (!result) return 0;
    if (metric === "revenue"
      || metric === "unitsSold"
      || metric === "unitsProduced"
      || metric === "profit"
      || metric === "quitCount") {
      return result[metric];
    }
    return 0;
  }

  if (objective.kind === "building_count_at_least") {
    return player.buildings.filter((building) =>
      building.turnsLeft <= 0 && (!objective.buildingType || building.type === objective.buildingType),
    ).length;
  }

  if (objective.kind === "district_level_at_least") {
    if (!objective.districtId) return 0;
    return game.city?.districts[objective.districtId]?.level ?? 0;
  }

  if (objective.kind === "district_synergy_at_least") {
    if (!objective.districtId) return 0;
    return game.city?.districts[objective.districtId]?.synergy ?? 0;
  }

  if (objective.kind === "hired_count_at_least") return player.hired.length;

  if (objective.kind === "role_assigned") {
    return player.hired.filter((character) => character.role && (!objective.role || character.role === objective.role)).length;
  }

  if (objective.kind === "action_recorded") {
    return objective.actionType && hasRecentAction(game, objective.actionType, objective.targetId) ? 1 : 0;
  }

  if (objective.kind === "relationship_at_most") {
    if (!objective.targetId) return 0;
    return getRivalry(game.relations, player.id, objective.targetId);
  }

  if (objective.kind === "portfolio_value_at_least") {
    return portfolioValue(player, game);
  }

  return 0;
}

function passesObjective(current: number, objective: CampaignObjective): boolean {
  if (objective.kind === "product_price_between") {
    return current >= (objective.min ?? Number.NEGATIVE_INFINITY)
      && current <= (objective.max ?? objective.target);
  }
  if (
    objective.kind === "decision_at_most"
    || objective.kind === "company_metric_at_most"
    || objective.kind === "turn_metric_at_most"
    || objective.kind === "relationship_at_most"
  ) {
    return current <= objective.target;
  }
  return current >= objective.target;
}
