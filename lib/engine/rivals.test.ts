import { describe, expect, it } from "vitest";
import { advanceTurn, createGame, recordCampaignAction } from "./index";
import {
  createPriceWarRivalState,
  getRivalResponseGuide,
  priceWarProgress,
  respondToRivalPressure,
} from "./rivals";

function makeGame(campaignEnabled = true) {
  return createGame({
    level: "elementary_mid",
    seed: 2468,
    playerCompanyName: "Test Shop",
    industryId: "food",
    countryId: "kr",
    campaignEnabled,
  });
}

describe("campaign rival price war", () => {
  it("creates the first rival only for campaign games", () => {
    const campaign = makeGame(true);
    const sandbox = makeGame(false);

    expect(campaign.rival).toEqual(createPriceWarRivalState("elementary_mid"));
    expect(sandbox.rival).toBeUndefined();
  });

  it("advances deterministically from the same seed and same actions", () => {
    const first = makeGame(true);
    const second = makeGame(true);

    for (const game of [first, second]) {
      const player = game.companies.find((company) => company.id === game.playerCompanyId)!;
      player.productPrices[0] = 95;
      player.decisions.productionTarget = 80;
      player.decisions.marketingBudget = 5000;
      advanceTurn(game);
      advanceTurn(game);
    }

    expect(first.rival).toEqual(second.rival);
  });

  it("uses price pressure during the chapter without ending the sandbox", () => {
    const game = makeGame(true);
    const player = game.companies.find((company) => company.id === game.playerCompanyId)!;

    advanceTurn(game);
    const reputationBeforePressure = player.reputation;
    advanceTurn(game);

    expect(game.status).toBe("playing");
    expect(game.rival?.specialMovesUsed).toContain("price-cut-2");
    expect(player.reputation).toBeLessThan(reputationBeforePressure);
  });

  it("creates a major strategy event when the rival uses price pressure", () => {
    const game = makeGame(true);

    advanceTurn(game);
    advanceTurn(game);

    expect(game.strategy.majorEvents).toContainEqual(expect.objectContaining({
      id: "rival-price-pressure-2",
      kind: "rival_price_pressure",
      status: "active",
    }));
  });

  it("explains which real actions can answer active price pressure", () => {
    const game = makeGame(true);

    advanceTurn(game);
    advanceTurn(game);

    expect(getRivalResponseGuide(game)).toEqual({
      active: true,
      eventId: "rival-price-pressure-2",
      title: "경쟁자의 가격 압박",
      options: [
        "대표 상품 가격을 조정하기",
        "마케팅 홍보로 손님 신뢰 회복하기",
        "마케팅 예산을 올려 손님에게 알리기",
        "R&D 예산으로 품질 높이기",
        "CEO 행동 카드로 빠르게 대응하기",
      ],
    });
  });

  it("lets real campaign actions answer rival pressure", () => {
    const game = makeGame(true);

    advanceTurn(game);
    advanceTurn(game);
    const response = respondToRivalPressure(game, "local-ads");

    expect(response).toBe(true);
    expect(game.rival?.responsesUsed).toContain("price-cut-2");
    expect(game.strategy.majorEvents.find((event) => event.id === "rival-price-pressure-2")?.status).toBe("resolved");
  });

  it("accepts price, promotion, and quality investment as rival pressure responses", () => {
    for (const action of [
      { type: "product_price" as const, area: "company" as const, targetId: "0", value: 95 },
      { type: "company_action" as const, area: "strategy" as const, targetId: "pr_campaign" },
      { type: "decision" as const, area: "company" as const, targetId: "rndBudget", value: 12000 },
    ]) {
      const game = makeGame(true);
      advanceTurn(game);
      advanceTurn(game);

      recordCampaignAction(game, action);

      expect(game.rival?.responsesUsed).toContain("price-cut-2");
      expect(game.strategy.majorEvents.find((event) => event.id === "rival-price-pressure-2")?.status).toBe("resolved");
    }
  });

  it("does not treat unrelated production changes as a rival response", () => {
    const game = makeGame(true);
    advanceTurn(game);
    advanceTurn(game);

    recordCampaignAction(game, {
      type: "decision",
      area: "company",
      targetId: "productionTarget",
      value: 120,
    });

    expect(game.rival?.responsesUsed).not.toContain("price-cut-2");
    expect(game.strategy.majorEvents.find((event) => event.id === "rival-price-pressure-2")?.status).toBe("active");
  });

  it("marks the five-turn chapter won or lost without ending the game", () => {
    const winner = makeGame(true);
    const loser = makeGame(true);

    const winningPlayer = winner.companies.find((company) => company.id === winner.playerCompanyId)!;
    winningPlayer.cash = 160_000;
    winningPlayer.reputation = 75;
    winningPlayer.quality = 70;
    for (let i = 0; i < 5; i += 1) {
      advanceTurn(winner);
      if (i === 1) respondToRivalPressure(winner, "local-ads");
    }

    const losingPlayer = loser.companies.find((company) => company.id === loser.playerCompanyId)!;
    losingPlayer.cash = 20_000;
    losingPlayer.reputation = 25;
    losingPlayer.quality = 10;
    losingPlayer.decisions.productionTarget = 0;
    for (let i = 0; i < 5; i += 1) advanceTurn(loser);

    expect(winner.rival?.status).toBe("won");
    expect(loser.rival?.status).toBe("lost");
    expect(winner.status).toBe("playing");
    expect(loser.status).toBe("playing");
    expect(priceWarProgress(winner).passed).toBeGreaterThan(priceWarProgress(loser).passed);
  });

  it("brings back a tougher, escalated rival chapter a few turns after the first resolves", () => {
    const game = makeGame(true);
    const player = game.companies.find((company) => company.id === game.playerCompanyId)!;
    player.cash = 20_000;
    player.reputation = 25;
    player.quality = 10;
    player.decisions.productionTarget = 0;

    for (let i = 0; i < 5; i += 1) advanceTurn(game);
    expect(game.rival?.status).toBe("lost");
    expect(game.rival?.escalation).toBe(0);

    // One more turn lets advanceRivalTurn notice the resolved chapter and
    // schedule the rematch (respawnAtTurn is set lazily, not on the turn the
    // chapter actually resolves).
    advanceTurn(game);
    const respawnAtTurn = game.rival?.respawnAtTurn;
    expect(respawnAtTurn).toBeGreaterThan(game.turn);

    let guard = 0;
    while (game.rival?.status !== "active" && guard < 20) {
      advanceTurn(game);
      guard++;
    }

    expect(game.rival?.status).toBe("active");
    expect(game.rival?.escalation).toBe(1);
    expect(game.rival?.turnInChapter).toBe(1);
  });
});
