"use client";

import { useState } from "react";
import { fundamentalValue, DEALS, type Company, type GameState } from "@/lib/engine";
import { useGameStore } from "@/store/gameStore";
import { getIndustry } from "@/lib/data/industries";
import { COUNTRIES, getCountry } from "@/lib/data/countries";
import { formatMoney, formatNum } from "@/lib/format";
import { CompanyCity } from "./CompanyCity";
import { Bar } from "./Sparkline";

export function WorldMap({
  game,
  initialCompanyId,
}: {
  game: GameState;
  initialCompanyId?: string | null;
}) {
  const [visiting, setVisiting] = useState<string | null>(initialCompanyId ?? null);
  const competitors = game.companies.filter((c) => c.id !== game.playerCompanyId);
  const visited = competitors.find((c) => c.id === visiting);

  if (visited) {
    return <VisitCompany game={game} company={visited} onBack={() => setVisiting(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="mb-3 text-base font-bold text-slate-800">🏢 경쟁사 방문</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {competitors.map((c) => {
            const ind = getIndustry(c.industryId);
            const ctry = getCountry(c.countryId);
            return (
              <button
                key={c.id}
                onClick={() => setVisiting(c.id)}
                className="flex items-center gap-3 rounded-xl p-3 text-left ring-1 ring-slate-200 hover:ring-brand-400"
              >
                <span className="h-9 w-9 rounded-lg" style={{ background: c.logoColor }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-500">{ctry.flag} {ind.emoji} {ind.name}</div>
                </div>
                <span className="text-xs text-brand-600">방문 →</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 text-base font-bold text-slate-800">🌐 나라 둘러보기</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {COUNTRIES.map((c) => (
            <div key={c.id} className="rounded-xl p-3 ring-1 ring-slate-200">
              <div className="font-bold text-slate-800">{c.flag} {c.name}</div>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-slate-500">
                <span>성장률 {c.baseGrowth}%</span>
                <span>물가 {c.baseInflation}%</span>
                <span>금리 {c.baseRate}%</span>
                <span>세율 {Math.round(c.taxRate * 100)}%</span>
                <span>시장규모 {c.marketSize}x</span>
                <span>인건비 {c.laborCost}x</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">{c.centralBank}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisitCompany({
  game,
  company,
  onBack,
}: {
  game: GameState;
  company: Company;
  onBack: () => void;
}) {
  const ind = getIndustry(company.industryId);
  const ctry = getCountry(company.countryId);
  const stock = game.stocks[company.id];
  return (
    <div className="space-y-3">
      <button className="btn-ghost" onClick={onBack}>◀ 목록으로</button>
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-xl" style={{ background: company.logoColor }} />
          <div>
            <div className="text-lg font-black text-slate-800">{company.name}</div>
            <div className="text-xs text-slate-500">{ctry.flag} {ind.emoji} {ind.name}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <Stat label="주가" value={formatNum(stock.price)} />
          <Stat label="기업가치" value={formatMoney(fundamentalValue(company))} />
          <Stat label="직원" value={`${formatNum(company.employees)}명`} />
        </div>
        <div className="mt-3 space-y-2">
          <LabeledBar label="품질" value={company.quality} />
          <LabeledBar label="평판" value={company.reputation} />
        </div>
      </div>
      <DealPanel game={game} target={company} />

      <div className="card p-3">
        <div className="mb-2 text-sm font-semibold text-slate-600">캠퍼스 (관전 모드)</div>
        <CompanyCity game={game} company={company} readOnly />
      </div>
    </div>
  );
}

const DEAL_DESC: Record<string, string> = {
  partner: "관계 개선·양사 주가 상승·평판↑",
  license: "우리 품질·기술 향상",
  comarket: "평판 상승·노출 확대",
  scout: "상대 인재를 우리 인재시장으로",
};

function DealPanel({ game, target }: { game: GameState; target: Company }) {
  const proposeDeal = useGameStore((s) => s.proposeDeal);
  const player = game.companies.find((c) => c.id === game.playerCompanyId)!;
  return (
    <div className="card p-4">
      <h3 className="mb-1 text-base font-bold text-slate-800">🤝 {target.name}와(과) 교류</h3>
      <p className="mb-3 text-xs text-slate-500">제안에는 비용이 들고 즉시 효과가 적용돼요.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(DEALS).map(([id, def]) => {
          const affordable = player.cash >= def.cost;
          return (
            <button
              key={id}
              disabled={!affordable}
              onClick={() => proposeDeal(target.id, id)}
              className="rounded-xl p-3 text-left ring-1 ring-slate-200 hover:ring-brand-400 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{def.label}</span>
                <span className="text-xs text-slate-500">{formatMoney(def.cost)}</span>
              </div>
              <div className="text-xs text-slate-500">{DEAL_DESC[id]}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-bold text-slate-800">{value}</div>
    </div>
  );
}

function LabeledBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <Bar value={value} />
    </div>
  );
}
