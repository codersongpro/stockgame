import { describe, expect, it } from "vitest";
import { createGame } from "./index";
import { applyCompanyAction, proposeDeal } from "./actions";

function game() {
  return createGame({
    level: "adult",
    seed: 55,
    playerCompanyName: "테스트 상점",
    industryId: "food",
    countryId: "kr",
  });
}

describe("action points gate sandbox actions", () => {
  it("spends 1 action point per company action and blocks once exhausted", () => {
    const g = game();
    const company = g.companies.find((c) => c.id === g.playerCompanyId)!;
    company.cash = 10_000_000;
    const maxAp = g.actionPoints!.max;

    for (let i = 0; i < maxAp; i++) {
      const res = applyCompanyAction(g, company, "mkt_basic");
      expect(res.ok).toBe(true);
    }
    expect(g.actionPoints!.current).toBe(0);

    const blocked = applyCompanyAction(g, company, "mkt_basic");
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toContain("행동력");
  });

  it("diminishes repeated same-category actions within a turn", () => {
    const g = game();
    const company = g.companies.find((c) => c.id === g.playerCompanyId)!;
    company.cash = 10_000_000;
    company.reputation = 50;

    applyCompanyAction(g, company, "mkt_basic"); // +2 reputation, full strength
    const afterFirst = company.reputation;
    const firstGain = afterFirst - 50;

    applyCompanyAction(g, company, "mkt_active"); // +5 base, but 2nd marketing action this turn -> 50%
    const secondGain = company.reputation - afterFirst;

    expect(firstGain).toBeCloseTo(2, 5);
    expect(secondGain).toBeCloseTo(5 * 0.5, 5);
  });

  it("gates deal proposals on the same action-point pool", () => {
    const g = game();
    const company = g.companies.find((c) => c.id === g.playerCompanyId)!;
    const target = g.companies.find((c) => c.id !== company.id)!;
    company.cash = 10_000_000;
    g.actionPoints!.current = 0;

    const res = proposeDeal(g, company, target.id, "comarket");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("행동력");
  });
});
