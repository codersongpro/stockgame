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

const RESPONSE_BY_EVENT: Record<StrategyEventKind, StrategyActionType[]> = {
  rival_price_pressure: [],
  talent_poach: ["hire", "poach", "salary", "company_action"],
  supply_problem: ["decision", "build", "company_action"],
  customer_complaint: ["company_action", "decision"],
  investor_visit: ["stock_trade", "asset_trade", "loan", "company_action"],
};

const GUIDE_BY_EVENT: Record<StrategyEventKind, string[]> = {
  rival_price_pressure: ["대표 상품 가격 조정", "마케팅 홍보 실행", "마케팅 또는 R&D 예산 조정"],
  talent_poach: ["핵심 인재 영입", "연봉 협상", "직원 사기 관리"],
  supply_problem: ["창고나 생산 구역 보강", "생산량 조정", "운영 행동 실행"],
  customer_complaint: ["마케팅 홍보로 신뢰 회복", "R&D 예산으로 품질 개선", "안전 예산으로 불안 줄이기"],
  investor_visit: ["대출 상환 또는 현금 확보", "주식·예금 정리", "회사 행동으로 신뢰 높이기"],
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
    if (event.kind === "supply_problem") {
      effects.productionBonus -= 0.18;
      effects.moraleBonus -= 0.04;
    } else if (event.kind === "customer_complaint") {
      effects.commerceBonus -= 0.14;
      effects.qualityBonus -= 0.03;
    } else if (event.kind === "talent_poach") {
      effects.moraleBonus -= 0.08;
    } else if (event.kind === "investor_visit") {
      effects.financeBonus -= 0.06;
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
  if (game.turn === 0 || game.turn % 4 !== 0) return [];
  const existingIds = new Set(game.strategy?.majorEvents.map((event) => event.id) ?? []);
  const rival = game.companies
    .filter((company) => company.id !== game.playerCompanyId)
    .sort((a, b) =>
      (game.strategy?.rivalryPressureByCompanyId[b.id] ?? 0) -
      (game.strategy?.rivalryPressureByCompanyId[a.id] ?? 0),
    )[0];
  if (!rival) return [];

  const kind: StrategyEventKind = game.turn % 8 === 0 ? "rival_price_pressure" : "customer_complaint";
  const id = `major-${kind}-${game.turn}`;
  if (existingIds.has(id)) return [];

  return [{
    id,
    kind,
    title: kind === "rival_price_pressure" ? "경쟁사의 가격 공세" : "고객 불만 확산",
    body: kind === "rival_price_pressure"
      ? `${rival.name}이 가격 경쟁을 걸어왔습니다. 가격, 생산량, 홍보 중 하나로 대응하세요.`
      : "고객들이 품질과 서비스에 민감해졌습니다. 품질, 안전, 홍보 행동으로 신뢰를 회복하세요.",
    severity: "major",
    status: "active",
    rivalCompanyId: rival.id,
    createdTurn: game.turn,
    expiresTurn: game.turn + 3,
    responseActionTypes: RESPONSE_BY_EVENT[kind],
  }];
}

function resolveMajorEvents(game: GameState, actionType: StrategyActionType): void {
  if (!game.strategy?.majorEvents.length) return;
  game.strategy.majorEvents = game.strategy.majorEvents.map((event) =>
    event.status === "active" && event.responseActionTypes.includes(actionType)
      ? { ...event, status: "resolved" }
      : event,
  );
}
