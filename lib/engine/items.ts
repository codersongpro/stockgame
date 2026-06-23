import {
  ITEM_DEFINITIONS,
  availableItemsForLevel,
  getItemDefinition,
  isItemAllowedForLevel,
} from "../data/campaign/items";
import { nextFloat, weightedPick } from "./rng";
import type {
  Company,
  GameState,
  ItemDefinition,
  ItemInventory,
  ItemRarity,
  ItemRewardReason,
  ItemRewardRecord,
  Level,
  StrategyEvent,
} from "./types";
import type { TurnSummary } from "./tick";

export const ITEM_SCHEMA_VERSION = 1;

const RARITY_ORDER: ItemRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

export function createItemInventory(level: Level): ItemInventory {
  const starterIds = level === "elementary_low"
    ? ["customer-coupon", "staff-snack"]
    : ["customer-coupon", "repair-parts", "staff-snack"];
  const quantitiesByItemId: Record<string, number> = {};
  for (const id of starterIds) {
    const item = getItemDefinition(id);
    if (item && isItemAllowedForLevel(item, level)) quantitiesByItemId[id] = 1;
  }
  return {
    schemaVersion: ITEM_SCHEMA_VERSION,
    quantitiesByItemId,
    usedThisTurn: [],
    recentRewards: [],
  };
}

export function normalizeItemInventory(value: unknown, level: Level): ItemInventory {
  const fallback = createItemInventory(level);
  if (!isRecord(value)) return fallback;
  if (value.schemaVersion !== ITEM_SCHEMA_VERSION) return fallback;
  const quantitiesByItemId: Record<string, number> = {};
  if (isRecord(value.quantitiesByItemId)) {
    for (const [itemId, count] of Object.entries(value.quantitiesByItemId)) {
      const item = getItemDefinition(itemId);
      if (!item || !isItemAllowedForLevel(item, level)) continue;
      if (typeof count === "number" && Number.isFinite(count) && count > 0) {
        quantitiesByItemId[itemId] = Math.floor(count);
      }
    }
  }

  return {
    schemaVersion: ITEM_SCHEMA_VERSION,
    quantitiesByItemId,
    usedThisTurn: Array.isArray(value.usedThisTurn)
      ? value.usedThisTurn.filter(isUsedItemRecord).slice(-12)
      : [],
    recentRewards: Array.isArray(value.recentRewards)
      ? value.recentRewards.filter(isRewardRecord).slice(-8)
      : [],
  };
}

export function ensureItemInventory(game: GameState): ItemInventory {
  if (!game.items) game.items = createItemInventory(game.level);
  return game.items;
}

export function calculateManagementDiligence(
  game: GameState,
  summary?: TurnSummary | null,
): number {
  const company = playerCompany(game);
  if (!company) return 0;

  let score = 50;
  const profit = summary?.playerResult?.profit ?? company.lastProfit ?? 0;
  score += profit >= 0 ? 12 : -10;
  score += company.cash >= 0 ? 8 : -18;
  score += company.cash >= game.config.startingCash * 0.2 ? 5 : -5;
  score += company.debt <= Math.max(company.cash, game.config.startingCash * 0.3) ? 8 : -8;
  score += boundedBonus(company.morale, 50, 80, 8);
  score += boundedBonus(company.safety, 50, 80, 8);
  score += boundedBonus(company.quality, 35, 75, 7);
  score += boundedBonus(company.reputation, 45, 80, 7);

  const campaignStates = game.campaign?.currentObjectiveState ?? [];
  if (game.campaign?.enabled && campaignStates.length > 0) {
    const passed = campaignStates.filter((state) => state.passed).length;
    score += Math.round((passed / campaignStates.length) * 10);
  }

  const recentMajorEvents = (game.strategy?.majorEvents ?? []).filter(
    (event) => game.turn - event.createdTurn <= 4,
  );
  for (const event of recentMajorEvents) {
    score += event.status === "resolved" ? 4 : -5;
  }

  return clamp(Math.round(score), 0, 100);
}

export function rarityWeightsForScore(
  score: number,
  level: Level,
): { item: ItemRarity; weight: number }[] {
  const maxRarity = maxRarityForLevel(level);
  const base = score < 50
    ? { common: 88, uncommon: 12, rare: 0, epic: 0, legendary: 0 }
    : score < 80
    ? { common: 56, uncommon: 30, rare: 12, epic: 2, legendary: 0 }
    : { common: 34, uncommon: 30, rare: 24, epic: 10, legendary: 2 };

  return RARITY_ORDER.map((rarity) => ({
    item: rarity,
    weight: RARITY_ORDER.indexOf(rarity) <= RARITY_ORDER.indexOf(maxRarity) ? base[rarity] : 0,
  }));
}

export function rollItemReward(
  game: GameState,
  reason: ItemRewardReason,
  score: number,
  excludedItemIds: string[] = [],
): ItemRewardRecord | null {
  if (!game.campaign?.enabled) return null;
  const chance = rewardChance(reason, score);
  if (nextFloat(game.rng) >= chance) return null;

  const rarity = weightedPick(game.rng, rarityWeightsForScore(score, game.level));
  const availablePool = availableItemsForLevel(game.level).filter((item) => !excludedItemIds.includes(item.id));
  const pool = availablePool.filter((item) => item.rarity === rarity);
  const fallbackPool = availablePool;
  const candidates = pool.length > 0 ? pool : fallbackPool;
  if (candidates.length === 0) return null;

  const item = weightedPick(
    game.rng,
    candidates.map((definition) => ({ item: definition, weight: itemWeight(definition, reason) })),
  );
  grantItem(game, item.id, 1);
  const reward: ItemRewardRecord = {
    turn: game.turn,
    itemId: item.id,
    rarity: item.rarity,
    reason,
    score: clamp(Math.round(score), 0, 100),
  };
  const inventory = ensureItemInventory(game);
  inventory.recentRewards = [reward, ...inventory.recentRewards].slice(0, 8);
  return reward;
}

export function grantItem(game: GameState, itemId: string, count: number): void {
  const item = getItemDefinition(itemId);
  if (!item || !isItemAllowedForLevel(item, game.level)) return;
  const inventory = ensureItemInventory(game);
  inventory.quantitiesByItemId[itemId] = Math.max(
    0,
    (inventory.quantitiesByItemId[itemId] ?? 0) + Math.floor(count),
  );
}

export function getUsableItemsForEvent(
  game: GameState,
  event: StrategyEvent,
): ItemDefinition[] {
  if (!game.items) return [];
  return ITEM_DEFINITIONS.filter((item) =>
    isItemAllowedForLevel(item, game.level)
    && item.usableEventKinds.includes(event.kind)
    && (game.items?.quantitiesByItemId[item.id] ?? 0) > 0,
  );
}

export function useItemForEvent(
  game: GameState,
  itemId: string,
  eventId: string,
): { ok: boolean; message?: string; error?: string; reward?: ItemRewardRecord | null } {
  const inventory = ensureItemInventory(game);
  const item = getItemDefinition(itemId);
  if (!item || !isItemAllowedForLevel(item, game.level)) {
    return { ok: false, error: "이 아이템은 지금 사용할 수 없습니다." };
  }
  const event = game.strategy?.majorEvents.find((candidate) => candidate.id === eventId);
  if (!event || event.status !== "active") {
    return { ok: false, error: "이미 지나간 이벤트입니다." };
  }
  if (!item.usableEventKinds.includes(event.kind)) {
    return { ok: false, error: "이 이벤트에는 맞지 않는 아이템입니다." };
  }
  const count = inventory.quantitiesByItemId[itemId] ?? 0;
  if (count <= 0) return { ok: false, error: "보유 수량이 없습니다." };

  inventory.quantitiesByItemId[itemId] = count - 1;
  if (inventory.quantitiesByItemId[itemId] <= 0) delete inventory.quantitiesByItemId[itemId];
  inventory.usedThisTurn = [
    { turn: game.turn, itemId, eventId },
    ...inventory.usedThisTurn,
  ].slice(0, 12);

  applyItemEffects(game, item);
  event.status = "resolved";
  event.resolvedByItemId = itemId;

  const score = Math.max(65, calculateManagementDiligence(game, null));
  const reward = rollItemReward(game, "event_response", score, [itemId]);
  return {
    ok: true,
    message: `${item.name}을 사용해 "${event.title}" 상황을 정리했습니다.`,
    reward,
  };
}

export function refreshItemsForTurn(game: GameState): void {
  if (!game.items) return;
  game.items.usedThisTurn = game.items.usedThisTurn.filter((record) => record.turn === game.turn);
  game.items.recentRewards = game.items.recentRewards.slice(0, 8);
}

function rewardChance(reason: ItemRewardReason, score: number): number {
  const normalized = clamp(score, 0, 100);
  if (reason === "campaign_star") return normalized >= 90 ? 1 : 0.78 + normalized / 500;
  if (reason === "campaign") return 0.52 + normalized / 420;
  if (reason === "event_response") return 0.7 + normalized / 400;
  return 0.14 + normalized / 300;
}

function maxRarityForLevel(level: Level): ItemRarity {
  if (level === "elementary_low" || level === "elementary_mid") return "uncommon";
  if (level === "elementary_high") return "rare";
  if (level === "middle") return "epic";
  return "legendary";
}

function itemWeight(item: ItemDefinition, reason: ItemRewardReason): number {
  if (reason === "event_response" && item.usableEventKinds.length > 0) return 2;
  if (reason === "campaign" || reason === "campaign_star") return item.category === "customer" ? 1.2 : 1;
  return 1;
}

function applyItemEffects(game: GameState, item: ItemDefinition): void {
  const company = playerCompany(game);
  if (!company) return;
  for (const effect of item.effects) {
    if (effect.kind === "cash_delta") company.cash += effect.value;
    if (effect.kind === "debt_delta") company.debt = Math.max(0, company.debt + effect.value);
    if (effect.kind === "inventory_delta") company.inventory = Math.max(0, company.inventory + effect.value);
    if (effect.kind === "quality_delta") company.quality = clamp(company.quality + effect.value, 0, 100);
    if (effect.kind === "reputation_delta") company.reputation = clamp(company.reputation + effect.value, 0, 100);
    if (effect.kind === "morale_delta") company.morale = clamp(company.morale + effect.value, 0, 100);
    if (effect.kind === "safety_delta") company.safety = clamp(company.safety + effect.value, 0, 100);
  }
}

function playerCompany(game: GameState): Company | undefined {
  return game.companies.find((company) => company.id === game.playerCompanyId);
}

function boundedBonus(value: number, low: number, high: number, maxBonus: number): number {
  if (value < low) return -Math.round(maxBonus / 2);
  if (value >= high) return maxBonus;
  return Math.round(((value - low) / (high - low)) * maxBonus);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUsedItemRecord(value: unknown): value is ItemInventory["usedThisTurn"][number] {
  return isRecord(value)
    && typeof value.turn === "number"
    && typeof value.itemId === "string"
    && typeof value.eventId === "string";
}

function isRewardRecord(value: unknown): value is ItemRewardRecord {
  return isRecord(value)
    && typeof value.turn === "number"
    && typeof value.itemId === "string"
    && RARITY_ORDER.includes(value.rarity as ItemRarity)
    && typeof value.reason === "string"
    && typeof value.score === "number";
}
