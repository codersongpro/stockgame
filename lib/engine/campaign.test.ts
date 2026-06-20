import { describe, expect, it } from "vitest";
import { createGame, advanceTurn } from "./index";
import {
  advanceCampaign,
  createCampaignProgress,
  evaluateCampaignAfterTurn,
  getActiveCampaignMission,
} from "./campaign";

describe("sandbox campaign integration", () => {
  it("keeps campaign progress out of free sandbox games", () => {
    const game = createGame({
      level: "elementary_low",
      seed: 11,
      playerCompanyName: "테스트 상점",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: false,
    });

    expect(game.maxTurns).toBe(100);
    expect(game.campaign).toBeUndefined();
  });

  it("starts the first level mission inside a campaign-enabled sandbox game", () => {
    const game = createGame({
      level: "elementary_low",
      seed: 12,
      playerCompanyName: "테스트 상점",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: true,
    });

    expect(game.campaign).toEqual(createCampaignProgress("elementary_low"));
    expect(getActiveCampaignMission(game)?.level).toBe("elementary_low");
  });

  it("evaluates the same sandbox action deterministically", () => {
    const makeRun = () => {
      const game = createGame({
        level: "elementary_low",
        seed: 13,
        playerCompanyName: "테스트 상점",
        industryId: "food",
        countryId: "kr",
        campaignEnabled: true,
      });
      game.companies[0].decisions.productionTarget = 40;
      const summary = advanceTurn(game);
      return evaluateCampaignAfterTurn(game, summary);
    };

    expect(makeRun()).toEqual(makeRun());
  });

  it("keeps a failed campaign mission retryable without ending the game", () => {
    const game = createGame({
      level: "elementary_low",
      seed: 14,
      playerCompanyName: "테스트 상점",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: true,
    });

    game.companies[0].decisions.productionTarget = 300;
    const summary = advanceTurn(game);
    const result = evaluateCampaignAfterTurn(game, summary);
    advanceCampaign(game, result);

    expect(result?.success).toBe(false);
    expect(game.status).toBe("playing");
    expect(game.campaign?.activeMissionId).toBe("el-coin-shop-1");
    expect(game.campaign?.attemptsByMissionId["el-coin-shop-1"]).toBe(1);
  });

  it("unlocks the next mission and records stars after a successful sandbox objective", () => {
    const game = createGame({
      level: "elementary_low",
      seed: 15,
      playerCompanyName: "테스트 상점",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: true,
    });

    game.companies[0].decisions.productionTarget = 40;
    const summary = advanceTurn(game);
    const result = evaluateCampaignAfterTurn(game, summary);
    advanceCampaign(game, result);

    expect(result?.success).toBe(true);
    expect(result?.stars).toBeGreaterThanOrEqual(1);
    expect(game.campaign?.completedMissionIds).toContain("el-coin-shop-1");
    expect(game.campaign?.unlockedMissionIds).toContain("el-coin-shop-2");
    expect(game.campaign?.activeMissionId).toBe("el-coin-shop-2");
  });
});
