"use client";

import { useMemo, useState } from "react";
import type { GameState } from "@/lib/engine";
import { generateAdvice } from "@/lib/advisor";

const TONE: Record<string, string> = {
  warn: "bg-red-50 text-red-700",
  tip: "bg-sky-50 text-sky-700",
  good: "bg-green-50 text-green-700",
};

export function Secretary({ game }: { game: GameState }) {
  const [open, setOpen] = useState(true);
  const advice = useMemo(() => generateAdvice(game), [game]);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-500 px-4 py-3 text-left text-white"
      >
        <span className="animate-floaty text-2xl">🧑‍💼</span>
        <div className="flex-1">
          <div className="text-sm font-bold">비서 진서연</div>
          <div className="text-[11px] opacity-90">대표님께 드리는 조언</div>
        </div>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-1.5 p-3">
          {advice.map((a, i) => (
            <div key={i} className={`rounded-lg px-3 py-2 text-xs font-medium ${TONE[a.tone]}`}>
              {a.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
