import type {
  GameState,
  StrategyAction,
  StrategyActionType,
  StrategyEvent,
  StrategyEventKind,
  StrategyState,
} from "./types";
import { getRivalry } from "./relations";

const RESPONSE_BY_EVENT: Record<StrategyEventKind, StrategyActionType[]> = {
  rival_price_pressure: ["product_price", "decision", "company_action"],
  talent_poach: ["hire", "poach", "salary", "company_action"],
  supply_problem: ["decision", "build", "company_action"],
  customer_complaint: ["company_action", "decision"],
  investor_visit: ["stock_trade", "asset_trade", "loan", "company_action"],
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
      : "고객들이 품질과 서비스에 더 민감해졌습니다. 품질, 안전, 홍보 활동으로 신뢰를 회복하세요.",
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
