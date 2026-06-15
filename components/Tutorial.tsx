"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface TutorialStep {
  targetId?: string;      // DOM element id to spotlight (optional)
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right";
  action?: () => void;    // optional: do something before showing this step
}

const STEPS: TutorialStep[] = [
  {
    title: "🎮 유니콘 시티에 오신 것을 환영합니다!",
    body: "여기서 당신의 회사를 경영하고 경쟁사를 이기세요. 가이드를 따라 기본 기능을 익혀봅시다.",
  },
  {
    targetId: "btn-next-turn",
    title: "📅 다음 분기 진행",
    body: "이 버튼을 누르면 한 분기(3개월)가 지납니다. 매 분기마다 생산·판매·비용이 자동으로 계산됩니다. 전략을 세운 후 눌러보세요!",
    placement: "bottom",
  },
  {
    targetId: "tab-company",
    title: "🏙️ 회사 탭",
    body: "회사 탭에서 상품 라인업을 설정하고 판매 가격을 결정하세요. R&D에 투자할수록 더 높은 가격을 책정할 수 있습니다!",
    placement: "bottom",
  },
  {
    targetId: "tab-invest",
    title: "📈 투자 탭",
    body: "여유 자금으로 주식과 자산에 투자하세요. 회사 경영 수익 외에도 투자 수익을 올릴 수 있습니다.",
    placement: "bottom",
  },
  {
    targetId: "tab-talent",
    title: "👔 인재 탭",
    body: "우수한 인재를 채용하면 마케팅, 생산 효율, R&D 능력이 향상됩니다. 경쟁사 인재를 스카우트할 수도 있어요!",
    placement: "bottom",
  },
  {
    targetId: "tab-rank",
    title: "🏆 순위 탭",
    body: "경쟁사와 순자산을 비교하세요. 100분기 안에 1위를 차지하는 것이 목표입니다!",
    placement: "bottom",
  },
  {
    title: "🚀 준비 완료!",
    body: "이제 게임을 시작할 준비가 되었습니다. 가격 전략을 잘 세우고 공장을 늘려 생산량을 키워보세요. 행운을 빕니다!",
  },
];

interface Rect { top: number; left: number; width: number; height: number; }

export function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];

  const measureTarget = () => {
    if (!current.targetId) {
      setTargetRect(null);
      return;
    }
    const el = document.getElementById(current.targetId);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    const PAD = 6;
    setTargetRect({
      top: r.top - PAD + window.scrollY,
      left: r.left - PAD + window.scrollX,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    });
    // Scroll target into view
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useLayoutEffect(() => {
    measureTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    const onResize = () => measureTarget();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const goNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onClose();
  };
  const goPrev = () => { if (step > 0) setStep(step - 1); };

  // Position of the tooltip card
  const getCardStyle = (): React.CSSProperties => {
    if (!targetRect) return {};
    const placement = current.placement ?? "bottom";
    const vw = window.innerWidth;
    const margin = 12;

    if (placement === "bottom") {
      const left = Math.min(Math.max(margin, targetRect.left), vw - 320 - margin);
      return { position: "fixed", top: targetRect.top + targetRect.height + margin, left };
    }
    if (placement === "top") {
      const left = Math.min(Math.max(margin, targetRect.left), vw - 320 - margin);
      return { position: "fixed", top: targetRect.top - 180 - margin, left };
    }
    return {};
  };

  const PAD = 6;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50" style={{ pointerEvents: "none" }}>
      {/* Dark overlay with spotlight cutout */}
      {targetRect ? (
        <>
          {/* Top */}
          <div
            className="absolute inset-x-0 top-0 bg-black/60"
            style={{ height: targetRect.top - window.scrollY, pointerEvents: "auto" }}
          />
          {/* Bottom */}
          <div
            className="absolute inset-x-0 bottom-0 bg-black/60"
            style={{ top: targetRect.top - window.scrollY + targetRect.height, pointerEvents: "auto" }}
          />
          {/* Left */}
          <div
            className="absolute bg-black/60"
            style={{
              top: targetRect.top - window.scrollY,
              left: 0,
              width: targetRect.left - window.scrollX,
              height: targetRect.height,
              pointerEvents: "auto",
            }}
          />
          {/* Right */}
          <div
            className="absolute bg-black/60"
            style={{
              top: targetRect.top - window.scrollY,
              left: targetRect.left - window.scrollX + targetRect.width,
              right: 0,
              height: targetRect.height,
              pointerEvents: "auto",
            }}
          />
          {/* Highlight ring */}
          <div
            className="absolute rounded-xl ring-2 ring-white/80 ring-offset-0 shadow-[0_0_0_4px_rgba(99,102,241,0.5)]"
            style={{
              top: targetRect.top - window.scrollY - PAD,
              left: targetRect.left - window.scrollX - PAD,
              width: targetRect.width + PAD * 2,
              height: targetRect.height + PAD * 2,
            }}
          />
        </>
      ) : (
        /* No target: full dark overlay */
        <div className="absolute inset-0 bg-black/60" style={{ pointerEvents: "auto" }} />
      )}

      {/* Tooltip card */}
      <div
        className="pointer-events-auto animate-popin"
        style={
          targetRect
            ? getCardStyle()
            : {
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }
        }
      >
        <div className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white shadow-2xl">
          {/* Progress bar */}
          <div className="h-1 rounded-t-2xl overflow-hidden bg-slate-200">
            <div
              className="h-full bg-brand-500 transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="p-5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">
                {step + 1} / {STEPS.length}
              </span>
              <button
                onClick={onClose}
                className="rounded p-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                건너뛰기 ✕
              </button>
            </div>

            <h3 className="mt-2 text-base font-bold text-slate-800">{current.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{current.body}</p>

            <div className="mt-4 flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={goPrev}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  ◀ 이전
                </button>
              )}
              <button
                onClick={goNext}
                className="ml-auto rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
              >
                {step < STEPS.length - 1 ? "다음 ▶" : "시작하기 🚀"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
