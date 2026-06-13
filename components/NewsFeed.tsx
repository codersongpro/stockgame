"use client";

import { LAYER_LABELS } from "@/lib/engine";
import type { EventTone, GameState, NewsItem } from "@/lib/engine";

const TONE_CLS: Record<EventTone, string> = {
  positive: "border-l-bull bg-green-50",
  negative: "border-l-bear bg-red-50",
  neutral: "border-l-slate-400 bg-slate-50",
};

export function NewsFeed({ game }: { game: GameState }) {
  const items = [...game.news].reverse();
  return (
    <div className="card p-4">
      <h3 className="mb-3 text-base font-bold text-slate-800">📰 뉴스 & 사건</h3>
      <div className="max-h-[70vh] space-y-2 overflow-y-auto scroll-thin pr-1">
        {items.length === 0 && (
          <p className="text-sm text-slate-400">아직 큰 사건이 없습니다. 턴을 진행해 보세요.</p>
        )}
        {items.map((n) => (
          <NewsCard key={n.id} n={n} />
        ))}
      </div>
    </div>
  );
}

function NewsCard({ n }: { n: NewsItem }) {
  return (
    <div className={`rounded-r-lg border-l-4 p-3 ${TONE_CLS[n.tone]}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{n.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <b className="text-sm text-slate-800">{n.title}</b>
          </div>
          <p className="mt-0.5 text-xs text-slate-600">{n.body}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
            <span className="rounded bg-white/70 px-1.5 py-0.5 font-semibold">
              {LAYER_LABELS[n.layer]}
            </span>
            <span>{n.turn}분기</span>
          </div>
        </div>
      </div>
    </div>
  );
}
