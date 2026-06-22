"use client";

import { getRival } from "@/lib/data/campaign/rivals";
import { priceWarProgress, type GameState } from "@/lib/engine";

export function RivalPanel({ game }: { game: GameState }) {
  if (!game.campaign?.enabled || !game.rival) return null;

  const rival = getRival(game.rival.activeRivalId);
  const progress = priceWarProgress(game);
  const turnsLeft = Math.max(0, game.rival.turnsTotal - game.rival.turnInChapter);

  return (
    <section className="card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-2xl">
          {rival?.emoji ?? "⚔️"}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-red-600">경쟁자 등장</div>
          <h3 className="mt-1 text-base font-black leading-5 text-slate-900">
            {rival?.name ?? "경쟁자"} · {rival?.title ?? "라이벌"}
          </h3>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            {game.rival.currentTaunt}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Metric label="남은 분기" value={`${turnsLeft}`} />
        <Metric label="우리 손님" value={`${game.rival.playerMarketShare}%`} />
        <Metric label="목표 통과" value={`${progress.passed}/${progress.total}`} />
      </div>

      <div className="mt-3 space-y-2">
        {game.rival.objectiveStates.map((objective) => (
          <div key={objective.id} className="rounded-lg border border-slate-200 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700">{objective.label}</span>
              <span className={objective.passed ? "text-sm font-black text-emerald-600" : "text-sm font-black text-slate-500"}>
                {objective.passed ? "달성" : `${objective.current.toLocaleString()} / ${objective.target.toLocaleString()}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {game.rival.status !== "active" && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-bold ${
          game.rival.status === "won" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}>
          {game.rival.status === "won" ? "가격 전쟁에서 승리했습니다." : "가격 전쟁을 다시 준비해야 합니다."}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}
