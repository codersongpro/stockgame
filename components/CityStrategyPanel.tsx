"use client";

import type { GameState } from "@/lib/engine";

export function CityStrategyPanel({ game }: { game: GameState }) {
  const districts = Object.values(game.city.districts).filter((district) => district.unlocked);
  const activeEvents = game.strategy.majorEvents.filter((event) => event.status === "active");

  return (
    <section className="card p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">유니콘시티</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {districts.slice(0, 6).map((district) => (
          <div key={district.id} className="rounded-lg bg-slate-50 px-3 py-2">
            <div className="truncate text-xs font-bold text-slate-700">{district.label}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Lv {district.level}</span>
              <span>시너지 {district.synergy}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
        만족도 {game.city.satisfaction} · 구역 보너스는 생산, 품질, 평판, 사기에 작게 반영됩니다.
      </div>

      {activeEvents.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-bold text-bear">전략 장면</div>
          {activeEvents.map((event) => (
            <div key={event.id} className="rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
              <div className="font-bold">{event.title}</div>
              <div>{event.body}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
