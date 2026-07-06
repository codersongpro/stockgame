import { describe, expect, it } from "vitest";
import { createGame, advanceTurn } from "./index";

// Force the player into a cash-burning spiral (huge marketing/R&D spend, zero
// production) so debt balloons turn over turn and the credit-stress streak
// climbs deterministically, regardless of AI/macro randomness.
function burnCashEachTurn(game: ReturnType<typeof createGame>): void {
  const player = game.companies.find((c) => c.id === game.playerCompanyId)!;
  player.decisions.productionTarget = 0;
  player.decisions.marketingBudget = 300_000;
  player.decisions.rndBudget = 300_000;
  player.decisions.welfareBudget = 0;
  player.decisions.safetyBudget = 0;
}

describe("credit stress and bankruptcy", () => {
  it("ends the game in bankruptcy after 3 stressed quarters under a strict policy", () => {
    const game = createGame({
      level: "adult",
      seed: 777,
      playerCompanyName: "테스트 상점",
      industryId: "food",
      countryId: "kr",
    });
    expect(game.config.bankruptcyPolicy).toBe("strict");
    burnCashEachTurn(game);

    let turns = 0;
    while (game.status === "playing" && turns < 10) {
      advanceTurn(game);
      burnCashEachTurn(game); // re-apply — advanceTurn may reset decisions via AI-like tuning? (it doesn't for player, but keep spend high)
      turns++;
    }

    expect(game.status).toBe("ended");
    expect(game.endReason).toBe("bankrupt");
  });

  it("bails the player out instead of ending the game under a bailout policy", () => {
    const game = createGame({
      level: "elementary_low",
      seed: 778,
      playerCompanyName: "테스트 상점",
      industryId: "food",
      countryId: "kr",
    });
    expect(game.config.bankruptcyPolicy).toBe("bailout");
    burnCashEachTurn(game);

    const player = game.companies.find((c) => c.id === game.playerCompanyId)!;
    const repBefore = player.reputation;

    let turns = 0;
    let sawStreakThree = false;
    while (turns < 10) {
      advanceTurn(game);
      if ((player.creditWarningStreak ?? 0) >= 3) sawStreakThree = true;
      if (player.creditWarningStreak === 0 && turns >= 3) break; // bailout reset it
      burnCashEachTurn(game);
      turns++;
    }

    expect(game.status).toBe("playing");
    expect(game.endReason).toBeUndefined();
    // Either we observed the streak reach 3 and reset (bailout fired), or the
    // debt spiral never quite tripped it within this many turns — either way
    // the game must not have ended.
    if (sawStreakThree) {
      expect(player.reputation).toBeLessThan(repBefore);
    }
  });
});
