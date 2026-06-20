"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HelpModal } from "@/components/HelpModal";
import { initAudio, playSfx } from "@/lib/audio";
import { LEVEL_CONFIGS } from "@/lib/engine";
import type { Level } from "@/lib/engine";
import { formatMoney } from "@/lib/format";
import { useGameStore } from "@/store/gameStore";

const SPLASH_IMG = "/assets/splash.png";

const LEVELS: Level[] = [
  "elementary_low",
  "elementary_mid",
  "elementary_high",
  "middle",
  "high",
  "adult",
];

const LEVEL_EMOJI: Record<Level, string> = {
  elementary_low: "🌱",
  elementary_mid: "🌿",
  elementary_high: "🌳",
  middle: "📈",
  high: "🏦",
  adult: "🏢",
};

const LEVEL_TAGS: Record<Level, string[]> = {
  elementary_low: ["짧은 목표", "쉬운 말", "2개 선택"],
  elementary_mid: ["예산", "수입과 지출", "간단한 이유"],
  elementary_high: ["매출과 비용", "재고", "선택 근거"],
  middle: ["금리", "기회비용", "전략"],
  high: ["현금과 부채", "시장 분석", "근거 기록"],
  adult: ["자본 배분", "복합 이벤트", "전체 기능"],
};

export default function Home() {
  const router = useRouter();
  const [level, setLevel] = useState<Level>("elementary_low");
  const [hasSave, setHasSave] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const loadSave = useGameStore((state) => state.loadSave);
  const checkSave = useGameStore((state) => state.hasSave);

  useEffect(() => {
    initAudio();
    setHasSave(checkSave());
  }, [checkSave]);

  const cfg = LEVEL_CONFIGS[level];

  const startSandbox = () => {
    playSfx("click");
    router.push(`/setup?level=${level}`);
  };

  const continueGame = () => {
    playSfx("click");
    if (loadSave()) router.push("/play");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="w-full bg-slate-950/90 py-1.5 text-center text-xs text-slate-400">
        제작 by <span className="font-semibold text-slate-300">Dustin</span>
      </div>

      <img
        src={SPLASH_IMG}
        alt="유니콘시티"
        className="w-full object-contain"
        style={{ maxHeight: "46vh" }}
      />

      <div className="mx-auto max-w-6xl px-4 pb-12">
        <section className="rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🏙️</span>
            <div>
              <div className="text-xl font-black">샌드박스 모드</div>
              <div className="text-sm text-slate-400">
                100분기 자유 경영 안에서 학습 안내를 함께 설정합니다.
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={startSandbox} className="btn-primary px-5 py-3">
              새 게임 시작
            </button>
            <button onClick={continueGame} disabled={!hasSave} className="btn-ghost px-5 py-3">
              이어서 하기
            </button>
            <button
              onClick={() => {
                playSfx("click");
                setShowHelp(true);
              }}
              className="btn-ghost px-5 py-3"
            >
              게임 방법
            </button>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            샌드박스 레벨 선택
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LEVELS.map((item) => {
              const itemCfg = LEVEL_CONFIGS[item];
              const active = level === item;
              return (
                <button
                  key={item}
                  onClick={() => {
                    setLevel(item);
                    playSfx("click");
                  }}
                  className={`rounded-2xl p-4 text-left ring-2 transition ${
                    active
                      ? "bg-brand-600 ring-brand-300"
                      : "bg-slate-900 ring-slate-800 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{LEVEL_EMOJI[item]}</span>
                    <span className="font-black">{itemCfg.label}</span>
                    {active && <span className="pill bg-white/20 text-white">선택됨</span>}
                  </div>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-slate-300">{itemCfg.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {LEVEL_TAGS[item].map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active ? "bg-white/15 text-white" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl">{LEVEL_EMOJI[level]}</span>
            <span className="font-bold text-slate-200">{cfg.label} 상세</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCell label="시작 자금" value={formatMoney(cfg.startingCash)} />
            <StatCell label="경쟁사" value={`${cfg.aiCount}개`} />
            <StatCell label="캠퍼스" value={`${cfg.mapSize}×${cfg.mapSize}`} />
            <StatCell label="선택 폭" value={`${cfg.maxChoices}개`} />
          </div>
        </section>
      </div>

      {showHelp && <HelpModal open initialTab="manual" onClose={() => setShowHelp(false)} />}
    </main>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800 px-3 py-2.5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-200">{value}</div>
    </div>
  );
}
