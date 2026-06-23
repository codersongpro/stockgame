import { getLevelConfig } from "./levels";
import { getCampaignMission } from "../data/learning/campaigns";
import type { CampaignProgress, GameState, Level } from "./types";
import { GAME_VERSION } from "./version";
import { createCityState } from "./city";
import { createStrategyState } from "./strategy";
import { createActionPointState, createPlayerCardState } from "./cards";
import { createPriceWarRivalState } from "./rivals";

type LegacyLevel = Level | "elementary" | "university";

const LEGACY_LEVEL_MAP: Record<LegacyLevel, Level> = {
  elementary_low: "elementary_low",
  elementary: "elementary_high",
  elementary_mid: "elementary_mid",
  elementary_high: "elementary_high",
  middle: "middle",
  high: "high",
  university: "adult",
  adult: "adult",
};

export function normalizeLevel(value: unknown): Level | null {
  if (typeof value !== "string") return null;
  return LEGACY_LEVEL_MAP[value as LegacyLevel] ?? null;
}

export function migrateSavedGame(value: unknown): GameState | null {
  if (!isRecord(value)) return null;

  const level = normalizeLevel(value.level);
  if (!level) return null;
  if (typeof value.seed !== "number") return null;
  if (typeof value.turn !== "number") return null;
  if (value.status !== "playing" && value.status !== "ended") return null;
  if (!Array.isArray(value.companies)) return null;
  if (typeof value.playerCompanyId !== "string") return null;

  const migrated = value as unknown as GameState;
  migrated.level = level;
  migrated.config = getLevelConfig(level);
  const player = migrated.companies.find((company) => company.id === migrated.playerCompanyId);
  migrated.city = createCityState(level, player);
  migrated.strategy = migrateStrategyState(value.strategy, migrated);
  migrated.campaign = migrateCampaignProgress(value.campaign);
  if (migrated.campaign?.enabled) {
    migrated.actionPoints = migrateActionPoints(value.actionPoints, level);
    migrated.cards = migrateCards(value.cards, level);
    migrated.rival = migrateRivalState(value.rival, level);
  } else {
    migrated.actionPoints = undefined;
    migrated.cards = undefined;
    migrated.rival = undefined;
  }
  migrated.version = GAME_VERSION;
  migrated.updatedAt = Date.now();
  return migrated;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function migrateCampaignProgress(value: unknown): CampaignProgress | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return undefined;
  if (value.schemaVersion !== 2) return undefined;
  if (value.enabled !== true) return undefined;
  if (typeof value.activeMissionId !== "string") return undefined;
  if (!getCampaignMission(value.activeMissionId)) return undefined;
  if (!Array.isArray(value.completedMissionIds)) return undefined;
  if (!Array.isArray(value.unlockedMissionIds)) return undefined;
  if (!isStringNumberRecord(value.bestStarsByMissionId)) return undefined;
  if (!isStringNumberRecord(value.attemptsByMissionId)) return undefined;
  if (!Array.isArray(value.currentObjectiveState)) return undefined;

  return {
    schemaVersion: 2,
    enabled: true,
    activeMissionId: value.activeMissionId,
    completedMissionIds: value.completedMissionIds.filter((item): item is string => typeof item === "string"),
    unlockedMissionIds: value.unlockedMissionIds.filter((item): item is string => typeof item === "string"),
    bestStarsByMissionId: value.bestStarsByMissionId,
    attemptsByMissionId: value.attemptsByMissionId,
    currentObjectiveState: value.currentObjectiveState
      .filter(isCampaignObjectiveState)
      .map((state) => ({
        objectiveId: state.objectiveId,
        passed: state.passed,
        current: state.current,
        target: state.target,
      })),
    lastMessage: typeof value.lastMessage === "string" ? value.lastMessage : undefined,
  };
}

function migrateStrategyState(value: unknown, game: GameState): GameState["strategy"] {
  const fallback = createStrategyState(game);
  if (!isRecord(value)) return fallback;
  const actionLog = Array.isArray(value.actionLog)
    ? value.actionLog.filter(isStrategyAction).slice(-40)
    : [];
  const majorEvents = Array.isArray(value.majorEvents)
    ? value.majorEvents.filter(isStrategyEvent).slice(-6)
    : [];
  return {
    ...fallback,
    actionLog,
    majorEvents,
  };
}

function migrateActionPoints(value: unknown, level: Level): GameState["actionPoints"] {
  const fallback = createActionPointState(level);
  if (!isRecord(value)) return fallback;
  if (typeof value.current !== "number" || typeof value.max !== "number") return fallback;
  return {
    current: Math.max(0, Math.min(value.current, value.max)),
    max: Math.max(1, value.max),
    freeActionsUsed: typeof value.freeActionsUsed === "number" ? Math.max(0, value.freeActionsUsed) : 0,
  };
}

function migrateCards(value: unknown, level: Level): GameState["cards"] {
  const fallback = createPlayerCardState(level);
  if (!isRecord(value)) return fallback;
  if (!Array.isArray(value.unlockedCardIds)
    || !Array.isArray(value.deckCardIds)
    || !Array.isArray(value.handCardIds)
    || !Array.isArray(value.discardCardIds)
    || !isStringNumberRecord(value.cooldowns)) {
    return fallback;
  }
  return {
    unlockedCardIds: value.unlockedCardIds.filter(isString),
    deckCardIds: value.deckCardIds.filter(isString),
    handCardIds: value.handCardIds.filter(isString),
    discardCardIds: value.discardCardIds.filter(isString),
    cooldowns: value.cooldowns,
    playedThisTurn: Array.isArray(value.playedThisTurn) ? value.playedThisTurn.filter(isString) : [],
  };
}

function migrateRivalState(value: unknown, level: Level): GameState["rival"] {
  const fallback = createPriceWarRivalState(level);
  if (!isRecord(value)) return fallback;
  if (value.schemaVersion !== 1) return fallback;
  if (typeof value.activeRivalId !== "string") return fallback;
  if (typeof value.chapterId !== "string") return fallback;
  if (value.status !== "active" && value.status !== "won" && value.status !== "lost") return fallback;
  if (typeof value.turnInChapter !== "number" || typeof value.turnsTotal !== "number") return fallback;
  if (typeof value.playerMarketShare !== "number" || typeof value.rivalMarketShare !== "number") return fallback;
  if (!Array.isArray(value.specialMovesUsed)) return fallback;
  return {
    schemaVersion: 1,
    activeRivalId: value.activeRivalId,
    chapterId: value.chapterId,
    status: value.status,
    turnInChapter: Math.max(0, value.turnInChapter),
    turnsTotal: Math.max(1, value.turnsTotal),
    playerMarketShare: Math.max(0, Math.min(100, value.playerMarketShare)),
    rivalMarketShare: Math.max(0, Math.min(100, value.rivalMarketShare)),
    specialMovesUsed: value.specialMovesUsed.filter(isString),
    responsesUsed: Array.isArray(value.responsesUsed) ? value.responsesUsed.filter(isString) : [],
    currentTaunt: typeof value.currentTaunt === "string" ? value.currentTaunt : fallback.currentTaunt,
    objectiveStates: Array.isArray(value.objectiveStates)
      ? value.objectiveStates.filter(isRivalObjectiveState)
      : [],
  };
}

function isStringNumberRecord(value: unknown): value is Record<string, number> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === "number" && Number.isFinite(item));
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isCampaignObjectiveState(value: unknown): value is {
  objectiveId: string;
  passed: boolean;
  current: number;
  target: number;
} {
  return isRecord(value)
    && typeof value.objectiveId === "string"
    && typeof value.passed === "boolean"
    && typeof value.current === "number"
    && typeof value.target === "number";
}

function isRivalObjectiveState(value: unknown): value is NonNullable<GameState["rival"]>["objectiveStates"][number] {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.label === "string"
    && typeof value.passed === "boolean"
    && typeof value.current === "number"
    && typeof value.target === "number";
}

function isStrategyAction(value: unknown): value is GameState["strategy"]["actionLog"][number] {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.turn === "number"
    && typeof value.type === "string"
    && typeof value.area === "string"
    && (value.targetId === undefined || typeof value.targetId === "string")
    && (value.value === undefined || typeof value.value === "number");
}

function isStrategyEvent(value: unknown): value is GameState["strategy"]["majorEvents"][number] {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.kind === "string"
    && typeof value.title === "string"
    && typeof value.body === "string"
    && value.severity === "major"
    && (value.status === "active" || value.status === "resolved")
    && typeof value.createdTurn === "number"
    && typeof value.expiresTurn === "number"
    && Array.isArray(value.responseActionTypes);
}
