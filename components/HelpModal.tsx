"use client";

import { useState } from "react";
import { MANUAL_SECTIONS, TUTORIAL_STEPS, GLOSSARY_GROUPS } from "@/lib/data/manual";
import { GLOSSARY } from "@/lib/data/glossary";

type HelpTab = "tutorial" | "manual" | "glossary";

/** Render **bold** segments inside manual/tutorial text. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <b key={i} className="font-bold text-brand-700">{p.slice(2, -2)}</b>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function HelpModal({
  open,
  onClose,
  initialTab = "manual",
  onStartTour,
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: HelpTab;
  onStartTour?: () => void;
}) {
  const [tab, setTab] = useState<HelpTab>(initialTab);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-brand-600 to-indigo-500 px-4 py-3 text-white">
          <span className="text-xl">📖</span>
          <h2 className="text-base font-black">게임 도움말</h2>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg bg-white/20 px-2.5 py-1 text-sm font-bold hover:bg-white/30"
          >
            닫기 ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-100 px-2 py-2">
          {([
            ["tutorial", "🚀 튜토리얼"],
            ["manual", "📘 메뉴얼"],
            ["glossary", "🔤 용어 풀이"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                tab === id ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-4 py-4">
          {tab === "tutorial" && <TutorialView onStartTour={onStartTour} />}
          {tab === "manual" && <ManualView />}
          {tab === "glossary" && <GlossaryView />}
        </div>
      </div>
    </div>
  );
}

function TutorialView({ onStartTour }: { onStartTour?: () => void }) {
  return (
    <div>
      {onStartTour && (
        <button onClick={onStartTour} className="btn-primary mb-3 w-full !py-2.5">
          🧭 화면에서 직접 따라하기 (가이드 투어)
        </button>
      )}
      <ol className="space-y-3">
      {TUTORIAL_STEPS.map((s, i) => (
        <li key={i} className="flex gap-3 rounded-xl bg-slate-50 p-3">
          <span className="text-2xl leading-none">{s.icon}</span>
          <div>
            <div className="font-bold text-slate-800">{s.title}</div>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
              <RichText text={s.text} />
            </p>
          </div>
        </li>
      ))}
      </ol>
    </div>
  );
}

function ManualView() {
  return (
    <div className="space-y-4">
      {MANUAL_SECTIONS.map((sec) => (
        <section key={sec.id}>
          <h3 className="mb-1.5 flex items-center gap-2 text-sm font-black text-slate-800">
            <span className="text-lg">{sec.icon}</span>
            {sec.title}
          </h3>
          <ul className="space-y-1 pl-1">
            {sec.body.map((line, i) => (
              <li key={i} className="flex gap-1.5 text-sm leading-relaxed text-slate-600">
                <span className="mt-1 text-brand-400">•</span>
                <span><RichText text={line} /></span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function GlossaryView() {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="용어 검색…"
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500"
      />
      <div className="space-y-4">
        {GLOSSARY_GROUPS.map((g) => {
          const terms = g.terms.filter((t) => {
            if (!query) return true;
            const def = GLOSSARY[t] ?? "";
            return t.toLowerCase().includes(query) || def.toLowerCase().includes(query);
          });
          if (terms.length === 0) return null;
          return (
            <section key={g.title}>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                <span>{g.icon}</span>
                {g.title}
              </h3>
              <dl className="space-y-1.5">
                {terms.map((t) => (
                  <div key={t} className="rounded-lg bg-slate-50 px-3 py-2">
                    <dt className="text-sm font-bold text-brand-700">{t}</dt>
                    <dd className="text-xs leading-relaxed text-slate-600">{GLOSSARY[t]}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>
    </div>
  );
}
