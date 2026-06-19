"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LearningShell } from "@/components/learning/LearningShell";
import { MissionPlayer } from "@/components/learning/MissionPlayer";
import { useLearningStore } from "@/store/learningStore";

export default function LearnMissionPage() {
  const router = useRouter();
  const params = useParams<{ missionId: string }>();
  const load = useLearningStore((state) => state.load);
  const beginMission = useLearningStore((state) => state.beginMission);
  const choose = useLearningStore((state) => state.choose);
  const retry = useLearningStore((state) => state.retry);
  const attempt = useLearningStore((state) => state.attempt);
  const result = useLearningStore((state) => state.result);
  const feedback = useLearningStore((state) => state.feedback);

  useEffect(() => {
    load();
    const ok = beginMission(params.missionId);
    if (!ok) router.replace("/learn");
  }, [beginMission, load, params.missionId, router]);

  if (!attempt) {
    return (
      <LearningShell>
        <div className="rounded-2xl bg-white p-5 text-center text-slate-900">불러오는 중...</div>
      </LearningShell>
    );
  }

  return (
    <LearningShell>
      <button onClick={() => router.push("/learn")} className="btn-ghost mb-4">
        미션 목록
      </button>
      <MissionPlayer
        attempt={attempt}
        result={result}
        feedback={feedback}
        onChoose={choose}
        onRetry={retry}
      />
    </LearningShell>
  );
}
