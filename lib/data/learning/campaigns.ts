import type { CampaignMission, Level } from "../../engine/types";

const commonSuccess = "좋아요. 실제 회사 운영으로 목표를 해결했습니다.";
const commonRetry = "아직 목표에 닿지 않았습니다. 같은 목표를 다시 시도해 보세요.";

const missions = {
  elementary_low: [
    mission("el-coin-shop-1", "elementary_low", "첫 손님 맞이", "대표 상품 가격을 너무 비싸지 않게 정하고, 만들 물건 수를 작게 잡아 봅니다.", "가격과 수량", "회사 탭에서 대표 상품 가격과 생산량을 함께 맞추기", "company", "before_turn", [
      { id: "fair-price", label: "대표 상품 가격을 1원 이상 120원 이하로 맞추기", kind: "product_price_between", target: 120, min: 1, max: 120, productIndex: 0 },
      { id: "small-production", label: "이번에 만들 물건을 50개 이하로 정하기", kind: "decision_at_most", target: 50, metric: "productionTarget" },
    ], "회사 탭에서 첫 상품 가격과 생산량을 천천히 맞춰 보세요.", "el-coin-shop-2"),
    mission("el-coin-shop-2", "elementary_low", "돈을 남겨요", "물건을 판 뒤 회사 돈이 0보다 작아지지 않게 운영합니다.", "돈 남기기", "다음 분기 후 현금이 0원 이상 남도록 운영하기", "company", "after_turn", [
      { id: "cash-positive", label: "회사 돈을 0원 이상 남기기", kind: "company_metric_at_least", target: 0, metric: "cash" },
    ], "너무 많이 만들거나 너무 비싸게 쓰지 않으면 돈이 남습니다.", "el-coin-shop-3"),
    mission("el-coin-shop-3", "elementary_low", "상점 구역 만들기", "손님을 만나는 상점 구역을 키워 봅니다.", "가게 자리", "상점이나 사무실 건물을 지어 상점 구역 키우기", "city", "before_turn", [
      { id: "commerce-level", label: "상점 구역 레벨 1 이상 만들기", kind: "district_level_at_least", target: 1, districtId: "commerce" },
    ], "회사 지도에서 상점이나 사무실을 지으면 손님을 만나는 구역이 커집니다.", "el-coin-shop-4"),
    mission("el-coin-shop-4", "elementary_low", "도와주는 직원", "혼자 일하지 않고 도와주는 직원을 맞이합니다.", "직원", "인재 탭에서 직원 1명 이상 영입하기", "talent", "before_turn", [
      { id: "hire-one", label: "직원 1명 이상 영입하기", kind: "hired_count_at_least", target: 1 },
    ], "인재 탭에서 마음에 드는 직원을 한 명 골라 보세요.", "el-coin-shop-5"),
    mission("el-coin-shop-5", "elementary_low", "고객 믿음 지키기", "손님이 다시 찾아오도록 회사 평판을 지킵니다.", "믿음", "다음 분기 후 평판 45 이상 지키기", "company", "after_turn", [
      { id: "reputation-safe", label: "평판 45 이상 지키기", kind: "company_metric_at_least", target: 45, metric: "reputation" },
    ], "가격, 품질, 손님 반응을 함께 살피면 믿음이 지켜집니다."),
  ],
  elementary_mid: [
    mission("em-budget-1", "elementary_mid", "생산 구역 정리", "물건을 만드는 건물을 모아 생산 구역을 키웁니다.", "생산 구역", "공장이나 전력 건물로 생산 구역 레벨 1 만들기", "city", "before_turn", [
      { id: "production-district", label: "생산 구역 레벨 1 이상", kind: "district_level_at_least", target: 1, districtId: "production" },
    ], "공장 주변을 정리하면 생산 구역이 커집니다.", "em-budget-2"),
    mission("em-budget-2", "elementary_mid", "예산 넘기지 않기", "다음 분기에도 회사 돈을 조금 남겨 둡니다.", "예산", "현금 20,000원 이상 남기기", "company", "after_turn", [
      { id: "cash-reserve", label: "현금 20,000원 이상", kind: "company_metric_at_least", target: 20_000, metric: "cash" },
    ], "이번 분기에 쓸 돈과 남길 돈을 나누어 생각해 보세요.", "em-budget-3"),
    mission("em-budget-3", "elementary_mid", "직원 기운 챙기기", "직원이 오래 일할 수 있도록 사기를 지킵니다.", "직원 사기", "직원 사기 55 이상 만들기", "company", "before_turn", [
      { id: "morale", label: "직원 사기 55 이상", kind: "company_metric_at_least", target: 55, metric: "morale" },
    ], "복지 활동이나 복지 건물이 직원에게 도움이 됩니다.", "em-budget-4"),
    mission("em-budget-4", "elementary_mid", "재고를 쌓아두지 않기", "만든 물건이 너무 많이 남지 않도록 수량을 조절합니다.", "재고", "다음 분기 후 재고 180개 이하", "company", "after_turn", [
      { id: "inventory-control", label: "재고 180개 이하", kind: "company_metric_at_most", target: 180, metric: "inventory" },
    ], "수요보다 너무 많이 만들면 창고에 물건이 쌓입니다.", "em-budget-5"),
    mission("em-budget-5", "elementary_mid", "안전한 일터", "회사가 바빠져도 안전을 놓치지 않습니다.", "안전", "안전 55 이상 만들기", "company", "before_turn", [
      { id: "safety", label: "안전 55 이상", kind: "company_metric_at_least", target: 55, metric: "safety" },
    ], "안전 활동이나 안전 예산은 사고를 줄이는 데 도움이 됩니다."),
  ],
  elementary_high: [
    mission("eh-profit-1", "elementary_high", "팔릴 만큼 만들기", "예상보다 많이 만들어 재고가 커지는 일을 줄입니다.", "생산과 판매", "다음 분기 생산량 120개 이하로 운영하기", "company", "after_turn", [
      { id: "produced", label: "생산량 120개 이하", kind: "turn_metric_at_most", target: 120, metric: "unitsProduced" },
    ], "생산 목표를 먼저 낮추고 다음 분기를 확인하세요.", "eh-profit-2"),
    mission("eh-profit-2", "elementary_high", "이익 첫걸음", "비용보다 매출이 커지도록 한 분기를 운영합니다.", "이익", "다음 분기 이익 0원 이상", "company", "after_turn", [
      { id: "profit", label: "이익 0원 이상", kind: "turn_metric_at_least", target: 0, metric: "profit" },
    ], "가격, 생산량, 예산을 함께 맞추면 이익이 좋아집니다.", "eh-profit-3"),
    mission("eh-profit-3", "elementary_high", "연구 구역 열기", "더 좋은 상품을 만들기 위해 연구 공간을 준비합니다.", "연구", "연구 구역 레벨 1 이상 만들기", "city", "before_turn", [
      { id: "research-district", label: "연구 구역 레벨 1 이상", kind: "district_level_at_least", target: 1, districtId: "research" },
    ], "연구소나 실험실 건물이 연구 구역을 키웁니다.", "eh-profit-4"),
    mission("eh-profit-4", "elementary_high", "품질 올리기", "좋은 상품을 만들 수 있도록 품질을 올립니다.", "품질", "품질 25 이상", "company", "before_turn", [
      { id: "quality", label: "품질 25 이상", kind: "company_metric_at_least", target: 25, metric: "quality" },
    ], "연구 활동은 품질을 직접 올립니다.", "eh-profit-5"),
    mission("eh-profit-5", "elementary_high", "홍보 해보기", "손님에게 회사를 알리는 활동을 합니다.", "홍보", "홍보 활동 1회 이상 실행", "strategy", "before_turn", [
      { id: "marketing-action", label: "홍보 계열 활동 실행", kind: "action_recorded", target: 1, actionType: "company_action", targetId: "pr_campaign" },
    ], "회사 탭의 홍보 활동을 사용해 보세요."),
  ],
  middle: [
    mission("mid-city-1", "middle", "연구 단지 시너지", "연구 건물을 가까이 배치해 구역 시너지를 만듭니다.", "구역 시너지", "연구 구역 시너지 1 이상 만들기", "city", "before_turn", [
      { id: "research-synergy", label: "연구 구역 시너지 1 이상", kind: "district_synergy_at_least", target: 1, districtId: "research" },
    ], "연구소와 실험실을 붙여 지으면 시너지가 생깁니다.", "mid-city-2"),
    mission("mid-city-2", "middle", "부서 책임자 세우기", "적성 있는 인재를 역할에 배치해 운영력을 높입니다.", "역할 배치", "역할을 가진 직원 1명 이상 두기", "talent", "before_turn", [
      { id: "role", label: "역할 배치 직원 1명 이상", kind: "role_assigned", target: 1 },
    ], "인재를 영입하면 적성에 맞는 역할로 자동 배치됩니다.", "mid-city-3"),
    mission("mid-city-3", "middle", "시장 압박 이기기", "경쟁 속에서도 이번 분기에 판매를 만듭니다.", "경쟁", "다음 분기 판매량 40개 이상", "company", "after_turn", [
      { id: "sold", label: "판매량 40개 이상", kind: "turn_metric_at_least", target: 40, metric: "unitsSold" },
    ], "가격이 너무 높거나 품질이 낮으면 판매량이 줄어듭니다.", "mid-city-4"),
    mission("mid-city-4", "middle", "복지 구역 안정", "성장 속도가 빨라도 직원 사기를 지켜 냅니다.", "복지", "복지 구역 레벨 1 이상", "city", "before_turn", [
      { id: "welfare-district", label: "복지 구역 레벨 1 이상", kind: "district_level_at_least", target: 1, districtId: "welfare" },
    ], "식당, 공원, 인사 시설은 복지 구역을 키웁니다.", "mid-city-5"),
    mission("mid-city-5", "middle", "협상 시도", "경쟁사를 방문해 관계를 전략적으로 움직입니다.", "관계", "제휴나 협상 행동 1회 이상", "strategy", "before_turn", [
      { id: "deal", label: "경쟁사 제안 1회 이상", kind: "action_recorded", target: 1, actionType: "deal" },
    ], "방문 탭에서 경쟁사에 협력 제안을 해 보세요."),
  ],
  high: [
    mission("high-rival-1", "high", "경쟁사 공세 대응", "큰 경쟁 압박에는 실제 전략 행동으로 대응합니다.", "경쟁 대응", "전략 대응 활동 1회 이상 실행", "strategy", "before_turn", [
      { id: "response", label: "전략 대응 활동 실행", kind: "action_recorded", target: 1, actionType: "company_action", targetId: "pr_campaign" },
    ], "홍보, 가격 조정, 생산 조정 중 하나로 공세에 대응하세요.", "high-rival-2"),
    mission("high-rival-2", "high", "현금흐름 방어", "성장 중에도 현금 부족을 만들지 않습니다.", "현금흐름", "현금 150,000원 이상", "company", "after_turn", [
      { id: "cashflow", label: "현금 150,000원 이상", kind: "company_metric_at_least", target: 150_000, metric: "cash" },
    ], "건설과 투자는 좋지만 현금 여유를 남겨야 합니다.", "high-rival-3"),
    mission("high-rival-3", "high", "부채 한도 관리", "대출을 쓰더라도 감당 가능한 수준을 지킵니다.", "부채", "부채 300,000원 이하", "company", "before_turn", [
      { id: "debt", label: "부채 300,000원 이하", kind: "company_metric_at_most", target: 300_000, metric: "debt" },
    ], "대출은 속도를 주지만 이자 부담도 키웁니다.", "high-rival-4"),
    mission("high-rival-4", "high", "포트폴리오 시작", "회사 운영 외에도 시장 자산을 관찰하고 투자합니다.", "투자", "투자 행동 1회 이상", "market", "before_turn", [
      { id: "stock-trade", label: "주식 거래 1회 이상", kind: "action_recorded", target: 1, actionType: "stock_trade" },
    ], "투자 탭에서 작은 금액으로 시장을 경험해 보세요.", "high-rival-5"),
    mission("high-rival-5", "high", "물류 안정", "판매가 늘어도 재고와 물류가 흔들리지 않게 합니다.", "물류", "물류 구역 레벨 1 이상", "city", "before_turn", [
      { id: "logistics", label: "물류 구역 레벨 1 이상", kind: "district_level_at_least", target: 1, districtId: "logistics" },
    ], "창고는 재고와 물류를 다루는 핵심 건물입니다."),
  ],
  adult: [
    mission("adult-board-1", "adult", "운영 포트폴리오 균형", "사업, 현금, 투자 사이의 균형을 잡습니다.", "자산 배분", "대체 자산 거래 1회 이상", "market", "before_turn", [
      { id: "asset-trade", label: "대체 자산 거래 1회 이상", kind: "action_recorded", target: 1, actionType: "asset_trade" },
    ], "시장 상황에 맞는 자산을 소액으로 시험해 보세요.", "adult-board-2"),
    mission("adult-board-2", "adult", "레버리지 관리", "대출을 성장 도구로 쓰되 위험 한도를 넘기지 않습니다.", "레버리지", "부채 500,000원 이하", "company", "before_turn", [
      { id: "debt-limit", label: "부채 500,000원 이하", kind: "company_metric_at_most", target: 500_000, metric: "debt" },
    ], "이자율이 높을 때는 과한 부채를 피하세요.", "adult-board-3"),
    mission("adult-board-3", "adult", "지속 가능 조직", "품질, 사기, 안전을 동시에 관리합니다.", "운영 안정성", "품질 30, 사기 55, 안전 55 이상", "company", "before_turn", [
      { id: "quality", label: "품질 30 이상", kind: "company_metric_at_least", target: 30, metric: "quality" },
      { id: "morale", label: "사기 55 이상", kind: "company_metric_at_least", target: 55, metric: "morale" },
      { id: "safety", label: "안전 55 이상", kind: "company_metric_at_least", target: 55, metric: "safety" },
    ], "단기 이익보다 오래 버티는 조직 상태가 중요합니다.", "adult-board-4"),
    mission("adult-board-4", "adult", "금융 구역 열기", "운영과 투자 판단을 연결할 금융 기반을 만듭니다.", "금융 구역", "금융 구역 레벨 1 이상", "city", "before_turn", [
      { id: "finance-district", label: "금융 구역 레벨 1 이상", kind: "district_level_at_least", target: 1, districtId: "finance" },
    ], "사무실은 금융 구역의 기초가 됩니다.", "adult-board-5"),
    mission("adult-board-5", "adult", "장기 이익 보고", "이번 분기 이익과 순위를 함께 살피며 장기 운영을 점검합니다.", "성과 보고", "다음 분기 이익 50,000원 이상", "company", "after_turn", [
      { id: "profit", label: "이익 50,000원 이상", kind: "turn_metric_at_least", target: 50_000, metric: "profit" },
    ], "가격, 비용, 투자, 인재 배치를 함께 보고 다음 분기를 넘기세요."),
  ],
} satisfies Record<Level, CampaignMission[]>;

export const CAMPAIGN_MISSIONS_BY_LEVEL: Record<Level, CampaignMission[]> = missions;

export const CAMPAIGN_MISSIONS: CampaignMission[] = Object.values(CAMPAIGN_MISSIONS_BY_LEVEL).flat();

export const FIRST_CAMPAIGN_MISSION_IDS_BY_LEVEL: Record<Level, string> = Object.fromEntries(
  Object.entries(CAMPAIGN_MISSIONS_BY_LEVEL).map(([level, levelMissions]) => [level, levelMissions[0]?.id ?? ""]),
) as Record<Level, string>;

export function getCampaignMission(missionId: string): CampaignMission | undefined {
  return CAMPAIGN_MISSIONS.find((missionItem) => missionItem.id === missionId);
}

function mission(
  id: string,
  level: Level,
  title: string,
  summary: string,
  concept: string,
  targetAction: string,
  targetArea: CampaignMission["targetArea"],
  timing: CampaignMission["timing"],
  objectives: CampaignMission["objectives"],
  hint: string,
  nextMissionId?: string,
): CampaignMission {
  return {
    id,
    level,
    levelBand: level,
    title,
    summary,
    concept,
    targetAction,
    targetArea,
    timing,
    objectives,
    hint,
    successText: commonSuccess,
    retryText: commonRetry,
    nextMissionId,
  };
}
