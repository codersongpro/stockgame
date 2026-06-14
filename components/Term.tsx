"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { GLOSSARY } from "@/lib/data/glossary";

/**
 * Tappable glossary term. In the elementary level, wrapping a difficult word
 * with <Term term="순자산">…</Term> renders it with a dotted underline and a
 * tap-to-reveal kid-friendly explanation. In other levels it's plain text.
 */
export function Term({ term, children }: { term: string; children?: React.ReactNode }) {
  const level = useGameStore((s) => s.game?.level);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const text = children ?? term;
  const explanation = GLOSSARY[term];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Only interactive for young learners; otherwise render plain text.
  if (level !== "elementary" || !explanation) return <>{text}</>;

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="cursor-help underline decoration-dotted decoration-brand-400 underline-offset-2"
      >
        {text}
        <span className="ml-0.5 text-[10px] text-brand-500">❓</span>
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 w-52 -translate-x-1/2 rounded-xl bg-slate-800 px-3 py-2 text-left text-xs font-normal leading-snug text-white shadow-lg">
          <b className="mb-0.5 block text-brand-200">{term}</b>
          {explanation}
        </span>
      )}
    </span>
  );
}
