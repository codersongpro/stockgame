"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { avgCost } from "@/lib/engine";
import type { AssetClass, Company, GameState } from "@/lib/engine";
import { getIndustry } from "@/lib/data/industries";
import { formatMoney, formatNum, changePct, formatPct } from "@/lib/format";
import { Sparkline } from "./Sparkline";
import { PriceChart } from "./PriceChart";
import { Term } from "./Term";

type Selection =
  | { kind: "stock"; id: string }
  | { kind: "asset"; id: AssetClass }
  | null;

interface Listing {
  id: string;
  name: string;
  logoColor: string;
  industryId: string;
  external: boolean;
  price: number;
  change: number;
  cap: number;
  per: number | null;
}

type SortKey = "cap" | "price" | "change" | "per" | "name";
const SORT_LABELS: Record<SortKey, string> = {
  cap: "시가총액", price: "주가", change: "등락률", per: "PER", name: "이름",
};

export function InvestmentDesk({ game, company }: { game: GameState; company: Company }) {
  const [tab, setTab] = useState<"stocks" | "assets">("stocks");
  const [sel, setSel] = useState<Selection>(null);
  const [qty, setQty] = useState(10);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "held" | "rivals">("all");
  const [sortBy, setSortBy] = useState<SortKey>("cap");
  const tradeStock = useGameStore((s) => s.tradeStock);
  const tradeAsset = useGameStore((s) => s.tradeAsset);

  const companyById = new Map(game.companies.map((c) => [c.id, c]));
  const enabledAssets = game.config.enabledAssets;

  // Every listing on the market: in-game competitors + external companies.
  const allListings: Listing[] = Object.values(game.stocks)
    .filter((s) => s.companyId !== company.id)
    .map((s) => {
      const c = companyById.get(s.companyId);
      const cap = s.price * s.sharesOutstanding;
      const annual = c ? c.lastProfit * 4 : 0;
      return {
        id: s.companyId,
        name: c?.name ?? s.name ?? s.companyId,
        logoColor: c?.logoColor ?? s.logoColor ?? "#64748b",
        industryId: c?.industryId ?? s.industryId ?? "tech",
        external: !c,
        price: s.price,
        change: changePct(s.price, s.history[s.history.length - 2] ?? s.price),
        cap,
        per: annual > 0 ? cap / annual : null,
      };
    });

  const q = query.trim().toLowerCase();
  const listings = allListings
    .filter((l) => {
      if (scope === "rivals" && l.external) return false;
      if (scope === "held" && (company.portfolio.stocks[l.id] ?? 0) <= 0) return false;
      if (q && !l.name.toLowerCase().includes(q) && !getIndustry(l.industryId).name.toLowerCase().includes(q))
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price": return b.price - a.price;
        case "change": return b.change - a.change;
        case "name": return a.name.localeCompare(b.name, "ko");
        case "per": {
          const av = a.per ?? Infinity, bv = b.per ?? Infinity;
          return av - bv;
        }
        case "cap":
        default: return b.cap - a.cap;
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Tab active={tab === "stocks"} onClick={() => { setTab("stocks"); setSel(null); }}>
          📈 주식
        </Tab>
        <Tab active={tab === "assets"} onClick={() => { setTab("assets"); setSel(null); }}>
          💰 자산
        </Tab>
      </div>

      {tab === "stocks" ? (
        <div className="space-y-2">
          <HoldingsPanel
            game={game}
            company={company}
            companyById={companyById}
            onPick={(id) => setSel({ kind: "stock", id })}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔎 종목·업종 검색"
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-800 outline-none focus:border-brand-500"
          />
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <ScopeChip active={scope === "all"} onClick={() => setScope("all")}>전체 {allListings.length}</ScopeChip>
            <ScopeChip active={scope === "rivals"} onClick={() => setScope("rivals")}>경쟁사</ScopeChip>
            <ScopeChip active={scope === "held"} onClick={() => setScope("held")}>보유</ScopeChip>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="ml-auto rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>{SORT_LABELS[k]}순</option>
              ))}
            </select>
          </div>
          {game.level === "elementary" && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              <span><Term term="시가총액">시총</Term>: 회사 전체 값어치</span>
              <span><Term term="PER" />: 비싼지 싼지 보는 값</span>
              <span><Term term="등락률" />: 어제보다 오른 정도</span>
            </div>
          )}
          <div className="card max-h-[60vh] divide-y divide-slate-100 overflow-y-auto scroll-thin">
            {listings.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-400">종목이 없습니다.</div>
            )}
            {listings.map((l) => {
              const stock = game.stocks[l.id];
              const ind = getIndustry(l.industryId);
              const held = company.portfolio.stocks[l.id] ?? 0;
              return (
                <button
                  key={l.id}
                  onClick={() => setSel({ kind: "stock", id: l.id })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-base"
                    style={{ background: l.logoColor + "22", color: l.logoColor }}
                  >
                    {ind.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-slate-800">{l.name}</span>
                      {!l.external && <span className="pill shrink-0 bg-brand-50 text-[10px] text-brand-600">경쟁사</span>}
                      {held > 0 && <span className="pill shrink-0 bg-slate-100 text-[10px] text-slate-500">보유 {formatNum(held)}</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                      시총 {formatMoney(l.cap)} · PER {l.per != null ? l.per.toFixed(1) : "—"}
                    </div>
                  </div>
                  <Sparkline data={stock.history.slice(-20)} width={70} height={28} />
                  <div className="w-24 text-right">
                    <div className="font-bold text-slate-800">{formatNum(stock.price)}</div>
                    <div className={`text-xs font-semibold ${l.change >= 0 ? "text-bull" : "text-bear"}`}>
                      {formatPct(l.change)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {enabledAssets.map((id) => {
            const a = game.assets[id];
            const ch = changePct(a.price, a.history[a.history.length - 2] ?? a.price);
            const held = company.portfolio.assets[id] ?? 0;
            return (
              <button
                key={id}
                onClick={() => setSel({ kind: "asset", id })}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-base">
                  {a.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-800">{a.name}</div>
                  <div className="text-xs text-slate-500">
                    {held > 0 ? `보유 ${formatNum(held)}` : a.desc}
                  </div>
                </div>
                <Sparkline data={a.history.slice(-20)} width={70} height={28} />
                <div className="w-24 text-right">
                  <div className="font-bold text-slate-800">{formatNum(a.price)}</div>
                  <div className={`text-xs font-semibold ${ch >= 0 ? "text-bull" : "text-bear"}`}>
                    {formatPct(ch)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Trade modal */}
      {sel && (
        <TradePanel
          game={game}
          company={company}
          sel={sel}
          qty={qty}
          setQty={setQty}
          onClose={() => setSel(null)}
          onTrade={(side) => {
            if (sel.kind === "stock") tradeStock(sel.id, qty, side);
            else tradeAsset(sel.id, qty, side);
          }}
        />
      )}
    </div>
  );
}

function TradePanel({
  game,
  company,
  sel,
  qty,
  setQty,
  onClose,
  onTrade,
}: {
  game: GameState;
  company: Company;
  sel: NonNullable<Selection>;
  qty: number;
  setQty: (n: number) => void;
  onClose: () => void;
  onTrade: (side: "buy" | "sell") => void;
}) {
  const isStock = sel.kind === "stock";
  const stock = isStock ? game.stocks[sel.id] : null;
  const stockCompany = isStock ? game.companies.find((c) => c.id === sel.id) : undefined;
  const price = isStock ? stock!.price : game.assets[sel.id].price;
  const name = isStock
    ? stockCompany?.name ?? stock!.name ?? sel.id
    : game.assets[sel.id].name;
  const color = isStock
    ? stockCompany?.logoColor ?? stock!.logoColor ?? "#0ea5e9"
    : "#0ea5e9";
  const history = isStock ? stock!.history : game.assets[sel.id].history;
  const held = isStock
    ? company.portfolio.stocks[sel.id] ?? 0
    : company.portfolio.assets[sel.id] ?? 0;
  const stockAvg = isStock ? avgCost(company, sel.id) : 0;
  const cost = price * qty;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md animate-popin rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <PriceChart data={history.slice(-40)} color={color} />
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-500">현재가</span>
          <span className="font-bold text-slate-800">{formatNum(price)}</span>
        </div>
        {isStock && stock && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500"><Term term="시가총액">시가총액</Term></span>
              <span className="font-semibold text-slate-700">{formatMoney(stock.price * stock.sharesOutstanding)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500"><Term term="PER" /></span>
              <span className="font-semibold text-slate-700">
                {stockCompany && stockCompany.lastProfit > 0
                  ? (stock.price * stock.sharesOutstanding / (stockCompany.lastProfit * 4)).toFixed(1)
                  : "—"}
              </span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">보유</span>
          <span className="font-semibold text-slate-700">{formatNum(held)}{isStock ? "주" : ""}</span>
        </div>
        {isStock && held > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">평단가</span>
            <span className="font-semibold text-slate-700">{formatNum(Math.round(stockAvg))}</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button className="btn-ghost" onClick={() => setQty(Math.max(1, qty - 10))}>-10</button>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-bold text-slate-800"
          />
          <button className="btn-ghost" onClick={() => setQty(qty + 10)}>+10</button>
          {held > 0 && (
            <button className="btn-ghost whitespace-nowrap" onClick={() => setQty(held)}>전량</button>
          )}
        </div>
        <div className="mt-2 text-center text-sm text-slate-500">
          {qty}{isStock ? "주" : "개"} 예상 금액 <b className="text-slate-800">{formatMoney(cost)}</b>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="btn-bull" onClick={() => onTrade("buy")}>매수</button>
          <button
            className="btn-bear"
            onClick={() => onTrade("sell")}
            disabled={held <= 0}
          >
            매도{isStock && held > 0 ? ` (${formatNum(Math.min(qty, held))}주)` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function HoldingsPanel({
  game,
  company,
  companyById,
  onPick,
}: {
  game: GameState;
  company: Company;
  companyById: Map<string, Company>;
  onPick: (id: string) => void;
}) {
  const holdings = Object.entries(company.portfolio.stocks)
    .filter(([, sh]) => sh > 0)
    .map(([id, shares]) => {
      const stock = game.stocks[id];
      const c = companyById.get(id);
      const price = stock?.price ?? 0;
      const avg = avgCost(company, id);
      const value = price * shares;
      const pl = (price - avg) * shares;
      const plPct = avg > 0 ? ((price - avg) / avg) * 100 : 0;
      return {
        id,
        name: c?.name ?? stock?.name ?? id,
        logoColor: c?.logoColor ?? stock?.logoColor ?? "#64748b",
        industryId: c?.industryId ?? stock?.industryId ?? "tech",
        shares, price, avg, value, pl, plPct,
      };
    })
    .sort((a, b) => b.value - a.value);

  if (holdings.length === 0) {
    return (
      <div className="card p-4 text-center text-sm text-slate-400">
        아직 보유한 주식이 없습니다. 아래 목록에서 종목을 골라 매수해 보세요.
      </div>
    );
  }

  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  const totalPl = holdings.reduce((s, h) => s + h.pl, 0);
  const totalCost = totalValue - totalPl;
  const totalPlPct = totalCost > 0 ? (totalPl / totalCost) * 100 : 0;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
        <h3 className="text-sm font-bold text-slate-800">📦 내 보유 주식</h3>
        <div className="text-right text-xs">
          <div className="font-bold text-slate-800">평가 {formatMoney(totalValue)}</div>
          <div className={`font-semibold ${totalPl >= 0 ? "text-bull" : "text-bear"}`}>
            {totalPl >= 0 ? "▲" : "▼"} {formatMoney(Math.abs(totalPl))} ({formatPct(totalPlPct)})
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {holdings.map((h) => {
          const ind = getIndustry(h.industryId);
          return (
            <button
              key={h.id}
              onClick={() => onPick(h.id)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                style={{ background: h.logoColor + "22", color: h.logoColor }}
              >
                {ind.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-800">{h.name}</div>
                <div className="text-[11px] text-slate-500">
                  {formatNum(h.shares)}주 · 평단 {formatNum(Math.round(h.avg))} → 현재 {formatNum(h.price)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800">{formatMoney(h.value)}</div>
                <div className={`text-[11px] font-semibold ${h.pl >= 0 ? "text-bull" : "text-bear"}`}>
                  {h.pl >= 0 ? "+" : "−"}{formatMoney(Math.abs(h.pl))} ({formatPct(h.plPct)})
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScopeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pill ${active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
    >
      {children}
    </button>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
        active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
