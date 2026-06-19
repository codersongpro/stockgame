import type { LearningMission } from "../../learning/types";
import type { Level } from "../../engine/types";
import { elementaryLowMissions } from "./missions/elementary-low";
import {
  adultMissions,
  elementaryHighMissions,
  elementaryMidMissions,
  highMissions,
  middleMissions,
} from "./missions/level-missions";

export const MISSIONS_BY_LEVEL: Record<Level, LearningMission[]> = {
  elementary_low: elementaryLowMissions,
  elementary_mid: elementaryMidMissions,
  elementary_high: elementaryHighMissions,
  middle: middleMissions,
  high: highMissions,
  adult: adultMissions,
};

export const LEARNING_MISSIONS: LearningMission[] = Object.values(MISSIONS_BY_LEVEL).flat();

export const FIRST_MISSION_IDS_BY_LEVEL: Record<Level, string> = Object.fromEntries(
  Object.entries(MISSIONS_BY_LEVEL).map(([level, missions]) => [level, missions[0]?.id ?? ""]),
) as Record<Level, string>;

export function getLearningMission(missionId: string): LearningMission | undefined {
  return LEARNING_MISSIONS.find((mission) => mission.id === missionId);
}
