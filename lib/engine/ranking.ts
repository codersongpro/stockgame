import type { GameState, RankingEntry, Company } from "./types";
import { fundamentalValue } from "./market";

// Net worth = cash + investment portfolio value + own company value − debt.
// This single number is the win condition and the leaderboard sort key, so
// both good management (company value) and good investing (portfolio) matter.

export function portfolioValue(company: Company, state: GameState): number {
  let total = 0;
  for (const [companyId, shares] of Object.entries(company.portfolio.stocks)) {
    const stock = state.stocks[companyId];
    if (stock) total += stock.price * shares;
  }
  for (const [assetId, units] of Object.entries(company.portfolio.assets)) {
    const asset = state.assets[assetId as keyof typeof state.assets];
    if (asset && units) total += asset.price * units;
  }
  return total;
}

export function netWorth(company: Company, state: GameState): number {
  return (
    company.cash +
    portfolioValue(company, state) +
    fundamentalValue(company) -
    company.debt
  );
}

export function rankings(state: GameState): RankingEntry[] {
  const entries: RankingEntry[] = state.companies.map((c) => {
    const pv = portfolioValue(c, state);
    const cv = fundamentalValue(c);
    return {
      companyId: c.id,
      name: c.name,
      logoColor: c.logoColor,
      isPlayer: c.isPlayer,
      cash: c.cash,
      portfolioValue: pv,
      companyValue: cv,
      netWorth: c.cash + pv + cv - c.debt,
    };
  });
  entries.sort((a, b) => b.netWorth - a.netWorth);
  return entries;
}

/** Record the player's (and everyone's) net worth into history each turn. */
export function recordNetWorth(state: GameState): void {
  for (const c of state.companies) {
    c.netWorthHistory.push(Math.round(netWorth(c, state)));
    if (c.netWorthHistory.length > 60) c.netWorthHistory.shift();
  }
}

export function playerRank(state: GameState): number {
  const r = rankings(state);
  return r.findIndex((e) => e.companyId === state.playerCompanyId) + 1;
}
