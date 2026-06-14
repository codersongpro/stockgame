"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { INDUSTRIES } from "@/lib/data/industries";
import { COUNTRIES } from "@/lib/data/countries";
import { COMPANY_PRESETS } from "@/lib/data/companyPresets";
import { STORY } from "@/lib/data/story";
import { LEVEL_CONFIGS } from "@/lib/engine";
import type { Level } from "@/lib/engine";
import { useGameStore } from "@/store/gameStore";
import { playSfx } from "@/lib/audio";
import { formatMoney } from "@/lib/format";
import { getIndustry } from "@/lib/data/industries";

const COLORS = ["#6366f1", "#ef4444", "#16a34a", "#f59e0b", "#0ea5e9", "#db2777", "#7c3aed", "#0d9488"];

function SetupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const level = (params.get("level") as Level) || "middle";
  const newGame = useGameStore((s) => s.newGame);

  const scenes = STORY[level];
  const [sceneIdx, setSceneIdx] = useState(0);
  const [phase, setPhase] = useState<"story" | "form">("story");

  const [tab, setTab] = useState<"preset" | "custom">("preset");
  const [name, setName] = useState("");
  const [industryId, setIndustryId] = useState(INDUSTRIES[0].id);
  const [countryId, setCountryId] = useState(COUNTRIES[0].id);
  const [color, setColor] = useState(COLORS[0]);
  const [basedOn, setBasedOn] = useState<string | undefined>(undefined);
  const [filterCountry, setFilterCountry] = useState<string>("all");

  const filteredPresets = useMemo(
    () => COMPANY_PRESETS.filter((p) => filterCountry === "all" || p.countryId === filterCountry),
    [filterCountry],
  );

  const rankPreview = useMemo(
    () => [...COMPANY_PRESETS].sort((a, b) => b.scale - a.scale).slice(0, 5),
    [],
  );

  const selectPreset = (id: string) => {
    const p = COMPANY_PRESETS.find((x) => x.id === id)!;
    setBasedOn(id);
    setIndustryId(p.industryId);
    setCountryId(p.countryId);
    setColor(p.logoColor);
    if (!name) setName(p.name);
    playSfx("click");
  };

  const start = () => {
    playSfx("turn");
    newGame({
      level,
      playerCompanyName: name || (basedOn ? COMPANY_PRESETS.find((p) => p.id === basedOn)!.name : "내 회사"),
      industryId,
      countryId,
      logoColor: color,
      basedOn: tab === "preset" ? basedOn : undefined,
    });
    router.push("/play");
  };

  // --- Story phase ---
  if (phase === "story") {
    const scene = scenes[sceneIdx];
    return (
      <Shell>
        <div className="card mx-auto max-w-xl animate-popin p-8 text-center">
          <div className="text-6xl">{scene.emoji}</div>
          <h2 className="mt-4 text-2xl font-black text-slate-800">{scene.title}</h2>
          <p className="mt-3 text-slate-600">{scene.body}</p>
          <div className="mt-6 flex justify-center gap-2">
            {scenes.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i === sceneIdx ? "bg-brand-600" : "bg-slate-300"}`}
              />
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button className="btn-ghost" onClick={() => setPhase("form")}>
              건너뛰기
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                playSfx("click");
                if (sceneIdx < scenes.length - 1) setSceneIdx(sceneIdx + 1);
                else setPhase("form");
              }}
            >
              {sceneIdx < scenes.length - 1 ? "다음 ▶" : "회사 만들기 ▶"}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // --- Form phase ---
  const levelCfg = LEVEL_CONFIGS[level];
  const levelEmoji: Record<Level, string> = { elementary: "🧒", middle: "🧑‍🎓", university: "🎓" };

  return (
    <Shell>
      <div className="mx-auto max-w-3xl space-y-5">
        <h2 className="text-center text-2xl font-black text-white">회사를 설정하세요</h2>

        {/* Difficulty + ranking banner */}
        <div className="overflow-hidden rounded-2xl bg-slate-800/60 ring-1 ring-slate-700/50">
          {/* Difficulty row */}
          <div className="flex items-center gap-3 border-b border-slate-700/50 px-4 py-3">
            <span className="text-2xl">{levelEmoji[level]}</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">{levelCfg.label} 난이도</div>
              <div className="text-[11px] text-slate-400">{levelCfg.description}</div>
            </div>
            <div className="flex gap-3 text-right text-[11px]">
              <div>
                <div className="text-slate-500">시작 자금</div>
                <div className="font-mono font-bold text-slate-200">{formatMoney(levelCfg.startingCash)}</div>
              </div>
              <div>
                <div className="text-slate-500">경쟁사</div>
                <div className="font-mono font-bold text-slate-200">{levelCfg.aiCount}개</div>
              </div>
              <div>
                <div className="text-slate-500">캠퍼스</div>
                <div className="font-mono font-bold text-slate-200">{levelCfg.mapSize}×{levelCfg.mapSize}</div>
              </div>
            </div>
          </div>
          {/* Rank preview */}
          <div className="px-4 py-2">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">예상 경쟁사 순위 (규모 기준)</div>
            <div className="flex items-end gap-2">
              {rankPreview.map((p, i) => {
                const ind = getIndustry(p.industryId);
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                return (
                  <div key={p.id} className="flex flex-1 flex-col items-center gap-1 py-1">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                      style={{ background: p.logoColor + "22" }}
                    >
                      {ind.emoji}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 text-center leading-tight truncate w-full text-center">{p.name}</span>
                    <span className="text-[11px]">{medal}</span>
                  </div>
                );
              })}
              <div className="flex flex-col items-center gap-1 py-1 opacity-40">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700 text-lg">👤</span>
                <span className="text-[9px] text-slate-500">내 회사</span>
                <span className="text-[10px] text-slate-500">?위</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <label className="text-sm font-semibold text-slate-600">회사 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예) 유니콘 컴퍼니"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-800 outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex gap-2">
          <TabBtn active={tab === "preset"} onClick={() => setTab("preset")}>
            🌍 실존 기업 모티브
          </TabBtn>
          <TabBtn active={tab === "custom"} onClick={() => setTab("custom")}>
            ✨ 새 회사 만들기
          </TabBtn>
        </div>

        {tab === "preset" ? (
          <div className="card p-5">
            <div className="mb-3 flex flex-wrap gap-1">
              <FilterChip active={filterCountry === "all"} onClick={() => setFilterCountry("all")}>
                전체
              </FilterChip>
              {COUNTRIES.map((c) => (
                <FilterChip
                  key={c.id}
                  active={filterCountry === c.id}
                  onClick={() => setFilterCountry(c.id)}
                >
                  {c.flag} {c.name}
                </FilterChip>
              ))}
            </div>
            <div className="grid max-h-[42vh] gap-2 overflow-y-auto scroll-thin sm:grid-cols-2">
              {filteredPresets.map((p) => {
                const ind = INDUSTRIES.find((i) => i.id === p.industryId)!;
                const ctry = COUNTRIES.find((c) => c.id === p.countryId)!;
                const active = basedOn === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPreset(p.id)}
                    className={`flex items-center gap-3 rounded-xl p-3 text-left ring-2 transition ${
                      active ? "ring-brand-500" : "ring-slate-200 hover:ring-slate-300"
                    }`}
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                      style={{ background: p.logoColor + "22", color: p.logoColor }}
                    >
                      {ind.emoji}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-500">
                        {ctry.flag} {ind.name} · {p.blurb}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="mb-2 text-sm font-semibold text-slate-600">업종</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => {
                      setIndustryId(ind.id);
                      setBasedOn(undefined);
                      playSfx("click");
                    }}
                    className={`rounded-xl px-3 py-2 text-left text-sm ring-2 transition ${
                      industryId === ind.id ? "ring-brand-500" : "ring-slate-200 hover:ring-slate-300"
                    }`}
                  >
                    <span className="text-lg">{ind.emoji}</span>{" "}
                    <span className="font-semibold text-slate-700">{ind.name}</span>
                    {ind.modern && <span className="ml-1 text-[10px] text-pink-500">NEW</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-2 text-sm font-semibold text-slate-600">국가</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCountryId(c.id);
                      setBasedOn(undefined);
                      playSfx("click");
                    }}
                    className={`rounded-xl px-3 py-2 text-left text-sm ring-2 transition ${
                      countryId === c.id ? "ring-brand-500" : "ring-slate-200 hover:ring-slate-300"
                    }`}
                  >
                    {c.flag} <span className="font-semibold text-slate-700">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-2 text-sm font-semibold text-slate-600">로고 색상</div>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-9 w-9 rounded-full ring-2 ${color === c ? "ring-slate-800" : "ring-transparent"}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button className="btn-ghost" onClick={() => setPhase("story")}>
            ◀ 뒤로
          </button>
          <button className="btn-primary px-8" onClick={start}>
            게임 시작 🚀
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 px-4 py-10">
      {children}
    </main>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
        active ? "bg-brand-600 text-white" : "bg-slate-700 text-slate-200 hover:bg-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pill ${active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
    >
      {children}
    </button>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<Shell><div className="text-center text-white">불러오는 중…</div></Shell>}>
      <SetupInner />
    </Suspense>
  );
}
