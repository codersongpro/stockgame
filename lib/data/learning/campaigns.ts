import type { CampaignMission, CampaignObjective, Level } from "../../engine/types";
import { MISSIONS_BY_LEVEL } from "./chapters";

const PRODUCTION_LIMIT: Record<Level, number> = {
  elementary_low: 50,
  elementary_mid: 80,
  elementary_high: 120,
  middle: 180,
  high: 240,
  adult: 300,
};

const CASH_RESERVE: Record<Level, number> = {
  elementary_low: 0,
  elementary_mid: 20_000,
  elementary_high: 50_000,
  middle: 100_000,
  high: 150_000,
  adult: 200_000,
};

function objectiveFor(level: Level, index: number): CampaignObjective {
  const slot = index % 5;
  if (level === "elementary_low") {
    if (slot === 0) {
      return {
        id: "production-control",
        label: `다음에 만들 물건을 ${PRODUCTION_LIMIT[level].toLocaleString()}개 이하로 정하기`,
        kind: "production_at_most",
        target: PRODUCTION_LIMIT[level],
      };
    }
    if (slot === 1) {
      return {
        id: "cash-reserve",
        label: "돈을 0원보다 많이 남기기",
        kind: "cash_at_least",
        target: 0,
      };
    }
    if (slot === 2) {
      return {
        id: "profit-check",
        label: "번 돈이 쓴 돈보다 적지 않게 하기",
        kind: "profit_at_least",
        target: 0,
      };
    }
    if (slot === 3) {
      return {
        id: "quality-growth",
        label: "물건 점수를 20점 이상으로 올리기",
        kind: "quality_at_least",
        target: 20,
      };
    }
    return {
      id: "reputation-growth",
      label: "가게 믿음 점수를 50점 이상으로 만들기",
      kind: "reputation_at_least",
      target: 50,
    };
  }

  if (slot === 0) {
    return {
      id: "production-control",
      label: `다음 분기 생산 목표를 ${PRODUCTION_LIMIT[level].toLocaleString()}개 이하로 맞추기`,
      kind: "production_at_most",
      target: PRODUCTION_LIMIT[level],
    };
  }
  if (slot === 1) {
    return {
      id: "cash-reserve",
      label: `현금을 ${CASH_RESERVE[level].toLocaleString()}원 이상 남기기`,
      kind: "cash_at_least",
      target: CASH_RESERVE[level],
    };
  }
  if (slot === 2) {
    return {
      id: "profit-check",
      label: "이번 분기 손익을 0원 이상으로 만들기",
      kind: "profit_at_least",
      target: 0,
    };
  }
  if (slot === 3) {
    return {
      id: "quality-growth",
      label: "품질 점수를 20 이상으로 올리기",
      kind: "quality_at_least",
      target: 20,
    };
  }
  return {
    id: "reputation-growth",
    label: "평판 점수를 50 이상으로 만들기",
    kind: "reputation_at_least",
    target: 50,
  };
}

export const CAMPAIGN_MISSIONS_BY_LEVEL: Record<Level, CampaignMission[]> = Object.fromEntries(
  Object.entries(MISSIONS_BY_LEVEL).map(([level, missions]) => [
    level,
    missions.map((mission, index) => ({
      id: mission.id,
      level: mission.level,
      title: mission.title,
      summary: mission.summary,
      concept: mission.concept,
      timing: "after_turn",
      objectives: [objectiveFor(mission.level, index)],
      hint: mission.goal,
      successText: "좋아요. 실제 경영 선택으로 목표를 달성했어요.",
      retryText: "괜찮아요. 같은 목표를 다시 해보면 됩니다.",
      nextMissionId: mission.nextMissionId,
    })),
  ]),
) as Record<Level, CampaignMission[]>;

export const CAMPAIGN_MISSIONS: CampaignMission[] = Object.values(CAMPAIGN_MISSIONS_BY_LEVEL).flat();

export const FIRST_CAMPAIGN_MISSION_IDS_BY_LEVEL: Record<Level, string> = Object.fromEntries(
  Object.entries(CAMPAIGN_MISSIONS_BY_LEVEL).map(([level, missions]) => [level, missions[0]?.id ?? ""]),
) as Record<Level, string>;

export function getCampaignMission(missionId: string): CampaignMission | undefined {
  return CAMPAIGN_MISSIONS.find((mission) => mission.id === missionId);
}
