import type {
  GameState,
  StrategyAction,
  StrategyActionType,
  StrategyEvent,
  StrategyEventKind,
  StrategyState,
} from "./types";
import type { CompanyTurnEffects } from "./company";
import { getRivalry } from "./relations";
import { weightedPick } from "./rng";

const RESPONSE_BY_EVENT: Record<StrategyEventKind, StrategyActionType[]> = {
  rival_price_pressure: [],
  talent_poach: ["hire", "poach", "salary", "company_action"],
  supply_problem: ["decision", "build", "company_action"],
  customer_complaint: ["company_action", "decision"],
  investor_visit: ["stock_trade", "asset_trade", "loan", "company_action"],
  equipment_breakdown: ["build", "upgrade", "company_action", "decision"],
  logistics_delay: ["build", "decision", "company_action"],
  safety_inspection: ["decision", "build", "company_action"],
  local_festival: ["company_action", "decision", "build"],
  viral_trend: ["company_action", "decision", "product_price"],
  cyber_incident: ["company_action", "decision", "hire"],
  regulation_inspection: ["decision", "company_action", "loan"],
};

const GUIDE_BY_EVENT: Record<StrategyEventKind, string[]> = {
  rival_price_pressure: ["대표 상품 가격 점검", "홍보 또는 R&D 예산 조정", "경쟁 분석 아이템 사용"],
  talent_poach: ["핵심 인재 영입", "급여 협상", "직원 사기 관리"],
  supply_problem: ["생산량 조정", "창고나 생산 구역 보강", "예비 원자재 사용"],
  customer_complaint: ["품질 개선", "고객 보상", "안전과 평판 관리"],
  investor_visit: ["현금과 부채 점검", "투자 포트폴리오 정리", "회사 신뢰도 높이기"],
  equipment_breakdown: ["설비 수리", "안전 예산 점검", "생산 목표 낮추기"],
  logistics_delay: ["창고 정리", "배송 대응", "재고와 생산량 맞추기"],
  safety_inspection: ["안전 예산 올리기", "복지/안전 건물 보강", "안전 점검 아이템 사용"],
  local_festival: ["지역 홍보", "판매 물량 준비", "행사 부스 활용"],
  viral_trend: ["홍보 강화", "품질 유지", "빠른 배송 준비"],
  cyber_incident: ["전문가 도움", "운영 안정화", "언론 대응"],
  regulation_inspection: ["안전과 품질 점검", "부채 부담 줄이기", "전문가 자문"],
};

type EventCandidate = {
  kind: StrategyEventKind;
  weight: number;
  rivalCompanyId?: string;
};

let actionCounter = 0;

export function createStrategyState(game?: GameState): StrategyState {
  return {
    actionLog: [],
    majorEvents: [],
    rivalryPressureByCompanyId: game ? calculateRivalryPressure(game) : {},
  };
}

export function recordStrategyAction(
  game: GameState,
  action: Omit<StrategyAction, "id" | "turn">,
): StrategyAction {
  if (!game.strategy) game.strategy = createStrategyState(game);
  const entry: StrategyAction = {
    id: `act-${game.turn}-${actionCounter++}`,
    turn: game.turn,
    ...action,
  };
  game.strategy.actionLog = [...game.strategy.actionLog, entry].slice(-40);
  resolveMajorEvents(game, entry.type);
  return entry;
}

export function updateStrategyState(game: GameState): StrategyState {
  if (!game.strategy) game.strategy = createStrategyState(game);
  game.strategy.rivalryPressureByCompanyId = calculateRivalryPressure(game);
  game.strategy.majorEvents = [
    ...game.strategy.majorEvents.filter(
      (event) => event.status === "active" && event.expiresTurn >= game.turn,
    ),
    ...createMajorEvents(game),
  ].slice(-6);
  return game.strategy;
}

export function hasRecentAction(
  game: GameState,
  type: StrategyActionType,
  targetId?: string,
): boolean {
  return (game.strategy?.actionLog ?? []).some((action) =>
    action.type === type && (targetId === undefined || action.targetId === targetId),
  );
}

export function getStrategyEventGuide(event: StrategyEvent): { title: string; options: string[] } {
  return {
    title: event.title,
    options: GUIDE_BY_EVENT[event.kind],
  };
}

export function strategyTurnEffects(game: GameState): Required<CompanyTurnEffects> {
  const effects: Required<CompanyTurnEffects> = {
    productionBonus: 0,
    qualityBonus: 0,
    commerceBonus: 0,
    moraleBonus: 0,
    safetyBonus: 0,
    financeBonus: 0,
  };
  for (const event of game.strategy?.majorEvents ?? []) {
    if (event.status !== "active") continue;
    if (event.kind === "supply_problem" || event.kind === "equipment_breakdown") {
      effects.productionBonus -= 0.18;
      effects.moraleBonus -= 0.04;
    } else if (event.kind === "logistics_delay") {
      effects.productionBonus -= 0.1;
      effects.commerceBonus -= 0.08;
    } else if (event.kind === "customer_complaint") {
      effects.commerceBonus -= 0.14;
      effects.qualityBonus -= 0.03;
    } else if (event.kind === "talent_poach") {
      effects.moraleBonus -= 0.08;
    } else if (event.kind === "investor_visit") {
      effects.financeBonus -= 0.06;
    } else if (event.kind === "safety_inspection" || event.kind === "regulation_inspection") {
      effects.safetyBonus -= 0.1;
      effects.financeBonus -= 0.04;
    } else if (event.kind === "local_festival" || event.kind === "viral_trend") {
      effects.commerceBonus -= 0.05;
    } else if (event.kind === "cyber_incident") {
      effects.financeBonus -= 0.08;
      effects.commerceBonus -= 0.05;
    }
  }
  return effects;
}

function calculateRivalryPressure(game: GameState): Record<string, number> {
  const playerId = game.playerCompanyId;
  return Object.fromEntries(
    game.companies
      .filter((company) => company.id !== playerId)
      .map((company) => [company.id, getRivalry(game.relations, playerId, company.id)]),
  );
}

function createMajorEvents(game: GameState): StrategyEvent[] {
  if (!game.campaign?.enabled) return [];
  if (game.turn === 0 || game.turn % 4 !== 0) return [];
  const existingIds = new Set(game.strategy?.majorEvents.map((event) => event.id) ?? []);
  const candidates = majorEventCandidates(game);
  if (candidates.length === 0) return [];

  const picked = weightedPick(game.rng, candidates.map((candidate) => ({
    item: candidate,
    weight: candidate.weight,
  })));
  const id = `major-${picked.kind}-${game.turn}`;
  if (existingIds.has(id)) return [];

  return [buildEvent(game, picked, id)];
}

function majorEventCandidates(game: GameState): EventCandidate[] {
  const player = game.companies.find((company) => company.id === game.playerCompanyId);
  if (!player) return [];

  const rival = game.companies
    .filter((company) => company.id !== game.playerCompanyId)
    .sort((a, b) =>
      (game.strategy?.rivalryPressureByCompanyId[b.id] ?? 0) -
      (game.strategy?.rivalryPressureByCompanyId[a.id] ?? 0),
    )[0];

  const candidates: EventCandidate[] = [
    { kind: "customer_complaint", weight: player.reputation < 55 ? 24 : 8 },
    { kind: "supply_problem", weight: player.decisions.productionTarget > 400 ? 18 : 8 },
    { kind: "equipment_breakdown", weight: player.safety < 58 ? 18 : 7 },
    { kind: "logistics_delay", weight: player.inventory > 500 || player.decisions.productionTarget > 450 ? 16 : 7 },
    { kind: "safety_inspection", weight: player.safety < 65 ? 20 : 6 },
    { kind: "local_festival", weight: 10 },
    { kind: "viral_trend", weight: player.reputation >= 55 ? 12 : 6 },
    { kind: "talent_poach", weight: player.hired.length > 0 ? 12 : 4 },
  ];

  if (rival) {
    candidates.push({
      kind: "rival_price_pressure",
      weight: game.turn % 8 === 0 ? 22 : 8,
      rivalCompanyId: rival.id,
    });
  }

  if (game.config.showAdvancedMetrics) {
    candidates.push(
      { kind: "investor_visit", weight: player.cash >= 0 ? 11 : 5 },
      { kind: "cyber_incident", weight: game.level === "middle" ? 6 : 10 },
      { kind: "regulation_inspection", weight: player.debt > player.cash ? 14 : 7 },
    );
  }

  return candidates.filter((candidate) =>
    !(game.strategy?.majorEvents ?? []).some(
      (event) => event.status === "active" && event.kind === candidate.kind,
    ),
  );
}

function buildEvent(game: GameState, candidate: EventCandidate, id: string): StrategyEvent {
  const rival = candidate.rivalCompanyId
    ? game.companies.find((company) => company.id === candidate.rivalCompanyId)
    : undefined;
  const copy = eventCopy(candidate.kind, rival?.name);
  return {
    id,
    kind: candidate.kind,
    title: copy.title,
    body: copy.body,
    severity: "major",
    status: "active",
    rivalCompanyId: candidate.rivalCompanyId,
    createdTurn: game.turn,
    expiresTurn: game.turn + 3,
    responseActionTypes: RESPONSE_BY_EVENT[candidate.kind],
    recommendedItemIds: copy.recommendedItemIds,
    impactPreview: copy.impactPreview,
  };
}

function eventCopy(
  kind: StrategyEventKind,
  rivalName = "경쟁사",
): { title: string; body: string; recommendedItemIds: string[]; impactPreview: string } {
  const copy: Record<StrategyEventKind, { title: string; body: string; recommendedItemIds: string[]; impactPreview: string }> = {
    rival_price_pressure: {
      title: "경쟁사의 가격 공세",
      body: `${rivalName}가 가격 경쟁을 걸어왔습니다. 가격, 홍보, 품질 중 하나로 대응해 보세요.`,
      recommendedItemIds: ["rival-report", "alliance-invite"],
      impactPreview: "대응하지 않으면 판매 압박이 커집니다.",
    },
    talent_poach: {
      title: "핵심 인재 스카우트",
      body: "다른 회사가 우리 직원에게 접근하고 있습니다. 사기와 보상을 챙겨야 합니다.",
      recommendedItemIds: ["staff-snack", "team-dinner"],
      impactPreview: "직원 사기가 낮아질 수 있습니다.",
    },
    supply_problem: {
      title: "재료 공급 문제",
      body: "필요한 재료가 늦게 들어오고 있습니다. 생산량을 조절하거나 예비 재료를 써 보세요.",
      recommendedItemIds: ["backup-materials", "warehouse-kit"],
      impactPreview: "생산량과 직원 사기에 부담이 생깁니다.",
    },
    customer_complaint: {
      title: "고객 불만 확산",
      body: "손님들이 품질과 서비스에 불만을 보입니다. 품질, 안전, 보상으로 신뢰를 회복하세요.",
      recommendedItemIds: ["customer-coupon", "apology-gift", "quality-pass"],
      impactPreview: "평판과 판매력이 낮아집니다.",
    },
    investor_visit: {
      title: "투자자 방문",
      body: "투자자가 회사 운영을 살펴보러 옵니다. 현금, 부채, 신뢰도를 정리하면 기회가 됩니다.",
      recommendedItemIds: ["investor-intro", "expert-advice", "interest-cut"],
      impactPreview: "준비가 부족하면 금융 평가가 낮아집니다.",
    },
    equipment_breakdown: {
      title: "설비 고장",
      body: "생산 설비가 멈춰 섰습니다. 수리하거나 안전 예산을 챙기면 피해를 줄일 수 있습니다.",
      recommendedItemIds: ["repair-parts", "emergency-kit", "emergency-insurance"],
      impactPreview: "생산 효율이 떨어집니다.",
    },
    logistics_delay: {
      title: "물류 지연",
      body: "물건이 제때 나가지 못하고 있습니다. 창고 정리와 배송 대응이 필요합니다.",
      recommendedItemIds: ["fast-delivery", "warehouse-kit", "backup-materials"],
      impactPreview: "판매와 생산 흐름이 흔들립니다.",
    },
    safety_inspection: {
      title: "안전 점검",
      body: "현장 안전을 확인하는 점검이 시작됐습니다. 안전 예산과 복지 구역을 챙겨 보세요.",
      recommendedItemIds: ["safety-checklist", "emergency-kit", "staff-snack"],
      impactPreview: "안전 점수가 낮으면 운영 부담이 커집니다.",
    },
    local_festival: {
      title: "지역 축제 기회",
      body: "동네 축제가 열립니다. 홍보와 판매 물량을 준비하면 새 손님을 만날 수 있습니다.",
      recommendedItemIds: ["local-promo", "event-booth", "fast-delivery"],
      impactPreview: "준비하지 못하면 판매 기회를 놓칩니다.",
    },
    viral_trend: {
      title: "바이럴 유행",
      body: "우리 상품이 갑자기 주목받고 있습니다. 품질과 배송을 지키면 평판이 크게 오릅니다.",
      recommendedItemIds: ["event-booth", "press-response", "research-notes"],
      impactPreview: "품질이 흔들리면 반대로 불만이 커집니다.",
    },
    cyber_incident: {
      title: "사이버 사고",
      body: "주문과 고객 정보 관리에 문제가 생겼습니다. 전문가 도움과 언론 대응이 필요합니다.",
      recommendedItemIds: ["expert-advice", "press-response", "emergency-insurance"],
      impactPreview: "금융과 평판 압박이 생깁니다.",
    },
    regulation_inspection: {
      title: "규제 점검",
      body: "품질, 안전, 재무 상태를 확인하는 점검이 들어왔습니다. 차분히 기준을 맞춰야 합니다.",
      recommendedItemIds: ["safety-checklist", "quality-pass", "expert-advice"],
      impactPreview: "준비가 부족하면 안전과 비용 부담이 커집니다.",
    },
  };
  return copy[kind];
}

function resolveMajorEvents(game: GameState, actionType: StrategyActionType): void {
  if (!game.strategy?.majorEvents.length) return;
  game.strategy.majorEvents = game.strategy.majorEvents.map((event) =>
    event.status === "active" && event.responseActionTypes.includes(actionType)
      ? { ...event, status: "resolved" }
      : event,
  );
}
