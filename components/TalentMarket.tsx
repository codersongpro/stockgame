"use client";

import { useGameStore } from "@/store/gameStore";
import { ROLE_LABELS } from "@/lib/engine";
import type { Character, CharacterRole, Company, GameState } from "@/lib/engine";
import { formatMoney } from "@/lib/format";
import { ROLE_IMG } from "@/lib/assetMap";

/** Role-based pixel-art portrait, falling back to the character's emoji. */
function Avatar({ role, emoji }: { role?: CharacterRole; emoji: string }) {
  const img = role ? ROLE_IMG[role] : undefined;
  if (img) {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
        <img src={img} alt="" className="h-full w-full object-contain object-bottom" />
      </span>
    );
  }
  return <span className="text-3xl">{emoji}</span>;
}

const RARITY: Record<string, { label: string; cls: string }> = {
  common: { label: "일반", cls: "bg-slate-100 text-slate-600" },
  rare: { label: "레어", cls: "bg-sky-100 text-sky-700" },
  epic: { label: "에픽", cls: "bg-violet-100 text-violet-700" },
  legendary: { label: "전설", cls: "bg-amber-100 text-amber-700" },
};

export function TalentMarket({ game, company }: { game: GameState; company: Company }) {
  const hire = useGameStore((s) => s.hire);
  const fire = useGameStore((s) => s.fire);

  return (
    <div className="space-y-4">
      {/* Hired team */}
      <div className="card p-4">
        <h3 className="mb-3 text-base font-bold text-slate-800">👔 우리 회사 임원진</h3>
        {company.hired.length === 0 ? (
          <p className="text-sm text-slate-400">아직 영입한 인재가 없습니다. 인재시장에서 영입하세요!</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {company.hired.map((ch) => (
              <div key={ch.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <Avatar role={ch.role ?? ch.preferredRole} emoji={ch.avatar} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <b className="truncate text-slate-800">{ch.name}</b>
                    <span className="pill bg-brand-100 text-brand-700">
                      {ch.role ? ROLE_LABELS[ch.role] : "미배치"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {ch.traitName} · 충성도 {Math.round(ch.loyalty ?? 0)}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  연봉<br />
                  <b className="text-slate-600">{formatMoney(ch.salary)}</b>
                </div>
                <button
                  className="btn-ghost shrink-0 !px-2.5 !py-1.5 text-xs !text-bear"
                  onClick={() => {
                    if (window.confirm(`${ch.name}을(를) 해고할까요?\n퇴직금 ${formatMoney(ch.salary)}이 지출되고 사기·평판이 소폭 하락합니다.`))
                      fire(ch.id);
                  }}
                >
                  해고
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Talent pool */}
      <div className="card p-4">
        <h3 className="mb-3 text-base font-bold text-slate-800">🧑‍💼 인재시장</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {game.talentPool.map((ch) => (
            <TalentCard
              key={ch.id}
              ch={ch}
              affordable={company.cash >= ch.salary}
              detailed={game.config.characterDepth !== "simple"}
              onHire={() => hire(ch.id)}
            />
          ))}
        </div>
        {game.talentPool.length === 0 && (
          <p className="text-sm text-slate-400">지금은 영입 가능한 인재가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function TalentCard({
  ch,
  affordable,
  detailed,
  onHire,
}: {
  ch: Character;
  affordable: boolean;
  detailed: boolean;
  onHire: () => void;
}) {
  const r = RARITY[ch.rarity];
  const top = topStats(ch);
  return (
    <div className="rounded-xl p-3 ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <Avatar role={ch.preferredRole} emoji={ch.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <b className="truncate text-slate-800">{ch.name}</b>
            <span className={`pill ${r.cls}`}>{r.label}</span>
          </div>
          <div className="text-xs text-slate-500">{ROLE_LABELS[ch.preferredRole]}</div>
        </div>
      </div>
      {detailed && (
        <div className="mt-2 flex flex-wrap gap-1">
          {top.map(([k, v]) => (
            <span key={k} className="pill bg-slate-100 text-slate-600">
              {STAT_LABEL[k]} {v}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 text-xs text-amber-700">✨ {ch.traitName}: {ch.traitDesc}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">영입비 {formatMoney(ch.salary)}</span>
        <button className="btn-primary !px-3 !py-1.5 text-xs" disabled={!affordable} onClick={onHire}>
          영입
        </button>
      </div>
    </div>
  );
}

const STAT_LABEL: Record<string, string> = {
  management: "경영",
  tech: "기술",
  creativity: "창의",
  finance: "재무",
  leadership: "리더십",
  marketing: "마케팅",
};

function topStats(ch: Character): [string, number][] {
  return Object.entries(ch.stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}
