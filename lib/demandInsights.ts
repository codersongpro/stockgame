import type { DemandFactorBreakdown, LevelConfig } from "@/lib/engine";

// Turns the raw multiplicative demand factors (price/marketing/quality/
// reputation/share) into short Korean sentences for the turn-report popup,
// so players can see *why* sales moved instead of just the total number.

type FactorKey = keyof DemandFactorBreakdown;

const LABELS: Record<FactorKey, { name: string; up: string; down: string }> = {
  price: { name: "가격", up: "가격 전략이 통해 손님이 늘었어요", down: "가격이 부담스러워져 손님이 줄었어요" },
  marketing: { name: "마케팅", up: "마케팅 효과로 손님이 늘었어요", down: "마케팅이 부족해 손님이 줄었어요" },
  quality: { name: "품질", up: "품질이 좋아져 손님이 늘었어요", down: "품질이 나빠져 손님이 줄었어요" },
  reputation: { name: "평판", up: "평판이 좋아져 손님이 늘었어요", down: "평판이 나빠져 손님이 줄었어요" },
  share: { name: "경쟁 구도", up: "경쟁사보다 매력적이라 점유율이 늘었어요", down: "경쟁사에 밀려 손님을 뺏겼어요" },
};

const ORDER: FactorKey[] = ["price", "marketing", "quality", "reputation", "share"];
const SIGNIFICANT_RATIO = 1.02; // ignore <2% wobble as noise

interface FactorMove {
  key: FactorKey;
  direction: "up" | "down";
  ratio: number; // current / previous
}

function significantMoves(factors: DemandFactorBreakdown, prev: DemandFactorBreakdown): FactorMove[] {
  const moves: FactorMove[] = [];
  for (const key of ORDER) {
    const current = factors[key];
    const previous = prev[key] || 1;
    const ratio = current / previous;
    if (ratio >= SIGNIFICANT_RATIO) moves.push({ key, direction: "up", ratio });
    else if (ratio <= 1 / SIGNIFICANT_RATIO) moves.push({ key, direction: "down", ratio });
  }
  // Sort by strength of the move (furthest from 1.0) first.
  moves.sort((a, b) => Math.abs(b.ratio - 1) - Math.abs(a.ratio - 1));
  return moves;
}

/** Human-readable lines explaining this turn's demand swing, sized to the level's feedbackDepth. */
export function demandFactorInsights(
  factors: DemandFactorBreakdown,
  prev: DemandFactorBreakdown,
  feedbackDepth: LevelConfig["feedbackDepth"],
): string[] {
  const moves = significantMoves(factors, prev);
  if (moves.length === 0) return [];

  if (feedbackDepth === "analysis") {
    return moves.map((m) => {
      const pct = Math.round((m.ratio - 1) * 100);
      const label = LABELS[m.key];
      return `${label.name} 요인 ${m.direction === "up" ? "+" : ""}${pct}% — ${m.direction === "up" ? label.up : label.down}`;
    });
  }

  const count = feedbackDepth === "picture" || feedbackDepth === "simple" ? 1 : 2;
  return moves.slice(0, count).map((m) => {
    const label = LABELS[m.key];
    return m.direction === "up" ? label.up : label.down;
  });
}
