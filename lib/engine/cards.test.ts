import { describe, expect, it } from "vitest";
import { createGame } from "./index";
import {
  executeActionCard,
  refreshActionCardsForTurn,
} from "./cards";

function campaignGame() {
  return createGame({
    level: "elementary_high",
    seed: 2026,
    playerCompanyName: "Card Shop",
    industryId: "food",
    countryId: "kr",
    campaignEnabled: true,
  });
}

describe("campaign action cards", () => {
  it("creates action points and an opening hand only for campaign games", () => {
    const campaign = campaignGame();
    const sandbox = createGame({
      level: "elementary_high",
      seed: 2026,
      playerCompanyName: "Free Shop",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: false,
    });

    expect(campaign.actionPoints).toEqual({ current: 2, max: 2, freeActionsUsed: 0 });
    expect(campaign.cards?.handCardIds).toHaveLength(4);
    expect(sandbox.actionPoints).toBeUndefined();
    expect(sandbox.cards).toBeUndefined();
  });

  it("spends action points and applies a real card effect", () => {
    const game = campaignGame();
    game.cards!.handCardIds = ["quality-focus"];
    const company = game.companies[0];
    const qualityBefore = company.quality;

    const result = executeActionCard(game, "quality-focus");

    expect(result.ok).toBe(true);
    expect(game.actionPoints?.current).toBe(1);
    expect(company.quality).toBeGreaterThan(qualityBefore);
    expect(game.cards?.discardCardIds).toContain("quality-focus");
    expect(game.strategy.actionLog.some((action) => action.type === "card_play" && action.targetId === "quality-focus")).toBe(true);
  });

  it("blocks card play when action points are not enough", () => {
    const game = campaignGame();
    game.actionPoints!.current = 0;
    game.cards!.handCardIds = ["local-ads"];
    const reputationBefore = game.companies[0].reputation;

    const result = executeActionCard(game, "local-ads");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("행동력");
    expect(game.companies[0].reputation).toBe(reputationBefore);
  });

  it("refreshes action points and refills the hand at the start of a new campaign turn", () => {
    const game = campaignGame();
    game.actionPoints!.current = 0;
    game.cards!.handCardIds = [];

    refreshActionCardsForTurn(game);

    expect(game.actionPoints?.current).toBe(2);
    expect(game.cards?.handCardIds.length).toBeGreaterThan(0);
    expect(game.cards?.handCardIds.length).toBeLessThanOrEqual(4);
  });
});
