"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LearningShell } from "@/components/learning/LearningShell";
import { MissionList } from "@/components/learning/MissionList";
import { CompetencyProgress } from "@/components/learning/CompetencyProgress";
import { MISSIONS_BY_LEVEL } from "@/lib/data/learning/chapters";
import { LEVEL_CONFIGS } from "@/lib/engine";
import type { Level } from "@/lib/engine";
import { useLearningStore } from "@/store/learningStore";

const LEVELS: Level[] = [
  "elementary_low",
  "elementary_mid",
  "elementary_high",
  "middle",
  "high",
  "adult",
];

const LEVEL_LABELS: Record<Level, string> = {
  elementary_low: "초등 1~2",
  elementary_mid: "초등 3~4",
  elementary_high: "초등 5~6",
  middle: "중학생",
  high: "고등학생",
  adult: "성인",
};

export default function LearnPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<Level>("elementary_low");
  const profile = useLearningStore((state) => state.profile);
  const load = useLearningStore((state) => state.load);
  const createProfile = useLearningStore((state) => state.createProfile);
  const rejectRecommendedMode = useLearningStore((state) => state.rejectRecommendedMode);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <LearningShell>
      <button onClick={() => router.push("/")} className="btn-ghost mb-4">
        홈으로
      </button>

      <section className="rounded-2xl bg-white p-5 text-slate-900 ring-1 ring-slate-200">
        <div className="text-sm font-bold text-brand-600">6단계 학습 미션</div>
        <h1 className="mt-1 text-3xl font-black">개별 학습 캠페인</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          수준을 고르고 짧은 미션을 하나씩 풀며 경영과 투자 개념을 단계적으로 배워요.
        </p>
      </section>

      {!profile ? (
        <section className="mt-4 rounded-2xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <label className="text-sm font-bold text-slate-300">별명</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={12}
              placeholder="비워도 괜찮아요"
              className="min-h-11 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:border-brand-500"
            />
            <button onClick={() => createProfile(name)} className="btn-primary min-h-11 px-6">
              시작하기
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="mt-4 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <div className="text-sm text-slate-400">학습자</div>
            <div className="text-lg font-black">{profile.displayName || "이름 없는 학습자"}</div>
          </section>
          <CompetencyProgress profile={profile} onRejectRecommendation={rejectRecommendedMode} />
          <section className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {LEVELS.map((level) => {
              const active = selectedLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`rounded-xl px-3 py-3 text-left text-sm font-bold ring-1 transition ${
                    active
                      ? "bg-brand-600 text-white ring-brand-300"
                      : "bg-slate-900 text-slate-300 ring-slate-800 hover:bg-slate-800"
                  }`}
                >
                  <div>{LEVEL_LABELS[level]}</div>
                  <div className="mt-1 text-xs font-normal opacity-70">{LEVEL_CONFIGS[level].description}</div>
                </button>
              );
            })}
          </section>
          <section className="mt-4">
            <MissionList missions={MISSIONS_BY_LEVEL[selectedLevel]} profile={profile} />
          </section>
        </>
      )}
    </LearningShell>
  );
}
