"use client";

import { rankings } from "@/lib/engine";
import type { GameState } from "@/lib/engine";
import { formatMoney } from "@/lib/format";

export function Leaderboard({
  game,
  onVisit,
}: {
  game: GameState;
  onVisit?: (companyId: string) => void;
}) {
  const entries = rankings(game);
  return (
    <div className="card p-4">
      <h3 className="mb-3 text-base font-bold text-slate-800">🏆 순위 (순자산)</h3>
      <div className="space-y-1.5">
        {entries.map((e, i) => (
          <div
            key={e.companyId}
            className={`flex items-center gap-3 rounded-xl p-2.5 ${
              e.isPlayer ? "bg-brand-50 ring-1 ring-brand-300" : "bg-slate-50"
            }`}
          >
            <span className="w-6 text-center text-lg">{medal(i)}</span>
            <span className="h-7 w-7 rounded-lg" style={{ background: e.logoColor }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-800">
                {e.name} {e.isPlayer && <span className="text-xs text-brand-600">(나)</span>}
              </div>
              <div className="text-xs text-slate-400">
                기업 {formatMoney(e.companyValue)} · 투자 {formatMoney(e.portfolioValue)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800">{formatMoney(e.netWorth)}</div>
              {onVisit && !e.isPlayer && (
                <button
                  className="text-xs text-brand-600 hover:underline"
                  onClick={() => onVisit(e.companyId)}
                >
                  방문 →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function medal(i: number): string {
  return ["🥇", "🥈", "🥉"][i] ?? `${i + 1}`;
}
