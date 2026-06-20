import { getLevelConfig } from "./levels";
import { getCampaignMission } from "../data/learning/campaigns";
import type { CampaignProgress, GameState, Level } from "./types";
import { GAME_VERSION } from "./version";

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
  migrated.campaign = migrateCampaignProgress(value.campaign);
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
  if (value.enabled !== true) return undefined;
  if (typeof value.activeMissionId !== "string") return undefined;
  if (!getCampaignMission(value.activeMissionId)) return undefined;
  if (!Array.isArray(value.completedMissionIds)) return undefined;
  if (!Array.isArray(value.unlockedMissionIds)) return undefined;
  if (!isStringNumberRecord(value.bestStarsByMissionId)) return undefined;
  if (!isStringNumberRecord(value.attemptsByMissionId)) return undefined;
  if (!Array.isArray(value.currentObjectiveState)) return undefined;

  return {
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

function isStringNumberRecord(value: unknown): value is Record<string, number> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === "number" && Number.isFinite(item));
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
