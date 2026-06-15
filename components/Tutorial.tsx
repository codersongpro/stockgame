"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface TutorialStep {
  targetId?: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right";
}

const STEPS: TutorialStep[] = [
  {
    title: "🎮 유니콘 시티에 오신 것을 환영합니다!",
    body: "이 게임에서 당신의 회사를 경영하고 100분기 안에 1위를 차지하세요. 간단한 안내를 따라가볼까요? (끝까지 진행해야 시작할 수 있어요!)",
  },
  {
    targetId: "btn-next-turn",
    title: "📅 분기 진행 버튼",
    body: "이 버튼을 클릭하면 한 분기(3개월)가 지나갑니다. 생산·판매·비용이 자동 계산됩니다. 먼저 상품과 가격을 설정한 후 눌러보세요!",
    placement: "bottom",
  },
  {
    targetId: "tab-company",
    title: "🏙️ 회사 탭 — 핵심!",
    body: "상품 라인업 탭에서 어떤 제품을 판매할지, 가격은 얼마로 할지 결정하세요. R&D 투자를 많이 할수록 더 비싼 가격을 받을 수 있어요.",
    placement: "bottom",
  },
  {
    targetId: "tab-invest",
    title: "📈 투자 탭",
    body: "회사 경영 외에도 주식·부동산·금·암호화폐에 투자해 추가 수익을 올리세요. 다각화가 위기를 이겨내는 열쇠입니다!",
    placement: "bottom",
  },
  {
    targetId: "tab-talent",
    title: "👔 인재 탭",
    body: "우수한 임원을 영입하면 생산 효율, R&D, 마케팅이 크게 향상됩니다. 경쟁사 인재 스카우트도 가능해요!",
    placement: "bottom",
  },
  {
    targetId: "tab-rank",
    title: "🏆 순위 탭",
    body: "경쟁사들과 순자산을 비교하세요. 순위가 오를수록 주가도 오릅니다. 100분기 종료 시 1위가 되면 우승!",
    placement: "bottom",
  },
  {
    title: "🚀 준비 완료! 게임을 시작하세요",
    body: "핵심 전략: 처음엔 기본 상품으로 현금을 쌓고, R&D에 투자해 품질을 올린 뒤 고급 상품으로 전환하세요. 재고가 쌓이면 판매가를 낮추는 것도 잊지 마세요!",
  },
];

// Simplified tutorial for elementary_low
const SIMPLE_STEPS: TutorialStep[] = [
  {
    title: "👋 안녕하세요, 사장님!",
    body: "이 게임은 내 회사를 키워서 1등이 되는 게임이에요! 어떻게 하는지 함께 알아볼까요? (끝까지 봐야 시작할 수 있어요!)",
  },
  {
    targetId: "btn-next-turn",
    title: "⏩ 다음 분기 버튼",
    body: "이 버튼을 누르면 시간이 3개월 앞으로 가요. 그 동안 물건을 팔고 돈을 버는 거예요! 눌러보세요!",
    placement: "bottom",
  },
  {
    targetId: "tab-company",
    title: "🏙️ 내 회사 탭",
    body: "여기서 우리 회사를 관리해요. 어떤 물건을 얼마에 팔지 정하고, 광고도 하고, 직원도 돌볼 수 있어요!",
    placement: "bottom",
  },
  {
    targetId: "tab-invest",
    title: "💰 주식·예금 탭",
    body: "남는 돈을 예금에 넣으면 이자가 생겨요! 돈을 더 불리는 방법이에요.",
    placement: "bottom",
  },
  {
    targetId: "tab-talent",
    title: "👨‍💼 직원 탭",
    body: "좋은 직원을 뽑으면 회사가 더 잘 돌아가요. 능력 있는 사람을 뽑아보세요!",
    placement: "bottom",
  },
  {
    targetId: "tab-rank",
    title: "🏆 순위 탭",
    body: "내가 몇 등인지 확인할 수 있어요. 열심히 해서 1등이 되어봐요!",
    placement: "bottom",
  },
  {
    title: "🚀 시작해봐요!",
    body: "처음엔 물건을 만들어 팔면서 돈을 모아요. 돈이 생기면 광고도 하고 직원도 돌봐주세요. 열심히 하면 1등이 될 수 있어요! 🏆",
  },
];

interface Rect { top: number; left: number; width: number; height: number; }

export function Tutorial({ onClose, level }: { onClose: () => void; level?: string }) {
  const steps = level === "elementary_low" ? SIMPLE_STEPS : STEPS;
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [pulse, setPulse] = useState(false);

  const current = steps[step];
  const PAD = 8;

  const measureTarget = () => {
    if (!current.targetId) { setTargetRect(null); return; }
    const el = document.getElementById(current.targetId);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    setTargetRect({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Trigger pulse animation
    setPulse(false);
    setTimeout(() => setPulse(true), 50);
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
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };
  const goPrev = () => { if (step > 0) setStep(step - 1); };

  const isLast = step === steps.length - 1;

  // Position tooltip card relative to the target
  const getCardStyle = (): React.CSSProperties => {
    const MARGIN = 14;
    const CARD_W = 300;
    const CARD_H = 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!targetRect) {
      return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
    }

    const placement = current.placement ?? "bottom";
    let top: number, left: number;

    if (placement === "bottom") {
      top = Math.min(targetRect.top + targetRect.height + MARGIN, vh - CARD_H - MARGIN);
      left = Math.min(Math.max(MARGIN, targetRect.left), vw - CARD_W - MARGIN);
    } else if (placement === "top") {
      top = Math.max(MARGIN, targetRect.top - CARD_H - MARGIN);
      left = Math.min(Math.max(MARGIN, targetRect.left), vw - CARD_W - MARGIN);
    } else {
      top = Math.max(MARGIN, targetRect.top);
      left = Math.max(MARGIN, targetRect.left - CARD_W - MARGIN);
    }

    return { position: "fixed", top, left };
  };

  // Arrow pointing from card toward target
  const getArrowStyle = (): React.CSSProperties | null => {
    if (!targetRect || !current.placement) return null;
    if (current.placement === "bottom") {
      return { position: "absolute", top: -10, left: 18, width: 0, height: 0,
        borderLeft: "10px solid transparent", borderRight: "10px solid transparent",
        borderBottom: "10px solid white" };
    }
    if (current.placement === "top") {
      return { position: "absolute", bottom: -10, left: 18, width: 0, height: 0,
        borderLeft: "10px solid transparent", borderRight: "10px solid transparent",
        borderTop: "10px solid white" };
    }
    return null;
  };

  const arrowStyle = getArrowStyle();

  return (
    <div className="fixed inset-0 z-[200]" style={{ pointerEvents: "none" }}>
      {/* Overlay sections creating spotlight effect */}
      {targetRect ? (
        <>
          <div className="absolute inset-x-0 top-0 bg-black/70" style={{ height: targetRect.top, pointerEvents: "auto" }} />
          <div className="absolute inset-x-0 bottom-0 bg-black/70" style={{ top: targetRect.top + targetRect.height, pointerEvents: "auto" }} />
          <div className="absolute bg-black/70" style={{ top: targetRect.top, left: 0, width: targetRect.left, height: targetRect.height, pointerEvents: "auto" }} />
          <div className="absolute bg-black/70" style={{ top: targetRect.top, left: targetRect.left + targetRect.width, right: 0, height: targetRect.height, pointerEvents: "auto" }} />

          {/* Spotlight border ring */}
          <div
            className="absolute rounded-xl"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: "0 0 0 3px rgba(99,102,241,0.9), 0 0 0 6px rgba(99,102,241,0.3)",
              transition: "all 0.3s ease",
            }}
          />

          {/* Pulsing ring animation (iorad-style) */}
          {pulse && (
            <div
              className="absolute rounded-xl animate-ping"
              style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                border: "2px solid rgba(99,102,241,0.6)",
                animationDuration: "1.2s",
                animationIterationCount: 3,
              }}
            />
          )}

          {/* Cursor pointer icon near the target */}
          <div
            className="absolute text-2xl"
            style={{
              top: targetRect.top + targetRect.height - 8,
              left: targetRect.left + targetRect.width * 0.3,
              animation: "bounce 1s infinite",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
            }}
          >
            👆
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70" style={{ pointerEvents: "auto" }} />
      )}

      {/* Tooltip card */}
      <div
        className="pointer-events-auto w-[300px] max-w-[calc(100vw-2rem)]"
        style={getCardStyle()}
      >
        <div className="relative rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          {arrowStyle && <div style={arrowStyle} />}

          {/* Progress bar at top */}
          <div className="h-1.5 overflow-hidden rounded-t-2xl bg-slate-200">
            <div
              className="h-full bg-brand-500 transition-all duration-400"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-5">
            {/* Step dots */}
            <div className="mb-3 flex items-center gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-brand-500" : i < step ? "w-1.5 bg-brand-300" : "w-1.5 bg-slate-200"
                  }`}
                />
              ))}
              <span className="ml-auto text-xs text-slate-400">{step + 1}/{steps.length}</span>
            </div>

            <h3 className="text-sm font-bold text-slate-800 leading-snug">{current.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{current.body}</p>

            {/* Navigation */}
            <div className="mt-4 flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={goPrev}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                >
                  ◀ 이전
                </button>
              )}
              <button
                onClick={goNext}
                className="ml-auto rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-700 active:scale-95 transition-transform"
              >
                {isLast ? "시작하기 🚀" : "다음 ▶"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
