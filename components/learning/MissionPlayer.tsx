"use client";

import type { MissionAttempt, MissionResult } from "@/lib/learning/types";

export function MissionPlayer({
  attempt,
  result,
  feedback,
  onChoose,
  onRetry,
}: {
  attempt: MissionAttempt;
  result: MissionResult | null;
  feedback: string | null;
  onChoose: (optionId: string) => void;
  onRetry: () => void;
}) {
  const turn = attempt.mission.turns[attempt.turnIndex];
  const current = Math.min(attempt.turnIndex + 1, attempt.mission.turns.length);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-2xl bg-white p-5 text-slate-900 ring-1 ring-slate-200">
        <div className="text-sm font-bold text-brand-600">{attempt.mission.concept}</div>
        <h1 className="mt-1 text-2xl font-black">{attempt.mission.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{attempt.mission.goal}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-500"
            style={{ width: `${(attempt.turnIndex / attempt.mission.turns.length) * 100}%` }}
          />
        </div>
      </div>

      {result ? (
        <div className="rounded-2xl bg-white p-6 text-center text-slate-900 ring-1 ring-slate-200">
          <div className="text-5xl">{result.success ? "🌟" : "🔁"}</div>
          <h2 className="mt-3 text-2xl font-black">{result.success ? "미션 성공" : "다시 도전"}</h2>
          <div className="mt-2 text-2xl text-amber-400">{"★".repeat(result.stars)}{"☆".repeat(3 - result.stars)}</div>
          <p className="mt-3 text-sm text-slate-600">{result.message}</p>
          {feedback && <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{feedback}</p>}
          <button onClick={onRetry} className="btn-primary mt-5 px-6 py-3">
            다시 해 보기
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-5 text-slate-900 ring-1 ring-slate-200">
          <div className="text-sm font-bold text-slate-400">
            {current} / {attempt.mission.turns.length}
          </div>
          <h2 className="mt-1 text-xl font-black">{turn.title}</h2>
          <p className="mt-2 text-base leading-7 text-slate-700">{turn.body}</p>
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">힌트: {turn.hint}</p>
          {feedback && <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">{feedback}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {turn.options.map((option) => (
              <button
                key={option.id}
                onClick={() => onChoose(option.id)}
                className="rounded-xl bg-slate-900 px-4 py-4 text-left font-bold text-white transition hover:bg-brand-700"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
