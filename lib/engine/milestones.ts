import type { GameState, NewsItem } from "./types";
import { netWorth, playerRank } from "./ranking";

// One-time celebration beats for the player's progress: net-worth multiples
// of their starting cash (so thresholds scale with the level's difficulty)
// and leaderboard-rank milestones. Each fires once per game, nudges
// reputation up a little, and drops a positive news item — the game is
// called Unicorn City, so it should actually tell you when you become one.

interface MilestoneDef {
  id: string;
  emoji: string;
  title: string;
  body: string;
  reputationBonus: number;
}

const NET_WORTH_TIERS: { id: string; multiple: number; emoji: string; title: string; body: string; reputationBonus: number }[] = [
  { id: "growth-2x", multiple: 2, emoji: "📈", title: "성장 궤도 진입", body: "순자산이 시작 자본의 2배를 넘었습니다. 순조로운 출발이에요!", reputationBonus: 3 },
  { id: "growth-5x", multiple: 5, emoji: "🚀", title: "탄탄대로", body: "순자산이 시작 자본의 5배를 넘었습니다. 투자자들이 주목하기 시작했어요.", reputationBonus: 5 },
  { id: "unicorn-10x", multiple: 10, emoji: "🦄", title: "유니콘 등극!", body: "순자산이 시작 자본의 10배를 돌파했습니다. 드디어 유니콘 기업이 되었습니다!", reputationBonus: 10 },
  { id: "legend-20x", multiple: 20, emoji: "👑", title: "레전드 기업", body: "순자산이 시작 자본의 20배를 돌파했습니다. 업계의 전설로 불리기 시작했어요.", reputationBonus: 15 },
];

const RANK_TIERS: { id: string; rank: number; emoji: string; title: string; body: string; reputationBonus: number }[] = [
  { id: "rank-10", rank: 10, emoji: "🔟", title: "톱10 진입", body: "순자산 순위 10위 안에 들었습니다!", reputationBonus: 2 },
  { id: "rank-5", rank: 5, emoji: "🏅", title: "톱5 진입", body: "순자산 순위 5위 안에 들었습니다!", reputationBonus: 4 },
  { id: "rank-3", rank: 3, emoji: "🥉", title: "톱3 진입", body: "순자산 순위 3위 안에 들었습니다!", reputationBonus: 6 },
  { id: "rank-1", rank: 1, emoji: "🏆", title: "업계 1위 등극!", body: "드디어 순자산 기준 업계 1위에 올랐습니다!", reputationBonus: 10 },
];

let milestoneNewsCounter = 0;

/** Check for newly-crossed milestones this turn, reward and announce them. */
export function applyMilestones(state: GameState): void {
  const player = state.companies.find((c) => c.id === state.playerCompanyId);
  if (!player) return;

  const reached = new Set(state.milestonesReached ?? []);
  const nw = netWorth(player, state);
  const rank = playerRank(state);
  const startingCash = Math.max(1, state.config.startingCash);

  const newlyReached: MilestoneDef[] = [];

  for (const tier of NET_WORTH_TIERS) {
    if (reached.has(tier.id)) continue;
    if (nw >= startingCash * tier.multiple) {
      reached.add(tier.id);
      newlyReached.push(tier);
    }
  }
  for (const tier of RANK_TIERS) {
    if (reached.has(tier.id)) continue;
    // Only meaningful once there are actually enough rivals to rank against.
    if (state.companies.length > tier.rank && rank <= tier.rank) {
      reached.add(tier.id);
      newlyReached.push(tier);
    }
  }

  if (newlyReached.length === 0) return;

  for (const milestone of newlyReached) {
    player.reputation = Math.min(100, player.reputation + milestone.reputationBonus);
    pushMilestoneNews(state, milestone);
  }
  state.milestonesReached = [...reached];
}

function pushMilestoneNews(state: GameState, milestone: MilestoneDef): void {
  const item: NewsItem = {
    id: `milestone-${milestone.id}-${milestoneNewsCounter++}`,
    turn: state.turn,
    layer: "internal",
    tone: "positive",
    emoji: milestone.emoji,
    title: milestone.title,
    body: milestone.body,
    tags: ["milestone", milestone.id],
  };
  state.news.push(item);
}
