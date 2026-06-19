import { FIRST_MISSION_IDS_BY_LEVEL } from "../data/learning/chapters";
import { LEARNING_VERSION, cleanDisplayName } from "./missionEngine";
import type { ConceptCompetency, LearningProfile, RecentMissionResult, SupportMode } from "./types";

export function saveLearningProgress(profile: LearningProfile): string {
  return JSON.stringify(normalizeProfile(profile));
}

export function loadLearningProgress(raw: string | null): LearningProfile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (!Array.isArray(parsed.completedMissionIds)) return null;
    if (!Array.isArray(parsed.unlockedMissionIds)) return null;

    return normalizeProfile({
      version: LEARNING_VERSION,
      displayName: typeof parsed.displayName === "string" ? parsed.displayName : "",
      completedMissionIds: stringsOnly(parsed.completedMissionIds),
      unlockedMissionIds: stringsOnly(parsed.unlockedMissionIds),
      bestStarsByMissionId: isRecord(parsed.bestStarsByMissionId) ? numbersOnly(parsed.bestStarsByMissionId) : {},
      attemptsByMissionId: isRecord(parsed.attemptsByMissionId) ? numbersOnly(parsed.attemptsByMissionId) : {},
      competencyByConcept: isRecord(parsed.competencyByConcept) ? competenciesOnly(parsed.competencyByConcept) : {},
      recentMissionResults: Array.isArray(parsed.recentMissionResults) ? recentResultsOnly(parsed.recentMissionResults) : [],
      declinedRecommendationModes: Array.isArray(parsed.declinedRecommendationModes)
        ? supportModesOnly(parsed.declinedRecommendationModes)
        : [],
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    });
  } catch {
    return null;
  }
}

function normalizeProfile(profile: LearningProfile): LearningProfile {
  const unlocked = new Set(stringsOnly(profile.unlockedMissionIds));
  for (const missionId of Object.values(FIRST_MISSION_IDS_BY_LEVEL)) {
    if (missionId) unlocked.add(missionId);
  }
  return {
    version: LEARNING_VERSION,
    displayName: cleanDisplayName(profile.displayName),
    completedMissionIds: uniqueStrings(profile.completedMissionIds),
    unlockedMissionIds: [...unlocked],
    bestStarsByMissionId: numbersOnly(profile.bestStarsByMissionId),
    attemptsByMissionId: numbersOnly(profile.attemptsByMissionId),
    competencyByConcept: competenciesOnly(profile.competencyByConcept),
    recentMissionResults: recentResultsOnly(profile.recentMissionResults).slice(-6),
    declinedRecommendationModes: supportModesOnly(profile.declinedRecommendationModes),
    updatedAt: Date.now(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringsOnly(values: unknown[]): string[] {
  return values.filter((value): value is string => typeof value === "string");
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(stringsOnly(values))];
}

function numbersOnly(record: Record<string, unknown>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, number] => typeof entry[1] === "number"),
  );
}

function competenciesOnly(record: Record<string, unknown>): Record<string, ConceptCompetency> {
  return Object.fromEntries(
    Object.entries(record).flatMap(([concept, value]) => {
      if (!isRecord(value)) return [];
      const attempts = typeof value.attempts === "number" ? value.attempts : 0;
      const successes = typeof value.successes === "number" ? value.successes : 0;
      const bestStars = typeof value.bestStars === "number" ? value.bestStars : 0;
      const mastery = typeof value.mastery === "number" ? Math.max(0, Math.min(1, value.mastery)) : 0;
      return [[concept, { attempts, successes, bestStars, mastery }]];
    }),
  );
}

function recentResultsOnly(values: unknown[]): RecentMissionResult[] {
  return values.flatMap((value) => {
    if (!isRecord(value)) return [];
    if (typeof value.missionId !== "string") return [];
    if (typeof value.concept !== "string") return [];
    if (typeof value.success !== "boolean") return [];
    if (typeof value.stars !== "number") return [];
    return [{
      missionId: value.missionId,
      concept: value.concept,
      success: value.success,
      stars: Math.max(0, Math.min(3, value.stars)),
      at: typeof value.at === "number" ? value.at : Date.now(),
    }];
  });
}

function supportModesOnly(values: unknown[]): SupportMode[] {
  return values.filter((value): value is SupportMode =>
    value === "support" || value === "default" || value === "challenge",
  );
}
