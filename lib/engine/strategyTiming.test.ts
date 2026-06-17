import { describe, expect, it } from "vitest";
import { createGame } from "./index";
import { getStrategicTiming } from "./strategyTiming";

describe("getStrategicTiming", () => {
  it("prefers research when demand is soft and the industry depends on R&D", () => {
    const game = createGame({
      level: "middle",
      seed: 101,
      playerCompanyName: "연구 테스트",
      industryId: "ai",
      countryId: "kr",
    });
    const company = game.companies[0];
    game.macro.phase = "recession";
    game.macro.interestRate = 1.5;
    company.quality = 28;
    company.reputation = 55;
    company.inventory = 900;
    company.productInventory = [900, 0, 0, 0];
    company.cash = 700_000;

    const timing = getStrategicTiming(company, game);

    expect(timing.rnd.score).toBeGreaterThan(timing.massProduction.score);
    expect(timing.rnd.reasons.some((reason) => reason.includes("연구"))).toBe(true);
  });

  it("prefers mass production when demand is strong and inventory is low", () => {
    const game = createGame({
      level: "middle",
      seed: 202,
      playerCompanyName: "생산 테스트",
      industryId: "food",
      countryId: "kr",
    });
    const company = game.companies[0];
    game.macro.phase = "boom";
    company.quality = 82;
    company.reputation = 82;
    company.inventory = 0;
    company.productInventory = [0, 0, 0, 0];
    company.lastProfit = 90_000;
    company.cash = 900_000;
    company.decisions.productionTarget = 100;

    const timing = getStrategicTiming(company, game);

    expect(timing.massProduction.score).toBeGreaterThan(timing.rnd.score);
    expect(timing.massProduction.recommendedProduction).toBeGreaterThan(company.decisions.productionTarget);
  });
});
