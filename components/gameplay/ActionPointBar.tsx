"use client";

import type { ActionPointState } from "@/lib/engine";

export function ActionPointBar({ actionPoints }: { actionPoints?: ActionPointState }) {
  if (!actionPoints) return null;

  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
        <span>행동력</span>
        <span>{actionPoints.current} / {actionPoints.max}</span>
      </div>
      <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${actionPoints.max}, minmax(0, 1fr))` }}>
        {Array.from({ length: actionPoints.max }).map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full ${index < actionPoints.current ? "bg-brand-500" : "bg-slate-200"}`}
          />
        ))}
      </div>
    </div>
  );
}
