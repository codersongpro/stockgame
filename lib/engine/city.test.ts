import { describe, expect, it } from "vitest";
import { buildBuilding } from "./actions";
import { createGame } from "./index";

describe("city districts", () => {
  it("counts completed welfare buildings such as parks toward the welfare district", () => {
    const game = createGame({
      level: "elementary_low",
      seed: 501,
      playerCompanyName: "Park Shop",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: true,
    });
    const player = game.companies.find((company) => company.id === game.playerCompanyId)!;

    const result = buildBuilding(game, player, "park", 1, 1);
    expect(result.ok).toBe(true);
    expect(game.city.districts.welfare.buildingCount).toBe(1);
    expect(game.city.districts.welfare.level).toBe(1);
    expect(game.city.districts.welfare.bonus).toBeGreaterThan(0);
  });
});
