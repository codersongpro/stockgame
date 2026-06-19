import type { LearningMission, LearningProfile, MissionResult, SupportMode } from "./types";

export interface SupportRecommendation {
  mode: SupportMode;
  reason: string;
}

export function recordMissionProgress(
  profile: LearningProfile,
  mission: LearningMission,
  result: MissionResult,
): LearningProfile {
  const current = profile.competencyByConcept[mission.concept] ?? {
    attempts: 0,
    successes: 0,
    bestStars: 0,
    mastery: 0,
  };
  const attempts = current.attempts + 1;
  const successes = current.successes + (result.success ? 1 : 0);
  const bestStars = Math.max(current.bestStars, result.stars);
  const successRate = successes / attempts;
  const starRate = bestStars / 3;
  const mastery = clamp((successRate * 0.65) + (starRate * 0.35), 0, 1);

  return {
    ...profile,
    competencyByConcept: {
      ...profile.competencyByConcept,
      [mission.concept]: { attempts, successes, bestStars, mastery },
    },
    recentMissionResults: [
      ...profile.recentMissionResults,
      {
        missionId: mission.id,
        concept: mission.concept,
        success: result.success,
        stars: result.stars,
        at: Date.now(),
      },
    ].slice(-6),
    updatedAt: Date.now(),
  };
}

export function recommendSupportMode(profile: LearningProfile): SupportRecommendation {
  const recent = profile.recentMissionResults.slice(-3);
  if (recent.length < 2) return { mode: "default", reason: "최근 기록이 더 필요해요." };

  const failures = recent.filter((result) => !result.success).length;
  const highStars = recent.filter((result) => result.success && result.stars >= 3).length;

  if (failures >= 2 && !profile.declinedRecommendationModes.includes("support")) {
    return { mode: "support", reason: "최근 미션에서 어려움이 보여 힌트를 더 추천해요." };
  }
  if (highStars >= 2 && !profile.declinedRecommendationModes.includes("challenge")) {
    return { mode: "challenge", reason: "최근 미션을 잘 해결해서 도전 흐름을 추천해요." };
  }
  return { mode: "default", reason: "지금 난이도를 유지해도 좋아요." };
}

export function rejectRecommendation(profile: LearningProfile, mode: SupportMode): LearningProfile {
  if (mode === "default" || profile.declinedRecommendationModes.includes(mode)) return profile;
  return {
    ...profile,
    declinedRecommendationModes: [...profile.declinedRecommendationModes, mode],
    updatedAt: Date.now(),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
