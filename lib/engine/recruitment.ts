import type { Rarity } from "./types";

export interface RecruitmentNegotiationProfile {
  title: string;
  badge: string;
  accentClass: string;
  minPct: number;
  maxPct: number;
  baseLoyalty: number;
  requiresReputation: boolean;
  requiredReputation: number;
  signingMonths: number;
  stepLabels: [string, string, string, string];
  quote: [string, string, string];
  perks: string[];
}

const PROFILES: Record<Rarity, RecruitmentNegotiationProfile> = {
  common: {
    title: "인재 영입 협상",
    badge: "일반",
    accentClass: "!bg-brand-600",
    minPct: 105,
    maxPct: 170,
    baseLoyalty: 70,
    requiresReputation: false,
    requiredReputation: 0,
    signingMonths: 1,
    stepLabels: ["조건 보기", "연봉 제안", "타이밍", "계약"],
    quote: [
      "제가 맡을 일을 정확히 알고 싶어요.",
      "조금만 더 챙겨 주시면 더 힘내겠습니다.",
      "좋아요. 함께 성장해 보고 싶어요.",
    ],
    perks: ["첫 달 적응 도움", "역할 자동 배치"],
  },
  rare: {
    title: "레어 인재 협상",
    badge: "레어",
    accentClass: "!bg-sky-500",
    minPct: 115,
    maxPct: 200,
    baseLoyalty: 68,
    requiresReputation: false,
    requiredReputation: 0,
    signingMonths: 1,
    stepLabels: ["조건 보기", "연봉 제안", "타이밍", "계약"],
    quote: [
      "제가 잘할 수 있는 자리가 있나요?",
      "좋은 조건이면 더 오래 함께할 수 있어요.",
      "이 정도면 꽤 마음이 움직입니다.",
    ],
    perks: ["핵심 능력 보너스", "충성도 타이밍 보너스"],
  },
  epic: {
    title: "에픽 인재 특별 협상",
    badge: "에픽",
    accentClass: "!bg-violet-600",
    minPct: 140,
    maxPct: 260,
    baseLoyalty: 62,
    requiresReputation: false,
    requiredReputation: 0,
    signingMonths: 2,
    stepLabels: ["조건 검토", "특별 제안", "타이밍", "최종 계약"],
    quote: [
      "저는 큰 프로젝트에서 실력을 보여주고 싶습니다.",
      "연봉뿐 아니라 성장 기회도 중요합니다.",
      "대표님의 제안이 꽤 흥미롭네요.",
    ],
    perks: ["핵심 프로젝트 약속", "스톡옵션 느낌 보너스", "협상 타이밍 추가 보너스"],
  },
  legendary: {
    title: "전설 인재 전용 협상",
    badge: "전설",
    accentClass: "!bg-amber-500",
    minPct: 180,
    maxPct: 350,
    baseLoyalty: 55,
    requiresReputation: true,
    requiredReputation: 60,
    signingMonths: 3,
    stepLabels: ["조건 확인", "협상", "미니게임", "최종 계약"],
    quote: [
      "제 능력에 걸맞은 대우가 필요합니다.",
      "조금 더 좋은 조건을 제시해 주신다면...",
      "이 정도라면 함께 일해볼 만 하겠군요.",
    ],
    perks: ["대표 직속 프로젝트", "최고 역할 보장", "전설 전용 충성도 보너스", "브랜드 평판 조건"],
  },
};

export function getRecruitmentNegotiationProfile(rarity: Rarity): RecruitmentNegotiationProfile {
  return PROFILES[rarity];
}
