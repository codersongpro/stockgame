import type { CharacterRole, CityDistrictId, GameState } from "./types";

type FocusStatus = "strong" | "growing" | "empty" | "good";

export interface DistrictFocus {
  id: CityDistrictId;
  label: string;
  status: FocusStatus;
  level: number;
  message: string;
}

export interface TalentFocus {
  role: CharacterRole;
  label: string;
  name: string;
  status: FocusStatus;
  message: string;
}

export interface OperationsGuide {
  districtFocus: DistrictFocus[];
  talentFocus: TalentFocus[];
  nextStep: string;
}

const DISTRICT_LABELS: Record<CityDistrictId, string> = {
  production: "생산 구역",
  research: "연구 구역",
  commerce: "상점 구역",
  welfare: "복지 구역",
  logistics: "물류 구역",
  finance: "금융 구역",
};

const ROLE_LABELS: Record<CharacterRole, string> = {
  ceo: "대표",
  cto: "연구 책임자",
  cmo: "홍보 책임자",
  cfo: "돈 관리 책임자",
  coo: "운영 책임자",
  chro: "직원 책임자",
};

export function getOperationsGuide(game: GameState): OperationsGuide {
  const player = game.companies.find((company) => company.id === game.playerCompanyId);
  const districts = Object.values(game.city.districts)
    .filter((district) => district.unlocked)
    .map((district) => ({
      id: district.id,
      label: DISTRICT_LABELS[district.id],
      status: district.level >= 3 ? "strong" as const : district.level > 0 ? "growing" as const : "empty" as const,
      level: district.level,
      message: messageForDistrict(district.id, district.level, game.config.simplifiedLabels),
    }))
    .sort((a, b) => b.level - a.level || a.label.localeCompare(b.label));

  const talentFocus = (player?.hired ?? [])
    .filter((character) => character.role)
    .map((character) => ({
      role: character.role!,
      label: ROLE_LABELS[character.role!],
      name: character.name,
      status: "good" as const,
      message: `${character.name} 님이 ${ROLE_LABELS[character.role!]} 역할을 맡고 있습니다.`,
    }))
    .slice(0, 3);

  return {
    districtFocus: districts.slice(0, 4),
    talentFocus,
    nextStep: nextStepFor(game, districts, talentFocus.length),
  };
}

function messageForDistrict(id: CityDistrictId, level: number, simple: boolean): string {
  if (simple) {
    if (id === "production") return level > 0 ? "물건을 만들 준비가 되어 있어요." : "물건 만드는 곳을 세워 보세요.";
    if (id === "commerce") return level > 0 ? "손님을 만날 준비가 되어 있어요." : "손님을 만나는 곳을 만들어 보세요.";
    if (id === "welfare") return level > 0 ? "직원이 쉬는 곳이 있어요." : "직원이 쉬는 곳을 만들어 보세요.";
    return "회사를 도와주는 곳이에요.";
  }
  if (id === "production") return level >= 3 ? "생산 흐름이 안정적입니다." : "공장과 전력 건물을 가까이 두면 생산이 좋아집니다.";
  if (id === "research") return level >= 3 ? "품질을 올릴 기반이 좋습니다." : "연구소와 실험실을 붙이면 품질 성장이 빨라집니다.";
  if (id === "commerce") return level >= 3 ? "손님을 모으는 힘이 좋습니다." : "상점과 사무실을 세우면 판매가 좋아집니다.";
  if (id === "welfare") return level >= 3 ? "직원 사기가 안정적입니다." : "복지 시설은 직원 사기와 안전을 지켜 줍니다.";
  if (id === "logistics") return level >= 3 ? "재고 처리 흐름이 좋습니다." : "창고를 세우면 재고 관리가 편해집니다.";
  return level >= 3 ? "자금 관리 기반이 좋습니다." : "사무실을 세우면 비용 관리가 좋아집니다.";
}

function nextStepFor(game: GameState, districts: DistrictFocus[], talentCount: number): string {
  if (game.config.simplifiedLabels) {
    const empty = districts.find((district) => district.status === "empty");
    if (empty) return `${empty.label}을 하나 만들어 보세요.`;
    if (talentCount === 0) return "도와줄 직원을 한 명 데려와 보세요.";
    return "가격과 만들 물건 수를 보고 다음 분기로 넘어가 보세요.";
  }
  const weakResearch = districts.find((district) => district.id === "research" && district.level < 2);
  if (weakResearch) return "품질 목표가 있다면 연구 구역과 연구 책임자를 먼저 강화하세요.";
  const weakCommerce = districts.find((district) => district.id === "commerce" && district.level < 2);
  if (weakCommerce) return "라이벌 압박이 있다면 상점 구역과 홍보 책임자를 강화하세요.";
  if (talentCount === 0) return "핵심 역할을 맡을 인재를 영입해 구역 효과를 운영으로 연결하세요.";
  return "강한 구역과 담당 인물을 함께 세워 캠페인 목표를 안정적으로 달성하세요.";
}
