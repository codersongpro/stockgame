import type { LearningProfile, SupportMode } from "@/lib/learning/types";
import { recommendSupportMode } from "@/lib/learning/adaptation";

const MODE_LABEL: Record<SupportMode, string> = {
  support: "도움 모드 추천",
  default: "기본 모드",
  challenge: "도전 모드 추천",
};

export function CompetencyProgress({
  profile,
  onRejectRecommendation,
}: {
  profile: LearningProfile;
  onRejectRecommendation: (mode: SupportMode) => void;
}) {
  const concepts = Object.entries(profile.competencyByConcept)
    .sort((a, b) => b[1].mastery - a[1].mastery)
    .slice(0, 6);
  const recommendation = recommendSupportMode(profile);

  return (
    <section className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
        <div className="text-sm font-bold text-slate-300">개념별 숙련도</div>
        {concepts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">미션을 완료하면 개념별 기록이 쌓입니다.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {concepts.map(([concept, competency]) => (
              <div key={concept}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-white">{concept}</span>
                  <span className="text-slate-400">{Math.round(competency.mastery * 100)}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.round(competency.mastery * 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  시도 {competency.attempts}회 · 성공 {competency.successes}회 · 최고 별 {competency.bestStars}개
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 text-slate-900 ring-1 ring-slate-200">
        <div className="text-sm font-bold text-brand-600">{MODE_LABEL[recommendation.mode]}</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation.reason}</p>
        {recommendation.mode !== "default" && (
          <button
            onClick={() => onRejectRecommendation(recommendation.mode)}
            className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
          >
            지금은 안 할래요
          </button>
        )}
      </div>
    </section>
  );
}
