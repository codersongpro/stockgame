import type { LearningMission, LearningProfile, MissionAttempt, MissionResult, MissionState } from "./types";
import { FIRST_MISSION_IDS_BY_LEVEL } from "../data/learning/chapters";
import { recordMissionProgress } from "./adaptation";

export const LEARNING_VERSION = 1;
export const FIRST_MISSION_ID = "el-coin-shop-1";
const DEFAULT_UNLOCKED_MISSIONS = Object.values(FIRST_MISSION_IDS_BY_LEVEL).filter(Boolean);

export function createLearningProfile(displayName: string): LearningProfile {
  return {
    version: LEARNING_VERSION,
    displayName: cleanDisplayName(displayName),
    completedMissionIds: [],
    unlockedMissionIds: DEFAULT_UNLOCKED_MISSIONS,
    bestStarsByMissionId: {},
    attemptsByMissionId: {},
    competencyByConcept: {},
    recentMissionResults: [],
    declinedRecommendationModes: [],
    updatedAt: Date.now(),
  };
}

export function cleanDisplayName(displayName: string): string {
  return displayName.trim().slice(0, 12);
}

export function getMissionState(
  profile: LearningProfile,
  missionId: string,
): "completed" | "available" | "locked" {
  if (profile.completedMissionIds.includes(missionId)) return "completed";
  if (profile.unlockedMissionIds.includes(missionId)) return "available";
  return "locked";
}

export function startMission(mission: LearningMission, profile: LearningProfile): MissionAttempt {
  return {
    mission,
    profile,
    turnIndex: 0,
    score: 0,
    choices: [],
  };
}

export function chooseMissionOption(attempt: MissionAttempt, optionId: string): MissionState {
  const turn = attempt.mission.turns[attempt.turnIndex];
  const option = turn?.options.find((item) => item.id === optionId);
  if (!turn || !option) {
    return { attempt, profile: attempt.profile, result: null, feedback: "다시 골라 보세요." };
  }

  const nextAttempt: MissionAttempt = {
    ...attempt,
    turnIndex: attempt.turnIndex + 1,
    score: attempt.score + option.score,
    choices: [...attempt.choices, { turnId: turn.id, optionId, score: option.score }],
  };

  if (nextAttempt.turnIndex < attempt.mission.turns.length) {
    return { attempt: nextAttempt, profile: attempt.profile, result: null, feedback: option.result };
  }

  const result = finishMission(nextAttempt);
  const profile = recordMissionProgress(applyMissionResult(attempt.profile, attempt.mission, result), attempt.mission, result);
  return {
    attempt: { ...nextAttempt, profile },
    profile,
    result,
    feedback: option.result,
  };
}

function finishMission(attempt: MissionAttempt): MissionResult {
  const maxScore = attempt.mission.turns.length * 2;
  const success = attempt.score >= Math.ceil(maxScore * 0.6);
  const stars = success ? Math.max(1, Math.min(3, Math.ceil((attempt.score / maxScore) * 3))) : 0;

  return {
    missionId: attempt.mission.id,
    success,
    stars,
    canRetry: true,
    totalScore: attempt.score,
    message: success ? "좋은 선택이었어요. 다음 미션이 열렸어요." : "괜찮아요. 다른 방법으로 다시 해 봐요.",
  };
}

function applyMissionResult(
  profile: LearningProfile,
  mission: LearningMission,
  result: MissionResult,
): LearningProfile {
  const completed = new Set(profile.completedMissionIds);
  const unlocked = new Set(profile.unlockedMissionIds);
  const attempts = { ...profile.attemptsByMissionId };
  const bestStars = { ...profile.bestStarsByMissionId };

  attempts[mission.id] = (attempts[mission.id] ?? 0) + 1;
  if (result.success) {
    completed.add(mission.id);
    if (mission.nextMissionId) unlocked.add(mission.nextMissionId);
    bestStars[mission.id] = Math.max(bestStars[mission.id] ?? 0, result.stars);
  }

  return {
    ...profile,
    completedMissionIds: [...completed],
    unlockedMissionIds: [...unlocked],
    attemptsByMissionId: attempts,
    bestStarsByMissionId: bestStars,
    updatedAt: Date.now(),
  };
}
