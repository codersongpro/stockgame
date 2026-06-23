import { describe, expect, it } from "vitest";
import { advanceTurn, createGame, getStrategyEventGuide, recordStrategyAction, strategyTurnEffects } from "./index";
import type { StrategyEvent } from "./types";

function gameWithEvent(event: StrategyEvent) {
  const game = createGame({
    level: "middle",
    seed: 41,
    playerCompanyName: "Event Lab",
    industryId: "food",
    countryId: "kr",
    campaignEnabled: true,
  });
  game.strategy.majorEvents = [event];
  return game;
}

describe("strategy event guidance", () => {
  it("explains how to respond to customer complaints", () => {
    const game = gameWithEvent({
      id: "complaint",
      kind: "customer_complaint",
      title: "고객 불만 확산",
      body: "고객들이 품질과 서비스에 불만을 보입니다.",
      severity: "major",
      status: "active",
      createdTurn: 1,
      expiresTurn: 4,
      responseActionTypes: ["company_action", "decision"],
    });

    expect(getStrategyEventGuide(game.strategy.majorEvents[0])).toEqual({
      title: "고객 불만 확산",
      options: ["품질 개선", "고객 보상", "안전과 평판 관리"],
    });
  });

  it("resolves non-rival major events through their real response actions", () => {
    const game = gameWithEvent({
      id: "supply",
      kind: "supply_problem",
      title: "재료 공급 문제",
      body: "물건을 제때 만들기 어렵습니다.",
      severity: "major",
      status: "active",
      createdTurn: 1,
      expiresTurn: 4,
      responseActionTypes: ["decision", "build", "company_action"],
    });

    recordStrategyAction(game, {
      type: "build",
      area: "city",
      targetId: "warehouse",
    });

    expect(game.strategy.majorEvents[0].status).toBe("resolved");
  });

  it("keeps rival price pressure out of generic auto resolution", () => {
    const game = gameWithEvent({
      id: "rival",
      kind: "rival_price_pressure",
      title: "경쟁사의 가격 공세",
      body: "경쟁사가 가격을 낮췄습니다.",
      severity: "major",
      status: "active",
      createdTurn: 1,
      expiresTurn: 4,
      responseActionTypes: [],
    });

    recordStrategyAction(game, {
      type: "product_price",
      area: "company",
      targetId: "0",
      value: 90,
    });

    expect(game.strategy.majorEvents[0].status).toBe("active");
  });

  it("applies unresolved major event pressure to the next company turn", () => {
    const complaint = gameWithEvent({
      id: "complaint-pressure",
      kind: "customer_complaint",
      title: "고객 불만 확산",
      body: "고객들이 서비스에 불만을 보입니다.",
      severity: "major",
      status: "active",
      createdTurn: 1,
      expiresTurn: 4,
      responseActionTypes: ["company_action", "decision"],
    });
    const supply = gameWithEvent({
      id: "supply-pressure",
      kind: "supply_problem",
      title: "재료 공급 문제",
      body: "물건을 제때 만들기 어렵습니다.",
      severity: "major",
      status: "active",
      createdTurn: 1,
      expiresTurn: 4,
      responseActionTypes: ["decision", "build", "company_action"],
    });
    const safety = gameWithEvent({
      id: "safety-pressure",
      kind: "safety_inspection",
      title: "안전 점검",
      body: "현장 안전 점검이 시작됐습니다.",
      severity: "major",
      status: "active",
      createdTurn: 1,
      expiresTurn: 4,
      responseActionTypes: ["decision", "build", "company_action"],
    });

    expect(strategyTurnEffects(complaint).commerceBonus).toBeLessThan(0);
    expect(strategyTurnEffects(supply).productionBonus).toBeLessThan(0);
    expect(strategyTurnEffects(safety).safetyBonus).toBeLessThan(0);

    supply.strategy.majorEvents[0].status = "resolved";
    expect(strategyTurnEffects(supply).productionBonus).toBe(0);
  });

  it("feeds unresolved strategy event pressure into the next turn result", () => {
    const normal = createGame({
      level: "middle",
      seed: 42,
      playerCompanyName: "Normal Run",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: true,
    });
    const pressured = createGame({
      level: "middle",
      seed: 42,
      playerCompanyName: "Pressure Run",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: true,
    });
    for (const game of [normal, pressured]) {
      const player = game.companies.find((company) => company.id === game.playerCompanyId)!;
      player.decisions.productionTarget = 650;
      player.cash = 500_000;
    }
    pressured.strategy.majorEvents = [{
      id: "supply-pressure",
      kind: "supply_problem",
      title: "재료 공급 문제",
      body: "물건을 제때 만들기 어렵습니다.",
      severity: "major",
      status: "active",
      createdTurn: 0,
      expiresTurn: 3,
      responseActionTypes: ["decision", "build", "company_action"],
    }];

    const normalSummary = advanceTurn(normal);
    const pressuredSummary = advanceTurn(pressured);

    expect(pressuredSummary.playerResult?.unitsProduced).toBeLessThan(
      normalSummary.playerResult?.unitsProduced ?? 0,
    );
  });

  it("creates varied major events from actual company conditions", () => {
    const game = createGame({
      level: "middle",
      seed: 711,
      playerCompanyName: "Variety Run",
      industryId: "food",
      countryId: "kr",
      campaignEnabled: true,
    });
    const player = game.companies.find((company) => company.id === game.playerCompanyId)!;
    player.safety = 20;
    player.reputation = 25;
    player.decisions.productionTarget = 900;
    game.turn = 4;

    advanceTurn(game);

    expect(game.strategy.majorEvents.length).toBeGreaterThan(0);
    expect([
      "customer_complaint",
      "supply_problem",
      "equipment_breakdown",
      "logistics_delay",
      "safety_inspection",
      "local_festival",
      "viral_trend",
      "talent_poach",
      "rival_price_pressure",
      "investor_visit",
      "cyber_incident",
      "regulation_inspection",
    ]).toContain(game.strategy.majorEvents[0].kind);
  });
});
