import type { Level } from "../engine/types";

export interface LearningOption {
  id: string;
  label: string;
  result: string;
  score: number;
}

export interface LearningTurn {
  id: string;
  title: string;
  body: string;
  hint: string;
  options: LearningOption[];
}

export interface LearningMission {
  id: string;
  level: Level;
  title: string;
  summary: string;
  goal: string;
  concept: string;
  nextMissionId?: string;
  turns: LearningTurn[];
}

export interface LearningProfile {
  version: number;
  displayName: string;
  completedMissionIds: string[];
  unlockedMissionIds: string[];
  bestStarsByMissionId: Record<string, number>;
  attemptsByMissionId: Record<string, number>;
  competencyByConcept: Record<string, ConceptCompetency>;
  recentMissionResults: RecentMissionResult[];
  declinedRecommendationModes: SupportMode[];
  updatedAt: number;
}

export type SupportMode = "support" | "default" | "challenge";

export interface ConceptCompetency {
  attempts: number;
  successes: number;
  bestStars: number;
  mastery: number;
}

export interface RecentMissionResult {
  missionId: string;
  concept: string;
  success: boolean;
  stars: number;
  at: number;
}

export interface MissionAttempt {
  mission: LearningMission;
  profile: LearningProfile;
  turnIndex: number;
  score: number;
  choices: { turnId: string; optionId: string; score: number }[];
}

export interface MissionResult {
  missionId: string;
  success: boolean;
  stars: number;
  canRetry: boolean;
  totalScore: number;
  message: string;
}

export interface MissionState {
  attempt: MissionAttempt;
  profile: LearningProfile;
  result: MissionResult | null;
  feedback: string;
}
