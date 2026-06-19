import { getLevelConfig } from "./levels";
import type { GameState, Level } from "./types";
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
  migrated.version = GAME_VERSION;
  migrated.updatedAt = Date.now();
  return migrated;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
