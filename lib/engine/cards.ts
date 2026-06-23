import {
  availableActionCardsForLevel,
  getActionCard,
} from "../data/campaign/actionCards";
import type {
  ActionCardDefinition,
  ActionPointState,
  CardEffect,
  Company,
  GameState,
  Level,
  PlayerCardState,
} from "./types";
import { recordStrategyAction } from "./strategy";
import { respondToRivalPressure } from "./rivals";

export interface CardActionResult {
  ok: boolean;
  message?: string;
  error?: string;
}

const HAND_SIZE = 4;

export function createActionPointState(level: Level): ActionPointState {
  const max = level === "elementary_low"
    ? 1
    : level === "elementary_mid" || level === "elementary_high"
      ? 2
      : level === "middle" || level === "high"
        ? 3
        : 4;
  return { current: max, max, freeActionsUsed: 0 };
}

export function createPlayerCardState(level: Level): PlayerCardState {
  const unlockedCardIds = availableActionCardsForLevel(level).map((card) => card.id);
  return {
    unlockedCardIds,
    deckCardIds: unlockedCardIds.slice(HAND_SIZE),
    handCardIds: unlockedCardIds.slice(0, HAND_SIZE),
    discardCardIds: [],
    cooldowns: {},
    playedThisTurn: [],
  };
}

export function ensureCampaignCardState(game: GameState): void {
  if (!game.campaign?.enabled) return;
  if (!game.actionPoints) game.actionPoints = createActionPointState(game.level);
  if (!game.cards) game.cards = createPlayerCardState(game.level);
}

export function refreshActionCardsForTurn(game: GameState): void {
  ensureCampaignCardState(game);
  if (!game.actionPoints || !game.cards) return;

  game.actionPoints = {
    ...game.actionPoints,
    current: game.actionPoints.max,
    freeActionsUsed: 0,
  };
  game.cards.cooldowns = Object.fromEntries(
    Object.entries(game.cards.cooldowns)
      .map(([cardId, turns]) => [cardId, Math.max(0, turns - 1)] as const)
      .filter(([, turns]) => turns > 0),
  );
  game.cards.playedThisTurn = [];

  while (game.cards.handCardIds.length < HAND_SIZE) {
    if (game.cards.deckCardIds.length === 0) {
      if (game.cards.discardCardIds.length === 0) break;
      game.cards.deckCardIds = [...game.cards.discardCardIds];
      game.cards.discardCardIds = [];
    }
    const next = game.cards.deckCardIds.shift();
    if (!next) break;
    if (!game.cards.handCardIds.includes(next)) game.cards.handCardIds.push(next);
  }
}

export function executeActionCard(game: GameState, cardId: string): CardActionResult {
  ensureCampaignCardState(game);
  const cards = game.cards;
  const actionPoints = game.actionPoints;
  const card = getActionCard(cardId);
  const player = game.companies.find((company) => company.id === game.playerCompanyId);

  if (!cards || !actionPoints || !game.campaign?.enabled) {
    return { ok: false, error: "캠페인에서만 사용할 수 있는 카드입니다." };
  }
  if (!player) return { ok: false, error: "플레이어 회사를 찾을 수 없습니다." };
  if (!card) return { ok: false, error: "없는 카드입니다." };
  if (!cards.handCardIds.includes(card.id)) {
    return { ok: false, error: "손패에 없는 카드입니다." };
  }
  if ((cards.cooldowns[card.id] ?? 0) > 0) {
    return { ok: false, error: "아직 다시 사용할 수 없는 카드입니다." };
  }
  if (actionPoints.current < card.actionPointCost) {
    return { ok: false, error: "행동력이 부족합니다." };
  }
  if ((card.cashCost ?? 0) > player.cash) {
    return { ok: false, error: "현금이 부족합니다." };
  }

  actionPoints.current -= card.actionPointCost;
  if (card.cashCost) player.cash -= card.cashCost;
  for (const effect of card.effects) applyCardEffect(player, effect);

  cards.handCardIds = cards.handCardIds.filter((id) => id !== card.id);
  cards.discardCardIds.push(card.id);
  cards.playedThisTurn.push(card.id);
  if (card.cooldownTurns) cards.cooldowns[card.id] = card.cooldownTurns;

  recordStrategyAction(game, {
    type: "card_play",
    area: areaForCard(card),
    targetId: card.id,
    value: card.actionPointCost,
  });
  respondToRivalPressure(game, card.id);

  return { ok: true, message: `${card.name} 카드 실행` };
}

function applyCardEffect(company: Company, effect: CardEffect): void {
  if (effect.kind === "production_target_delta") {
    company.decisions.productionTarget = Math.max(0, company.decisions.productionTarget + effect.value);
    return;
  }
  if (effect.kind === "product_price_multiplier") {
    const index = effect.productIndex ?? 0;
    company.productPrices[index] = Math.max(1, Math.round((company.productPrices[index] ?? company.decisions.price) * effect.value));
    return;
  }
  if (effect.kind === "inventory_delta") {
    company.inventory = Math.max(0, company.inventory + effect.value);
    if (company.productInventory.length > 0) {
      company.productInventory[0] = Math.max(0, (company.productInventory[0] ?? 0) + effect.value);
    }
    return;
  }
  if (effect.kind === "quality_delta") {
    company.quality = clampStat(company.quality + effect.value);
    return;
  }
  if (effect.kind === "reputation_delta") {
    company.reputation = clampStat(company.reputation + effect.value);
    return;
  }
  if (effect.kind === "morale_delta") {
    company.morale = clampStat(company.morale + effect.value);
    return;
  }
  if (effect.kind === "cash_delta") {
    company.cash = Math.max(0, company.cash + effect.value);
    return;
  }
  if (effect.kind === "debt_delta") {
    company.debt = Math.max(0, company.debt + effect.value);
    return;
  }
  for (const character of company.hired) {
    character.loyalty = clampStat((character.loyalty ?? 70) + effect.value);
  }
}

function areaForCard(card: ActionCardDefinition): "company" | "city" | "talent" | "strategy" | "market" {
  if (card.category === "people") return "talent";
  if (card.category === "finance") return "market";
  if (card.category === "marketing" || card.category === "ethics") return "strategy";
  return "company";
}

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}
