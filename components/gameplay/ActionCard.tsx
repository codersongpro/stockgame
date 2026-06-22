"use client";

import type { ActionCardDefinition } from "@/lib/engine";
import { formatMoney } from "@/lib/format";

export function ActionCard({
  card,
  disabled,
  simple,
  onPlay,
}: {
  card: ActionCardDefinition;
  disabled?: boolean;
  simple?: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      className={`rounded-lg border px-3 py-2 text-left transition ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
          : "border-brand-200 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50"
      }`}
      disabled={disabled}
      onClick={onPlay}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-black">
          <span className="mr-1">{card.emoji}</span>{card.name}
        </span>
        <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
          {card.actionPointCost}
        </span>
      </div>
      <div className="mt-1 text-xs leading-4 text-slate-500">
        {simple ? card.simpleDescription : card.description}
      </div>
      {card.cashCost ? (
        <div className="mt-1 text-xs font-semibold text-slate-400">{formatMoney(card.cashCost)}</div>
      ) : null}
    </button>
  );
}
