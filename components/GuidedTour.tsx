"use client";

import { useEffect, useLayoutEffect, useState } from "react";

export interface TourStep {
  /** CSS selector of the element to spotlight. Omit for a centered step. */
  target?: string;
  title: string;
  text: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Lightweight iorad-style product tour: dims the screen, spotlights the target
 * element for each step, and shows a tooltip with Back / Next / Skip. Targets
 * are found by `[data-tour="..."]` selectors so steps stay decoupled from layout.
 */
export function GuidedTour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = steps[i];

  const measure = () => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    const r = el.getBoundingClientRect();
    const pad = 6;
    setRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => {
    const on = () => measure();
    window.addEventListener("resize", on);
    window.addEventListener("scroll", on, true);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("scroll", on, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  if (!step) return null;

  const last = i === steps.length - 1;
  const next = () => (last ? onClose() : setI((v) => v + 1));
  const back = () => setI((v) => Math.max(0, v - 1));

  // Tooltip placement: below the target if there's room, else above; centered
  // on screen when there's no target.
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const below = rect ? rect.top + rect.height < vh - 220 : true;
  const tooltipStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: below ? rect.top + rect.height + 12 : undefined,
        bottom: below ? undefined : vh - rect.top + 12,
        left: Math.max(12, Math.min(rect.left, (typeof window !== "undefined" ? window.innerWidth : 400) - 332)),
        width: 320,
      }
    : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 320 };

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Dim + spotlight hole via a huge box-shadow around the target rect. */}
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-xl ring-2 ring-brand-300 transition-all"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(15,23,42,0.72)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-slate-900/70" />
      )}

      {/* Tooltip card */}
      <div style={tooltipStyle} className="card animate-popin p-4 shadow-2xl">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700">
            {i + 1} / {steps.length}
          </span>
          <h3 className="text-sm font-black text-slate-800">{step.title}</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{step.text}</p>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={onClose} className="text-xs font-semibold text-slate-400 hover:text-slate-600">
            건너뛰기
          </button>
          <div className="flex gap-2">
            {i > 0 && (
              <button onClick={back} className="btn-ghost !px-3 !py-1.5 text-sm">
                이전
              </button>
            )}
            <button onClick={next} className="btn-primary !px-4 !py-1.5 text-sm">
              {last ? "시작하기 🚀" : "다음 ▶"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The default play-screen tour. Targets reference [data-tour="..."] attributes. */
export const PLAY_TOUR_STEPS: TourStep[] = [
  {
    title: "유니콘 시티에 오신 걸 환영해요! 👋",
    text: "회사를 키우고 투자해서 100분기 뒤 순자산 1위에 도전해요. 화면을 짚어가며 짧게 안내할게요.",
  },
  {
    target: '[data-tour="tab-company"]',
    title: "🏢 회사 탭",
    text: "여기서 상품마다 가격을 정하고, 마케팅·연구개발·복지 같은 경영 활동을 선택해요.",
  },
  {
    target: '[data-tour="tab-invest"]',
    title: "📈 투자 탭",
    text: "주식과 자산을 사고팔아요. 성장주는 크게 출렁이고 배당주는 안정적이에요. 분산투자가 안전해요.",
  },
  {
    target: '[data-tour="tab-news"]',
    title: "📰 뉴스 탭",
    text: "분기마다 호재·악재 뉴스가 나오고, 그에 따라 주가가 움직여요.",
  },
  {
    target: '[data-tour="tab-rank"]',
    title: "🏆 순위 탭",
    text: "경쟁사들과의 순자산 순위를 확인해요. 멈춰 있으면 따라잡히니 꾸준히 개선하세요!",
  },
  {
    target: '[data-tour="help"]',
    title: "❓ 도움말",
    text: "용어가 헷갈리면 여기서 전체 메뉴얼과 용어 풀이를 언제든 볼 수 있어요.",
  },
  {
    target: '[data-tour="next"]',
    title: "▶ 다음 분기",
    text: "준비되면 이 버튼으로 한 분기를 진행해요. 실적과 뉴스를 확인하고 다시 결정을 다듬으면 돼요. 행운을 빌어요!",
  },
];
