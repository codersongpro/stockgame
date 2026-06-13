"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LEVEL_CONFIGS } from "@/lib/engine";
import type { Level } from "@/lib/engine";
import { useGameStore } from "@/store/gameStore";
import { initAudio, playSfx } from "@/lib/audio";

const LEVELS: Level[] = ["elementary", "middle", "university"];
const LEVEL_EMOJI: Record<Level, string> = {
  elementary: "🧒",
  middle: "🧑‍🎓",
  university: "🎓",
};

export default function Home() {
  const router = useRouter();
  const [level, setLevel] = useState<Level>("middle");
  const [hasSave, setHasSave] = useState(false);
  const loadSave = useGameStore((s) => s.loadSave);
  const checkSave = useGameStore((s) => s.hasSave);

  useEffect(() => {
    initAudio();
    setHasSave(checkSave());
  }, [checkSave]);

  const startNew = () => {
    playSfx("click");
    router.push(`/setup?level=${level}`);
  };

  const continueGame = () => {
    playSfx("click");
    if (loadSave()) router.push("/play");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-4 py-12">
        <div className="animate-floaty text-7xl">🦄🏙️</div>
        <h1 className="mt-4 bg-gradient-to-r from-brand-300 to-pink-300 bg-clip-text text-center text-5xl font-black text-transparent">
          유니콘 시티
        </h1>
        <p className="mt-3 text-center text-lg text-slate-300">
          회사를 도시처럼 키우고, 주식·자산에 투자하며 <b>순자산 1위</b>에 도전하세요!
        </p>

        {/* Level selection */}
        <section className="mt-10 w-full">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            난이도(학년) 선택
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {LEVELS.map((lv) => {
              const cfg = LEVEL_CONFIGS[lv];
              const active = level === lv;
              return (
                <button
                  key={lv}
                  onClick={() => {
                    setLevel(lv);
                    playSfx("click");
                  }}
                  className={`rounded-2xl p-5 text-left ring-2 transition ${
                    active
                      ? "bg-brand-600 ring-brand-300"
                      : "bg-slate-800/60 ring-transparent hover:bg-slate-800"
                  }`}
                >
                  <div className="text-3xl">{LEVEL_EMOJI[lv]}</div>
                  <div className="mt-2 text-lg font-bold">{cfg.label}</div>
                  <div className="mt-1 text-xs leading-relaxed text-slate-300">
                    {cfg.description}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Actions */}
        <section className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={startNew} className="btn-primary px-8 py-4 text-lg">
            🚀 새 게임 시작
          </button>
          <button
            onClick={continueGame}
            disabled={!hasSave}
            className="btn-ghost px-8 py-4 text-lg !text-slate-800"
          >
            ⏯️ 이어서 하기
          </button>
        </section>

        <section className="mt-8 grid w-full gap-3 sm:grid-cols-2">
          <ModeCard
            emoji="🎮"
            title="싱글플레이"
            desc="AI 경쟁사들과 겨루며 회사를 키워요. 지금 바로 플레이!"
            ready
          />
          <ModeCard
            emoji="🏫"
            title="멀티플레이 (교실)"
            desc="여러 학생이 같은 시장에서 경쟁. 곧 추가됩니다."
          />
        </section>

        <footer className="mt-auto pt-10 text-center text-xs text-slate-500">
          교육용 시뮬레이션 · 실제 투자 조언이 아닙니다
        </footer>
      </div>
    </main>
  );
}

function ModeCard({
  emoji,
  title,
  desc,
  ready,
}: {
  emoji: string;
  title: string;
  desc: string;
  ready?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ring-1 ${
        ready ? "bg-slate-800/60 ring-brand-500/40" : "bg-slate-800/30 ring-slate-700"
      }`}
    >
      <div className="flex items-center gap-2 text-lg font-bold">
        <span className="text-2xl">{emoji}</span>
        {title}
        {ready ? (
          <span className="pill bg-bull/20 text-bull">플레이 가능</span>
        ) : (
          <span className="pill bg-slate-600/40 text-slate-300">준비 중</span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-300">{desc}</p>
    </div>
  );
}
