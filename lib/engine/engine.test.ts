import { describe, it, expect } from "vitest";
import { createGame, advanceTurn } from "./index";
import { netWorth, rankings } from "./ranking";
import type { GameState } from "./types";

function newGame(seed: number): GameState {
  return createGame({
    level: "university",
    seed,
    playerCompanyName: "테스트회사",
    industryId: "tech",
    countryId: "kr",
  });
}

function playN(state: GameState, n: number): void {
  for (let i = 0; i < n; i++) advanceTurn(state);
}

describe("engine determinism", () => {
  it("produces identical results for the same seed", () => {
    const a = newGame(12345);
    const b = newGame(12345);
    playN(a, 12);
    playN(b, 12);
    expect(a.turn).toBe(b.turn);
    expect(netWorth(a.companies[0], a)).toBeCloseTo(netWorth(b.companies[0], b), 5);
    expect(a.stocks[a.companies[1].id].price).toBeCloseTo(
      b.stocks[b.companies[1].id].price,
      5,
    );
  });

  it("produces different market outcomes for different seeds", () => {
    const a = newGame(1);
    const b = newGame(2);
    playN(a, 12);
    playN(b, 12);
    // Market prices and AI trajectories are driven by the seeded RNG, so two
    // different seeds must diverge.
    const aiA = a.companies[1];
    const aiB = b.companies[1];
    expect(a.stocks[aiA.id].price).not.toBeCloseTo(b.stocks[aiB.id].price, 2);
    expect(netWorth(aiA, a)).not.toBeCloseTo(netWorth(aiB, b), 2);
  });
});

describe("game lifecycle", () => {
  it("sets up a player and the configured number of AI competitors", () => {
    const g = newGame(7);
    expect(g.companies.filter((c) => c.isPlayer)).toHaveLength(1);
    expect(g.companies.filter((c) => c.isAI)).toHaveLength(g.config.aiCount);
    expect(Object.keys(g.stocks)).toHaveLength(g.companies.length);
  });

  it("ends after maxTurns", () => {
    const g = createGame({
      level: "middle",
      seed: 99,
      playerCompanyName: "X",
      industryId: "food",
      countryId: "us",
      maxTurns: 5,
    });
    playN(g, 5);
    expect(g.status).toBe("ended");
  });

  it("keeps the leaderboard sorted by net worth", () => {
    const g = newGame(42);
    playN(g, 8);
    const r = rankings(g);
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].netWorth).toBeGreaterThanOrEqual(r[i].netWorth);
    }
  });

  it("generates news events over time", () => {
    const g = newGame(2024);
    playN(g, 15);
    expect(g.news.length).toBeGreaterThan(0);
  });
});
