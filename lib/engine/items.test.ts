import { describe, expect, it } from "vitest";
import {
  calculateManagementDiligence,
  createGame,
  getUsableItemsForEvent,
  grantItem,
  rarityWeightsForScore,
  rollItemReward,
  useItemForEvent,
} from "./index";
import { getItemDefinition } from "../data/campaign/items";
import type { StrategyEvent } from "./types";

function campaignGame(level: Parameters<typeof createGame>[0]["level"] = "middle", seed = 77) {
  return createGame({
    level,
    seed,
    playerCompanyName: "Item Lab",
    industryId: "food",
    countryId: "kr",
    campaignEnabled: true,
  });
}

function rarityScore(weights: ReturnType<typeof rarityWeightsForScore>) {
  const order = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
  const total = weights.reduce((sum, row) => sum + row.weight, 0);
  return weights.reduce((sum, row) => sum + order[row.item] * row.weight, 0) / total;
}

describe("campaign item rewards", () => {
  it("raises better rarity odds when management diligence is high", () => {
    const low = rarityWeightsForScore(35, "high");
    const high = rarityWeightsForScore(90, "high");

    expect(rarityScore(high)).toBeGreaterThan(rarityScore(low));
    expect(low.find((row) => row.item === "rare")?.weight).toBe(0);
    expect(high.find((row) => row.item === "legendary")?.weight).toBeGreaterThan(0);
  });

  it("rolls the same reward for the same seed, reason, and score", () => {
    const first = campaignGame("high", 913);
    const second = campaignGame("high", 913);

    const firstReward = rollItemReward(first, "campaign_star", 100);
    const secondReward = rollItemReward(second, "campaign_star", 100);

    expect(firstReward?.itemId).toBe(secondReward?.itemId);
    expect(firstReward?.rarity).toBe(secondReward?.rarity);
  });

  it("keeps elementary low rewards away from advanced finance and strategy items", () => {
    const game = campaignGame("elementary_low", 512);

    for (let i = 0; i < 12; i += 1) {
      rollItemReward(game, "campaign_star", 100);
    }

    const itemIds = Object.keys(game.items?.quantitiesByItemId ?? {});
    expect(itemIds.length).toBeGreaterThan(0);
    for (const itemId of itemIds) {
      const item = getItemDefinition(itemId)!;
      expect(["common", "uncommon"]).toContain(item.rarity);
      expect(["finance", "strategy"]).not.toContain(item.category);
    }
  });

  it("uses an item to resolve an event and reduce its quantity", () => {
    const game = campaignGame("middle", 44);
    const event: StrategyEvent = {
      id: "breakdown-1",
      kind: "equipment_breakdown",
      title: "설비 고장",
      body: "설비가 멈췄습니다.",
      severity: "major",
      status: "active",
      createdTurn: game.turn,
      expiresTurn: game.turn + 3,
      responseActionTypes: ["build", "upgrade", "company_action", "decision"],
    };
    game.strategy.majorEvents = [event];
    grantItem(game, "repair-parts", 1);
    const beforeCount = game.items?.quantitiesByItemId["repair-parts"] ?? 0;

    expect(getUsableItemsForEvent(game, event).map((item) => item.id)).toContain("repair-parts");
    const result = useItemForEvent(game, "repair-parts", event.id);

    expect(result.ok).toBe(true);
    expect(game.strategy.majorEvents[0].status).toBe("resolved");
    expect(game.items?.quantitiesByItemId["repair-parts"] ?? 0).toBe(beforeCount - 1);
    expect(game.items?.usedThisTurn[0]).toMatchObject({ itemId: "repair-parts", eventId: event.id });
  });

  it("scores stable operation higher than risky operation", () => {
    const stable = campaignGame("middle", 31);
    const risky = campaignGame("middle", 31);
    const stablePlayer = stable.companies.find((company) => company.id === stable.playerCompanyId)!;
    const riskyPlayer = risky.companies.find((company) => company.id === risky.playerCompanyId)!;

    stablePlayer.cash = 500_000;
    stablePlayer.debt = 20_000;
    stablePlayer.morale = 85;
    stablePlayer.safety = 82;
    stablePlayer.quality = 78;
    stablePlayer.reputation = 80;
    riskyPlayer.cash = -20_000;
    riskyPlayer.debt = 900_000;
    riskyPlayer.morale = 35;
    riskyPlayer.safety = 30;
    riskyPlayer.quality = 25;
    riskyPlayer.reputation = 28;

    expect(calculateManagementDiligence(stable, null)).toBeGreaterThan(
      calculateManagementDiligence(risky, null),
    );
  });
});
