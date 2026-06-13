"use client";

import { PHASE_EMOJI, PHASE_LABELS } from "@/lib/engine";
import type { GameState } from "@/lib/engine";
import { getCountry } from "@/lib/data/countries";

export function EconomyIndicators({ game }: { game: GameState }) {
  const m = game.macro;
  const country = getCountry(
    game.companies.find((c) => c.id === game.playerCompanyId)!.countryId,
  );
  const sentimentPct = Math.round((m.sentiment + 1) * 50);

  return (
    <div className="card p-4">
      <h3 className="mb-3 text-base font-bold text-slate-800">🌍 경제 지표</h3>

      <div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
        <span className="text-3xl">{PHASE_EMOJI[m.phase]}</span>
        <div>
          <div className="font-bold text-slate-800">{PHASE_LABELS[m.phase]}</div>
          <div className="text-xs text-slate-500">현재 경제 국면</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Metric label="GDP 성장률" value={`${m.gdpGrowth.toFixed(1)}%`} />
        <Metric label="물가(인플레)" value={`${m.inflation.toFixed(1)}%`} />
        <Metric label={`기준금리`} value={`${m.interestRate.toFixed(2)}%`} hint={country.centralBank} />
        <Metric label="시장 심리" value={`${sentimentPct}`} hint={sentimentPct >= 50 ? "낙관" : "비관"} />
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-bold text-slate-800">{value}</div>
      {hint && <div className="text-[10px] text-slate-400">{hint}</div>}
    </div>
  );
}
