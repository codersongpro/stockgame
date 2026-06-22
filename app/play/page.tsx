"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { netWorth, playerRank, rankings, LAYER_LABELS } from "@/lib/engine";
import type { NewsItem } from "@/lib/engine";
import type { TurnSummary } from "@/lib/engine/tick";
import { formatMoney } from "@/lib/format";
import { initAudio, isMuted, setMuted } from "@/lib/audio";

import { Dashboard } from "@/components/Dashboard";
import { CompanyCity } from "@/components/CompanyCity";
import { CompanyPanel } from "@/components/CompanyPanel";
import { InvestmentDesk } from "@/components/InvestmentDesk";
import { TalentMarket } from "@/components/TalentMarket";
import { NewsFeed } from "@/components/NewsFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { EconomyIndicators } from "@/components/EconomyIndicators";
import { Secretary } from "@/components/Secretary";
import { CompanyStatusCard } from "@/components/CompanyStatusCard";
import { WorldMap } from "@/components/WorldMap";
import { CampusStrip } from "@/components/CampusStrip";
import { HelpModal } from "@/components/HelpModal";
import { Tutorial } from "@/components/Tutorial";
import { ExecutiveBriefing } from "@/components/ExecutiveBriefing";
import { CampaignGoalCard } from "@/components/CampaignGoalCard";
import { CityStrategyPanel } from "@/components/CityStrategyPanel";
import { TAB_ICONS, RESULT_ICONS, BANNER_IMGS } from "@/lib/assetMap";

const TUTORIAL_SEEN_KEY = "uc_tutorial_seen";

type Tab = "home" | "company" | "invest" | "talent" | "news" | "rank" | "visit";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "home", label: "대시보드", emoji: "🏠" },
  { id: "company", label: "회사", emoji: "🏙️" },
  { id: "invest", label: "투자", emoji: "📈" },
  { id: "talent", label: "인재", emoji: "👔" },
  { id: "news", label: "뉴스", emoji: "📰" },
  { id: "rank", label: "순위", emoji: "🏆" },
  { id: "visit", label: "방문", emoji: "🌍" },
];

const SIMPLE_TAB_LABELS: Partial<Record<Tab, string>> = {
  home:    "홈",
  company: "내 회사",
  invest:  "주식·예금",
  talent:  "직원",
  news:    "소식",
};

export default function PlayPage() {
  const router = useRouter();
  const game = useGameStore((s) => s.game);
  const next = useGameStore((s) => s.next);
  const toast = useGameStore((s) => s.toast);
  const dismissToast = useGameStore((s) => s.dismissToast);
  const loadSave = useGameStore((s) => s.loadSave);

  const [tab, setTab] = useState<Tab>("home");
  const [visitId, setVisitId] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);
  const [ready, setReady] = useState(false);
  const [eventPopup, setEventPopup] = useState<NewsItem[] | null>(null);
  const [resultsPopup, setResultsPopup] = useState<{ summary: TurnSummary; prevNw: number } | null>(null);
  const [help, setHelp] = useState<null | "tutorial" | "manual" | "glossary">(null);
  const lockUntil = useRef(0);

  // Advance one quarter. Guards against (a) rapid double-clicks force-skipping
  // multiple turns and (b) skipping past an unacknowledged event popup.
  const handleNext = () => {
    if (eventPopup || resultsPopup) return; // must acknowledge popups first
    const now = Date.now();
    if (now < lockUntil.current) return; // debounce accidental multi-advance
    lockUntil.current = now + 400;
    // Record net worth before advancing so we can show the delta.
    const prevGame = useGameStore.getState().game;
    const prevPlayer = prevGame?.companies.find((c) => c.id === prevGame.playerCompanyId);
    const prevNw = prevPlayer && prevGame ? netWorth(prevPlayer, prevGame) : 0;
    next();
    const summary = useGameStore.getState().lastSummary;
    if (summary?.playerResult) setResultsPopup({ summary, prevNw });
    else {
      const events = summary?.events ?? [];
      if (events.length > 0) setEventPopup(events);
    }
  };

  const handleResultsDismiss = () => {
    const events = resultsPopup?.summary.events ?? [];
    setResultsPopup(null);
    if (events.length > 0) setEventPopup(events);
  };

  // Hydrate from save if the store is empty (e.g. page refresh).
  useEffect(() => {
    initAudio();
    setMutedState(isMuted());
    if (!useGameStore.getState().game) {
      if (!loadSave()) {
        router.replace("/");
        return;
      }
    }
    setReady(true);
    // Show the tutorial automatically the first time a player reaches the game.
    try {
      if (!window.localStorage.getItem(TUTORIAL_SEEN_KEY)) {
        setHelp("tutorial");
        window.localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
      }
    } catch {
      /* ignore storage errors */
    }
  }, [loadSave, router]);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 2200);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  if (!ready || !game) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">불러오는 중…</div>;
  }

  const player = game.companies.find((c) => c.id === game.playerCompanyId)!;
  const nw = netWorth(player, game);
  const rank = playerRank(game);
  const ended = game.status === "ended";

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    setMutedState(m);
  };

  const goVisit = (companyId: string) => {
    setVisitId(companyId);
    setTab("visit");
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      {/* Author bar */}
      <div className="w-full bg-slate-800 py-1 text-center text-xs text-slate-400">
        제작 by <span className="font-semibold text-slate-300">Dustin</span> · Teacher · Data Analytics · App Developer
      </div>
      {/* Top bar */}
      <header className="sticky top-0 z-30 overflow-hidden bg-white/90 shadow-sm backdrop-blur">
        <CampusStrip buildings={player.buildings} className="absolute inset-x-0 bottom-0 h-12" opacity={0.07} />
        <div className="relative mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg" style={{ background: player.logoColor }} />
            <div className="leading-tight">
              <div className="text-sm font-black text-slate-800">{player.name}</div>
              <div className="text-xs text-slate-500">
                {game.turn}/{game.maxTurns}분기 · {rank}위
              </div>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-slate-500">순자산</div>
            <div className="text-sm font-black text-slate-800">{formatMoney(nw)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">현금</div>
            <div className="text-sm font-bold text-bull">{formatMoney(player.cash)}</div>
          </div>
          <button onClick={() => setHelp("manual")} className="btn-ghost !px-2.5 !py-2" title="도움말">
            ❓
          </button>
          <button onClick={toggleMute} className="btn-ghost !px-2.5 !py-2" title="효과음">
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            id="btn-next-turn"
            onClick={handleNext}
            disabled={ended || !!eventPopup || !!resultsPopup}
            className="btn-primary whitespace-nowrap"
          >
            {ended ? "게임 종료" : "다음 분기 ▶"}
          </button>
        </div>

        {/* Tabs */}
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto scroll-thin px-2 pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                tab === t.id ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {game.config.simplifiedLabels ? (SIMPLE_TAB_LABELS[t.id] ?? t.label) : t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Body */}
      <main className="mx-auto grid max-w-5xl gap-4 px-4 py-4 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {tab === "home" && <Dashboard game={game} />}
          {tab === "company" && (
            <div className="space-y-4">
              <div className="card p-4">
                <h3 className="mb-3 text-base font-bold text-slate-800">🏙️ 우리 회사 캠퍼스</h3>
                <CompanyCity game={game} company={player} />
              </div>
              <CompanyPanel game={game} company={player} />
            </div>
          )}
          {tab === "invest" && <InvestmentDesk />}
          {tab === "talent" && <TalentMarket game={game} company={player} />}
          {tab === "news" && <NewsFeed game={game} />}
          {tab === "rank" && <Leaderboard game={game} onVisit={goVisit} />}
          {tab === "visit" && <WorldMap game={game} initialCompanyId={visitId} />}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <CampaignGoalCard game={game} />
          <CityStrategyPanel game={game} />
          <Secretary game={game} />
          <CompanyStatusCard game={game} company={player} />
          <EconomyIndicators game={game} />
        </aside>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 animate-popin">
          <div
            className={`rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg ${
              toast.tone === "good" ? "bg-bull" : toast.tone === "bad" ? "bg-bear" : "bg-slate-700"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* Quarterly results popup */}
      {resultsPopup && (
        <ResultsPopup
          game={game}
          summary={resultsPopup.summary}
          prevNw={resultsPopup.prevNw}
          onClose={handleResultsDismiss}
        />
      )}

      {/* Event popup */}
      {eventPopup && (
        <EventPopup events={eventPopup} onClose={() => setEventPopup(null)} />
      )}

      {/* Game over overlay */}
      {ended && <GameOver game={game} onRestart={() => router.push("/")} />}

      {/* iorad-style tutorial overlay */}
      {help === "tutorial" && <Tutorial level={game.level} onClose={() => setHelp(null)} />}

      {/* Help center (manual / glossary) */}
      {help !== null && help !== "tutorial" && (
        <HelpModal open initialTab={help} onClose={() => setHelp(null)} />
      )}
    </div>
  );
}

function ResultsPopup({
  game,
  summary,
  prevNw,
  onClose,
}: {
  game: ReturnType<typeof useGameStore.getState>["game"] & object;
  summary: TurnSummary;
  prevNw: number;
  onClose: () => void;
}) {
  if (!game) return null;
  const r = summary.playerResult!;
  const player = game.companies.find((c) => c.id === game.playerCompanyId)!;
  const nw = netWorth(player, game);
  const nwDelta = nw - prevNw;
  const rank = playerRank(game);
  const stock = game.stocks[player.id];
  const campaign = game.campaign;
  const stockChange = stock
    ? ((stock.price - (stock.history[stock.history.length - 2] ?? stock.price)) /
        (stock.history[stock.history.length - 2] ?? stock.price)) *
      100
    : 0;

  const rows: { label: string; value: string; tone?: "good" | "bad" | "neutral" }[] = [
    { label: "매출", value: formatMoney(r.revenue), tone: r.revenue > 0 ? "good" : "neutral" },
    { label: "판매량", value: `${r.unitsSold.toLocaleString()}개`, tone: "neutral" },
    {
      label: "영업 이익",
      value: `${r.profit >= 0 ? "+" : ""}${formatMoney(r.profit)}`,
      tone: r.profit >= 0 ? "good" : "bad",
    },
    {
      label: "순자산 변동",
      value: `${nwDelta >= 0 ? "+" : ""}${formatMoney(Math.round(nwDelta))}`,
      tone: nwDelta >= 0 ? "good" : "bad",
    },
    { label: "현재 순자산", value: formatMoney(Math.round(nw)), tone: "neutral" },
    { label: "현재 순위", value: `${rank}위 / ${game.companies.length}`, tone: rank <= 3 ? "good" : "neutral" },
    {
      label: "자사 주가",
      value: stock ? `${stock.price.toFixed(0)} (${stockChange >= 0 ? "+" : ""}${stockChange.toFixed(1)}%)` : "—",
      tone: stockChange >= 0 ? "good" : "bad",
    },
  ];
  if (r.quitCount > 0) {
    rows.push({ label: "퇴사 직원", value: `${r.quitCount}명`, tone: "bad" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-sm animate-popin overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with banner */}
        <div className="relative overflow-hidden">
          <img src={BANNER_IMGS.report} alt="" className="w-full object-cover" style={{ maxHeight: 110 }} />
          <div className="absolute inset-0 flex items-end bg-black/30 px-5 pb-3">
            <div className="text-white drop-shadow">
              <div className="text-xs opacity-80">{game.turn}분기 실적 보고</div>
              <div className="text-base font-black">{player.name}</div>
            </div>
            <div className={`ml-auto text-sm font-bold drop-shadow ${r.profit >= 0 ? "text-emerald-200" : "text-red-200"}`}>
              {r.profit >= 0 ? "▲" : "▼"} {formatMoney(Math.abs(r.profit))}
            </div>
          </div>
        </div>

        {/* Executive's quarterly briefing & advice */}
        <ExecutiveBriefing game={game} />

        {campaign?.enabled && campaign.lastMessage && (
          <div className="mx-5 mb-3 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold leading-5 text-brand-700">
            캠페인: {campaign.lastMessage}
          </div>
        )}

        {/* Results grid */}
        <div className="divide-y divide-slate-100 px-5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-slate-500">{row.label}</span>
              <span
                className={`text-sm font-bold ${
                  row.tone === "good"
                    ? "text-emerald-600"
                    : row.tone === "bad"
                    ? "text-red-500"
                    : "text-slate-800"
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 pt-2">
          <button
            className="btn-primary w-full"
            onClick={onClose}
          >
            확인 {summary.events.length > 0 ? `(뉴스 ${summary.events.length}건 ▶)` : "▶"}
          </button>
        </div>
      </div>
    </div>
  );
}

const TONE_STYLE: Record<NewsItem["tone"], { ring: string; chip: string; label: string }> = {
  positive: { ring: "ring-bull/40", chip: "bg-bull/10 text-bull", label: "호재" },
  negative: { ring: "ring-bear/40", chip: "bg-bear/10 text-bear", label: "악재" },
  neutral: { ring: "ring-slate-200", chip: "bg-slate-100 text-slate-500", label: "중립" },
};

function EventPopup({ events, onClose }: { events: NewsItem[]; onClose: () => void }) {
  const tone: "positive" | "negative" | "neutral" = events.some((e) => e.tone === "positive")
    ? "positive"
    : events.some((e) => e.tone === "negative")
    ? "negative"
    : "neutral";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-md animate-popin overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner header */}
        <div className="relative overflow-hidden">
          <img src={BANNER_IMGS[tone]} alt="" className="w-full object-cover" style={{ maxHeight: 100 }} />
          <div className="absolute inset-0 flex items-end bg-black/25 px-4 pb-2.5">
            <h2 className="text-base font-black text-white drop-shadow">
              이번 분기 속보 {events.length > 1 ? `(${events.length})` : ""}
            </h2>
          </div>
        </div>
        <div className="p-5">
        <div className="max-h-[55vh] space-y-2.5 overflow-y-auto scroll-thin">
          {events.map((ev) => {
            const tone = TONE_STYLE[ev.tone];
            return (
              <div key={ev.id} className={`rounded-xl bg-white p-3 ring-1 ${tone.ring}`}>
                <div className="flex items-start gap-2.5">
                  {ev.portrait ? (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-4xl shadow-inner">
                      {ev.portrait}
                    </span>
                  ) : (
                    <span className="text-2xl leading-none">{ev.emoji}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-800">{ev.title}</span>
                      <span className={`pill text-xs ${tone.chip}`}>{tone.label}</span>
                      <span className="pill bg-slate-100 text-xs text-slate-500">
                        {LAYER_LABELS[ev.layer]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-slate-600">{ev.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn-primary mt-4 w-full" onClick={onClose}>
          확인하고 계속 ▶
        </button>
        </div>
      </div>
    </div>
  );
}

function GameOver({ game, onRestart }: { game: ReturnType<typeof useGameStore.getState>["game"] & object; onRestart: () => void }) {
  if (!game) return null;
  const board = rankings(game);
  const rank = board.findIndex((e) => e.companyId === game.playerCompanyId) + 1;
  const won = rank === 1;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-md animate-popin p-6 text-center">
        <img src={won ? RESULT_ICONS.win : RESULT_ICONS.end} alt={won ? "우승" : "게임 종료"} className="mx-auto h-40 w-40 object-contain" />
        <h2 className="mt-3 text-2xl font-black text-slate-800">
          {won ? "축하합니다! 1위 달성!" : "게임 종료"}
        </h2>
        <p className="mt-1 text-slate-500">{game.maxTurns}분기 경영 결과, {rank}위로 마쳤어요.</p>
        <div className="mt-4 space-y-1.5 text-left">
          {board.slice(0, 5).map((e, i) => (
            <div
              key={e.companyId}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                e.isPlayer ? "bg-brand-50 font-bold" : "bg-slate-50"
              }`}
            >
              <span>{["🥇", "🥈", "🥉"][i] ?? `${i + 1}`} {e.name}</span>
              <span className="text-slate-700">{formatMoney(e.netWorth)}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary mt-5 w-full" onClick={onRestart}>
          새 게임 하기
        </button>
      </div>
    </div>
  );
}
