"use client";

import { getActiveCampaignMission, type GameState } from "@/lib/engine";

export function CampaignGoalCard({ game }: { game: GameState }) {
  const mission = getActiveCampaignMission(game);
  if (!mission || !game.campaign?.enabled) return null;

  const states = game.campaign.currentObjectiveState;
  const stars = game.campaign.bestStarsByMissionId[mission.id] ?? 0;
  const attempts = game.campaign.attemptsByMissionId[mission.id] ?? 0;

  return (
    <section className="card p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-brand-600">현재 캠페인 목표</div>
      <div className="mt-1 text-base font-black text-slate-800">{mission.title}</div>
      <p className="mt-2 text-sm leading-5 text-slate-600">{mission.summary}</p>

      <div className="mt-3 space-y-2">
        {mission.objectives.map((objective) => {
          const state = states.find((item) => item.objectiveId === objective.id);
          return (
            <div key={objective.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <div className="font-bold text-slate-700">{objective.label}</div>
              {state && (
                <div className={state.passed ? "mt-1 text-xs text-emerald-600" : "mt-1 text-xs text-amber-600"}>
                  현재 {state.current.toLocaleString()} / 목표 {state.target.toLocaleString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs leading-5 text-brand-700">
        {game.campaign.lastMessage ?? mission.hint}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>다음 분기 후 확인</span>
        <span>
          {attempts > 0 ? `${attempts}회 시도` : "첫 시도"} · {"★".repeat(stars)}
        </span>
      </div>
    </section>
  );
}
