"use client";

import {
  netWorth,
  playerRank,
  portfolioValue,
  fundamentalValue,
  type GameState,
} from "@/lib/engine";
import { getIndustry } from "@/lib/data/industries";
import { getCountry } from "@/lib/data/countries";
import { formatMoney, changePct, formatPct } from "@/lib/format";
import { Sparkline } from "./Sparkline";
import { CompanyCity } from "./CompanyCity";
import { Term } from "./Term";

export function Dashboard({ game }: { game: GameState }) {
  const p = game.companies.find((c) => c.id === game.playerCompanyId)!;
  const nw = netWorth(p, game);
  const rank = playerRank(game);
  const ind = getIndustry(p.industryId);
  const ctry = getCountry(p.countryId);
  const hist = p.netWorthHistory;
  const nwChange = changePct(nw, hist[hist.length - 2] ?? nw);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-indigo-500 p-5 text-white">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span className="h-6 w-6 rounded" style={{ background: p.logoColor }} />
            {p.name}
            <span className="pill bg-white/20">{ctry.flag} {ind.emoji} {ind.name}</span>
            {p.basedOn && <span className="pill bg-white/20">모티브</span>}
          </div>
          <div className="mt-3 text-xs uppercase tracking-wide opacity-80">총 <Term term="순자산" /></div>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-black">{formatMoney(nw)}</div>
            <div className={`mb-1 text-sm font-bold ${nwChange >= 0 ? "text-green-200" : "text-red-200"}`}>
              {formatPct(nwChange)}
            </div>
          </div>
          <div className="mt-2">
            <Sparkline data={hist.slice(-24)} width={260} height={40} stroke="#ffffff" />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-4">
          <Cell label={<Term term="순위" />} value={`${rank}위 / ${game.companies.length}`} />
          <Cell label={<Term term="현금" />} value={formatMoney(p.cash)} />
          <Cell label={<Term term="기업가치" />} value={formatMoney(fundamentalValue(p))} />
          <Cell label={<Term term="투자자산" />} value={formatMoney(portfolioValue(p, game))} />
        </div>
      </div>

      {/* Living campus overview */}
      <div className="card p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">🏙️ 우리 회사 전경</h3>
          <span className="text-[11px] text-slate-400">드래그로 둘러보기</span>
        </div>
        <CompanyCity game={game} company={p} readOnly overview />
      </div>

      {/* Quick facts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Mini label={<Term term="매출">지난 매출</Term>} value={formatMoney(p.lastRevenue)} emoji="💵" />
        <Mini label={<Term term="이익">지난 이익</Term>} value={formatMoney(p.lastProfit)} emoji={p.lastProfit >= 0 ? "📈" : "📉"} />
        <Mini label="건물" value={`${p.buildings.length}개`} emoji="🏗️" />
        <Mini label="임원" value={`${p.hired.length}명`} emoji="👔" />
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="p-3 text-center">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="font-bold text-slate-800">{value}</div>
    </div>
  );
}

function Mini({ label, value, emoji }: { label: React.ReactNode; value: string; emoji: string }) {
  return (
    <div className="card flex items-center gap-2 p-3">
      <span className="text-xl">{emoji}</span>
      <div>
        <div className="text-[11px] text-slate-500">{label}</div>
        <div className="text-sm font-bold text-slate-800">{value}</div>
      </div>
    </div>
  );
}
