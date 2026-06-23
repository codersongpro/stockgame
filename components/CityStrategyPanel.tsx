"use client";

import { SpriteSheetImage } from "@/components/SpriteSheetImage";
import { DISTRICT_ART, STRATEGY_EVENT_ART } from "@/lib/assetMap";
import { getOperationsGuide, getStrategyEventGuide, type GameState } from "@/lib/engine";

export function CityStrategyPanel({ game }: { game: GameState }) {
  const districts = Object.values(game.city.districts).filter((district) => district.unlocked);
  const activeEvents = game.strategy.majorEvents.filter((event) => event.status === "active");
  const guide = getOperationsGuide(game);

  return (
    <section className="card p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">유니콘시티 운영</div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {districts.slice(0, 6).map((district) => (
          <div key={district.id} className="overflow-hidden rounded-lg bg-slate-50">
            <SpriteSheetImage crop={DISTRICT_ART[district.id]} className="h-20 w-full bg-slate-100" />
            <div className="px-3 py-2">
              <div className="truncate text-xs font-bold text-slate-700">{district.label}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Lv {district.level}</span>
                <span>시너지 {district.synergy}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-700">
        만족도 {game.city.satisfaction}점. 구역 보너스는 생산, 품질, 평판, 직원 사기에 반영됩니다.
      </div>

      <div className="mt-3 space-y-2">
        <div className="text-xs font-bold text-slate-500">운영 포인트</div>
        {guide.districtFocus.slice(0, 3).map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-700">{item.label}</span>
              <span className={item.status === "strong" ? "text-xs font-bold text-emerald-600" : "text-xs font-bold text-slate-500"}>
                Lv {item.level}
              </span>
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-600">{item.message}</div>
          </div>
        ))}
      </div>

      {guide.talentFocus.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-bold text-slate-500">담당 인물</div>
          {guide.talentFocus.map((item) => (
            <div key={`${item.role}-${item.name}`} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs leading-5 text-indigo-700">
              <div className="font-black">{item.label} · {item.name}</div>
              <div>{item.message}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold leading-5 text-brand-700">
        {guide.nextStep}
      </div>

      {activeEvents.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-bold text-bear">전략 장면</div>
          {activeEvents.map((event) => {
            const eventGuide = getStrategyEventGuide(event);
            return (
              <div key={event.id} className="overflow-hidden rounded-lg bg-red-50 text-xs leading-5 text-red-700">
                <SpriteSheetImage crop={STRATEGY_EVENT_ART[event.kind]} className="h-24 w-full bg-red-100" />
                <div className="px-3 py-2">
                  <div className="font-bold">{event.title}</div>
                  <div>{event.body}</div>
                  <div className="mt-2 font-bold">대응 방법</div>
                  <ul className="mt-1 space-y-1">
                    {eventGuide.options.map((option) => (
                      <li key={option} className="flex gap-2">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-500" />
                        <span>{option}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
