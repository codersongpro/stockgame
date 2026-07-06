import { describe, expect, it } from "vitest";
import { createGame, advanceTurn } from "./index";
import {
  advanceCampaign,
  createCampaignProgress,
  evaluateCampaignAfterTurn,
  evaluateCampaignBeforeTurn,
  getActiveCampaignMission,
  recordCampaignAction,
} from "./campaign";
import { updateCityState } from "./city";

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

    expect(game.maxTurns).toBe(32);
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

  it("aligns the first campaign with real price and production controls", () => {
    const makeRun = () => {
      const game = createGame({
        level: "elementary_low",
        seed: 13,
        playerCompanyName: "테스트 상점",
        industryId: "food",
        countryId: "kr",
        campaignEnabled: true,
      });
      game.companies[0].productPrices[0] = 95;
      game.companies[0].decisions.productionTarget = 40;
      recordCampaignAction(game, { type: "product_price", area: "company", value: 95 });
      recordCampaignAction(game, { type: "decision", area: "company", targetId: "productionTarget", value: 40 });
      return evaluateCampaignBeforeTurn(game);
    };

    const result = makeRun();
    expect(result).toEqual(makeRun());
    expect(result?.success).toBe(true);
    expect(getActiveCampaignMission(createGame({
      level: "elementary_low",
      seed: 13,
      playerCompanyName: "Test Shop",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: true,
    }))?.targetAction).toBe("회사 탭에서 대표 상품 가격과 생산량을 함께 맞추기");
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

    game.companies[0].productPrices[0] = 300;
    game.companies[0].decisions.productionTarget = 300;
    const result = evaluateCampaignBeforeTurn(game);
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

    game.companies[0].productPrices[0] = 95;
    game.companies[0].decisions.productionTarget = 40;
    recordCampaignAction(game, { type: "product_price", area: "company", value: 95 });
    recordCampaignAction(game, { type: "decision", area: "company", targetId: "productionTarget", value: 40 });
    const result = evaluateCampaignBeforeTurn(game);
    advanceCampaign(game, result);

    expect(result?.success).toBe(true);
    expect(result?.stars).toBeGreaterThanOrEqual(1);
    expect(game.campaign?.completedMissionIds).toContain("el-coin-shop-1");
    expect(game.campaign?.unlockedMissionIds).toContain("el-coin-shop-2");
    expect(game.campaign?.activeMissionId).toBe("el-coin-shop-2");
  });

  it("uses city districts and talent placement as real campaign objectives", () => {
    const game = createGame({
      level: "middle",
      seed: 16,
      playerCompanyName: "Strategy Lab",
      industryId: "tech",
      countryId: "kr",
      campaignEnabled: true,
    });

    game.campaign!.activeMissionId = "mid-city-1";
    game.companies[0].buildings.push({
      id: "test-rnd",
      type: "rnd",
      level: 1,
      x: 1,
      y: 1,
      turnsLeft: 0,
    });
    game.companies[0].buildings.push({
      id: "test-lab",
      type: "lab",
      level: 1,
      x: 2,
      y: 1,
      turnsLeft: 0,
    });
    updateCityState(game);

    const result = evaluateCampaignBeforeTurn(game);

    expect(game.city.districts.research.synergy).toBeGreaterThanOrEqual(1);
    expect(result?.success).toBe(true);
  });

  it("keeps major rival events strategic without ending normal sandbox play", () => {
    const game = createGame({
      level: "high",
      seed: 17,
      playerCompanyName: "Rival Watch",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: true,
    });

    game.campaign!.activeMissionId = "high-rival-1";
    recordCampaignAction(game, { type: "company_action", area: "strategy", targetId: "pr_campaign" });
    const result = evaluateCampaignBeforeTurn(game);
    advanceCampaign(game, result);

    expect(result?.success).toBe(true);
    expect(game.status).toBe("playing");
    expect(game.strategy.majorEvents.every((event) => event.severity === "major")).toBe(true);
  });
});
