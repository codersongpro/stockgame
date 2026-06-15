"use client";

import { useMemo } from "react";
import type { CharacterRole, GameState } from "@/lib/engine";
import { generateAdvice, type Advice } from "@/lib/advisor";
import { TALENT_IMGS, ROLE_IMG, SECRETARY_IMG, idToIndex } from "@/lib/assetMap";

const ROLE_KO: Record<CharacterRole, string> = {
  ceo: "대표이사(CEO)",
  cto: "기술이사(CTO)",
  cmo: "마케팅이사(CMO)",
  cfo: "재무이사(CFO)",
  coo: "운영이사(COO)",
  chro: "인사이사(CHRO)",
};

// Words each role cares about, used to bubble role-relevant advice to the top.
const ROLE_KEYWORDS: Record<CharacterRole, string[]> = {
  ceo: ["순위", "순자산", "전략", "1위", "선두"],
  cfo: ["현금", "부채", "이자", "대출", "투자", "자금", "자산", "금리"],
  cto: ["품질", "R&D", "연구", "기술", "신제품"],
  cmo: ["마케팅", "평판", "브랜드", "이미지", "수요"],
  coo: ["생산", "공장", "재고", "설비", "능력"],
  chro: ["사기", "복지", "직원", "인재", "이탈", "안전"],
};

// Pick the executive who delivers the briefing: leadership roles first, then by loyalty.
const ROLE_PRIORITY: CharacterRole[] = ["ceo", "coo", "cfo", "cmo", "cto", "chro"];

const TONE: Record<Advice["tone"], string> = {
  warn: "text-red-600",
  tip: "text-sky-700",
  good: "text-emerald-600",
};
const TONE_MARK: Record<Advice["tone"], string> = { warn: "⚠️", tip: "💡", good: "✅" };

export function ExecutiveBriefing({ game }: { game: GameState }) {
  const data = useMemo(() => {
    const player = game.companies.find((c) => c.id === game.playerCompanyId)!;
    const hired = player.hired ?? [];

    // Choose the briefing executive.
    const exec =
      [...hired].sort((a, b) => {
        const ra = ROLE_PRIORITY.indexOf((a.role ?? a.preferredRole) as CharacterRole);
        const rb = ROLE_PRIORITY.indexOf((b.role ?? b.preferredRole) as CharacterRole);
        if (ra !== rb) return ra - rb;
        return (b.loyalty ?? 0) - (a.loyalty ?? 0);
      })[0] ?? null;

    const role = (exec?.role ?? exec?.preferredRole) as CharacterRole | undefined;
    const kws = role ? ROLE_KEYWORDS[role] : [];

    // Re-rank advice so warnings stay first, then role-relevant items.
    const advice = [...generateAdvice(game)]
      .map((a, i) => ({
        a,
        score: (a.tone === "warn" ? 4 : a.tone === "good" ? 0 : 2) + (kws.some((k) => a.text.includes(k)) ? 1 : 0),
        i,
      }))
      .sort((x, y) => y.score - x.score || x.i - y.i)
      .slice(0, 3)
      .map((x) => x.a);

    const name = exec?.name ?? "비서";
    const roleLabel = role ? ROLE_KO[role] : "비서실";
    const portrait = exec ? TALENT_IMGS[idToIndex(exec.id, TALENT_IMGS.length)] : SECRETARY_IMG;
    const portraitFallback = role ? ROLE_IMG[role] ?? SECRETARY_IMG : SECRETARY_IMG;
    const hasWarn = advice.some((a) => a.tone === "warn");

    return { name, roleLabel, portrait, portraitFallback, advice, hasWarn };
  }, [game]);

  const { name, roleLabel, portrait, portraitFallback, advice, hasWarn } = data;

  return (
    <div
      className="flex gap-3 px-5 py-4"
      style={{ background: hasWarn ? "rgba(254,242,242,0.9)" : "rgba(240,249,255,0.9)" }}
    >
      <img
        src={portrait}
        alt={name}
        onError={(e) => {
          if (e.currentTarget.src.endsWith(portraitFallback)) return;
          e.currentTarget.src = portraitFallback;
        }}
        className="h-14 w-14 shrink-0 self-start rounded-full bg-white object-contain object-bottom ring-2 ring-white"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-black text-slate-800">{name}</span>
          <span className="text-xs font-semibold text-slate-500">{roleLabel}</span>
          <span className="ml-auto text-xs font-bold text-brand-500">분기 브리핑</span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          대표님, 이번 분기 회사 상황과 앞으로 할 일을 보고드립니다.
        </p>
        <ul className="mt-2 space-y-1.5">
          {advice.map((a, i) => (
            <li key={i} className={`flex gap-1.5 text-sm font-medium leading-snug ${TONE[a.tone]}`}>
              <span className="shrink-0">{TONE_MARK[a.tone]}</span>
              <span>{a.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
