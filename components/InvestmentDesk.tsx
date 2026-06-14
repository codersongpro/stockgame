"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import type { AssetClass, Company, GameState } from "@/lib/engine";
import { getIndustry } from "@/lib/data/industries";
import { formatMoney, formatNum, changePct, formatPct } from "@/lib/format";
import { Sparkline } from "./Sparkline";
import { PriceChart } from "./PriceChart";

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
}

export function InvestmentDesk({ game, company }: { game: GameState; company: Company }) {
  const [tab, setTab] = useState<"stocks" | "assets">("stocks");
  const [sel, setSel] = useState<Selection>(null);
  const [qty, setQty] = useState(10);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"all" | "held" | "rivals">("all");
  const tradeStock = useGameStore((s) => s.tradeStock);
  const tradeAsset = useGameStore((s) => s.tradeAsset);

  const companyById = new Map(game.companies.map((c) => [c.id, c]));
  const enabledAssets = game.config.enabledAssets;

  // Every listing on the market: in-game competitors + external companies.
  const allListings: Listing[] = Object.values(game.stocks)
    .filter((s) => s.companyId !== company.id)
    .map((s) => {
      const c = companyById.get(s.companyId);
      return {
        id: s.companyId,
        name: c?.name ?? s.name ?? s.companyId,
        logoColor: c?.logoColor ?? s.logoColor ?? "#64748b",
        industryId: c?.industryId ?? s.industryId ?? "tech",
        external: !c,
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
      // Rivals first, then by price desc for a stable, useful order.
      if (a.external !== b.external) return a.external ? 1 : -1;
      return game.stocks[b.id].price - game.stocks[a.id].price;
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
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔎 종목·업종 검색"
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-800 outline-none focus:border-brand-500"
          />
          <div className="flex gap-1.5 text-xs font-semibold">
            <ScopeChip active={scope === "all"} onClick={() => setScope("all")}>전체 {allListings.length}</ScopeChip>
            <ScopeChip active={scope === "rivals"} onClick={() => setScope("rivals")}>경쟁사</ScopeChip>
            <ScopeChip active={scope === "held"} onClick={() => setScope("held")}>보유</ScopeChip>
          </div>
          <div className="card max-h-[60vh] divide-y divide-slate-100 overflow-y-auto scroll-thin">
            {listings.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-400">종목이 없습니다.</div>
            )}
            {listings.map((l) => {
              const stock = game.stocks[l.id];
              const ind = getIndustry(l.industryId);
              const ch = changePct(stock.price, stock.history[stock.history.length - 2] ?? stock.price);
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
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-slate-800">{l.name}</span>
                      {!l.external && <span className="pill shrink-0 bg-brand-50 text-[10px] text-brand-600">경쟁사</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                      {held > 0 ? `보유 ${formatNum(held)}주` : ind.name}
                    </div>
                  </div>
                  <Sparkline data={stock.history.slice(-20)} width={70} height={28} />
                  <div className="w-24 text-right">
                    <div className="font-bold text-slate-800">{formatNum(stock.price)}</div>
                    <div className={`text-xs font-semibold ${ch >= 0 ? "text-bull" : "text-bear"}`}>
                      {formatPct(ch)}
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">보유</span>
          <span className="font-semibold text-slate-700">{formatNum(held)}</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button className="btn-ghost" onClick={() => setQty(Math.max(1, qty - 10))}>-10</button>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-bold text-slate-800"
          />
          <button className="btn-ghost" onClick={() => setQty(qty + 10)}>+10</button>
        </div>
        <div className="mt-2 text-center text-sm text-slate-500">
          예상 금액 <b className="text-slate-800">{formatMoney(cost)}</b>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="btn-bull" onClick={() => onTrade("buy")}>매수</button>
          <button className="btn-bear" onClick={() => onTrade("sell")} disabled={held <= 0}>매도</button>
        </div>
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
