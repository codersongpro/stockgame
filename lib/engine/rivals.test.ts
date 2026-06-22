import { describe, expect, it } from "vitest";
import { advanceTurn, createGame } from "./index";
import { createPriceWarRivalState, priceWarProgress } from "./rivals";

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

  it("marks the five-turn chapter won or lost without ending the game", () => {
    const winner = makeGame(true);
    const loser = makeGame(true);

    const winningPlayer = winner.companies.find((company) => company.id === winner.playerCompanyId)!;
    winningPlayer.cash = 160_000;
    winningPlayer.reputation = 75;
    winningPlayer.quality = 70;
    for (let i = 0; i < 5; i += 1) advanceTurn(winner);

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
});
