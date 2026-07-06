import { describe, expect, it } from "vitest";
import { createGame } from "./index";
import { applyMilestones } from "./milestones";
import { netWorth } from "./ranking";

function game() {
  return createGame({
    level: "adult",
    seed: 99,
    playerCompanyName: "테스트 상점",
    industryId: "food",
    countryId: "kr",
  });
}

describe("net-worth and rank milestones", () => {
  it("celebrates a unicorn net-worth milestone once, with a reputation bump and news", () => {
    const g = game();
    const player = g.companies.find((c) => c.id === g.playerCompanyId)!;
    const repBefore = player.reputation;
    player.cash = g.config.startingCash * 15; // clears the 10x unicorn tier

    applyMilestones(g);

    expect(g.milestonesReached).toContain("unicorn-10x");
    expect(g.milestonesReached).toContain("growth-2x");
    expect(g.milestonesReached).toContain("growth-5x");
    expect(player.reputation).toBeGreaterThan(repBefore);
    expect(g.news.some((n) => n.tags.includes("unicorn-10x"))).toBe(true);

    // Running it again shouldn't re-fire the same milestones or add more reputation.
    const repAfterFirst = player.reputation;
    const newsCountAfterFirst = g.news.length;
    applyMilestones(g);
    expect(player.reputation).toBe(repAfterFirst);
    expect(g.news.length).toBe(newsCountAfterFirst);
  });

  it("celebrates reaching #1 on the leaderboard", () => {
    const g = game();
    const player = g.companies.find((c) => c.id === g.playerCompanyId)!;
    // Dwarf every AI company's net worth so the player is unambiguously #1.
    player.cash = 999_999_999;
    for (const c of g.companies) {
      if (c.id !== player.id) c.cash = 0;
    }

    applyMilestones(g);

    expect(g.milestonesReached).toContain("rank-1");
    expect(netWorth(player, g)).toBeGreaterThan(0);
  });

  it("does not award rank milestones when there aren't enough rivals to rank against", () => {
    const g = createGame({
      level: "elementary_low", // aiCount: 2 -> only 3 companies total
      seed: 100,
      playerCompanyName: "테스트 상점",
      industryId: "food",
      countryId: "kr",
    });
    const player = g.companies.find((c) => c.id === g.playerCompanyId)!;
    player.cash = 999_999_999;

    applyMilestones(g);

    expect(g.milestonesReached ?? []).not.toContain("rank-10");
  });
});
