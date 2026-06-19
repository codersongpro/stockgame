"use client";

import { useRouter } from "next/navigation";
import { getMissionState } from "@/lib/learning/missionEngine";
import type { LearningMission, LearningProfile } from "@/lib/learning/types";

export function MissionList({
  missions,
  profile,
}: {
  missions: LearningMission[];
  profile: LearningProfile;
}) {
  const router = useRouter();

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {missions.map((mission, index) => {
        const state = getMissionState(profile, mission.id);
        const locked = state === "locked";
        const stars = profile.bestStarsByMissionId[mission.id] ?? 0;
        return (
          <button
            key={mission.id}
            disabled={locked}
            onClick={() => router.push(`/learn/mission/${mission.id}`)}
            className={`rounded-2xl p-4 text-left ring-1 transition ${
              locked
                ? "bg-slate-900 text-slate-600 ring-slate-800"
                : "bg-white text-slate-900 ring-slate-200 hover:-translate-y-0.5 hover:shadow-md"
            }`}
          >
            <div className="text-xs font-bold text-brand-500">미션 {index + 1}</div>
            <div className="mt-1 text-lg font-black">{mission.title}</div>
            <p className="mt-2 min-h-12 text-sm leading-5 opacity-80">{mission.summary}</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span>{locked ? "잠김" : state === "completed" ? "완료" : "시작 가능"}</span>
              <span aria-label={`별 ${stars}개`}>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
