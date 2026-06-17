import { describe, expect, it } from "vitest";
import { createGame, advanceTurn } from "./index";
import { netWorth } from "./ranking";

describe("AI solvency", () => {
  it("keeps AI competitors from collapsing into negative net worth mid-game", () => {
    const game = createGame({
      level: "elementary_low",
      seed: 4242,
      playerCompanyName: "카카오",
      industryId: "entertainment",
      countryId: "kr",
    });

    for (let i = 0; i < 45; i++) advanceTurn(game);

    const aiNetWorths = game.companies
      .filter((company) => company.isAI)
      .map((company) => netWorth(company, game));

    expect(Math.min(...aiNetWorths)).toBeGreaterThanOrEqual(0);
  });
});
