"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { BUILDINGS, BUILDING_LIST, buildingCostFor } from "@/lib/engine";
import type { BuildingType, Company, GameState, PlacedBuilding } from "@/lib/engine";
import { formatMoney } from "@/lib/format";

const PHASE_BG: Record<string, string> = {
  boom: "from-emerald-100 to-green-50",
  normal: "from-sky-100 to-slate-50",
  recession: "from-slate-200 to-slate-100",
  inflation: "from-orange-100 to-amber-50",
  deflation: "from-blue-100 to-slate-100",
  stagflation: "from-stone-200 to-stone-100",
};

export function CompanyMap({
  game,
  company,
  readOnly = false,
}: {
  game: GameState;
  company: Company;
  readOnly?: boolean;
}) {
  const build = useGameStore((s) => s.build);
  const upgrade = useGameStore((s) => s.upgrade);
  const [selectedType, setSelectedType] = useState<BuildingType | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  const size = game.config.mapSize;
  const grid = new Map<string, PlacedBuilding>();
  for (const b of company.buildings) grid.set(`${b.x},${b.y}`, b);

  const cellPx = size <= 5 ? 60 : size <= 6 ? 52 : 40;
  const boardPx = cellPx * size;

  const onCell = (x: number, y: number) => {
    if (readOnly) return;
    const existing = grid.get(`${x},${y}`);
    if (existing) {
      setSelectedBuilding(existing.id === selectedBuilding ? null : existing.id);
    } else if (selectedType) {
      build(selectedType, x, y);
    }
  };

  const inspected = company.buildings.find((b) => b.id === selectedBuilding);

  return (
    <div className="space-y-3">
      {/* The living board */}
      <div
        className={`relative mx-auto overflow-hidden rounded-2xl bg-gradient-to-br ${
          PHASE_BG[game.macro.phase] ?? PHASE_BG.normal
        } p-2 ring-1 ring-slate-200`}
        style={{ width: boardPx + 16 }}
      >
        {/* ambient agents */}
        <Agents width={boardPx} height={boardPx} density={Math.min(8, company.buildings.length + 2)} />

        <div
          className="relative grid gap-1"
          style={{ gridTemplateColumns: `repeat(${size}, ${cellPx}px)` }}
        >
          {Array.from({ length: size * size }).map((_, idx) => {
            const x = idx % size;
            const y = Math.floor(idx / size);
            const b = grid.get(`${x},${y}`);
            const isSel = b && b.id === selectedBuilding;
            return (
              <button
                key={idx}
                onClick={() => onCell(x, y)}
                style={{ width: cellPx, height: cellPx }}
                className={`relative flex items-center justify-center rounded-lg text-2xl transition ${
                  b
                    ? "bg-white/80 ring-1 ring-slate-300 hover:ring-brand-400"
                    : selectedType && !readOnly
                      ? "bg-emerald-200/40 ring-1 ring-dashed ring-emerald-400 hover:bg-emerald-200/70"
                      : "bg-white/30 ring-1 ring-white/40"
                } ${isSel ? "!ring-2 !ring-brand-600" : ""}`}
              >
                {b ? (
                  <>
                    <span className={b.turnsLeft > 0 ? "opacity-50 grayscale" : "animate-popin"}>
                      {BUILDINGS[b.type].emoji}
                    </span>
                    {b.level > 1 && (
                      <span className="absolute right-0.5 top-0.5 rounded bg-brand-600 px-1 text-[9px] font-bold text-white">
                        Lv{b.level}
                      </span>
                    )}
                    {b.turnsLeft > 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-amber-500/80 text-[8px] font-bold text-white">
                        🏗️ {b.turnsLeft}턴
                      </span>
                    )}
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {!readOnly && (
        <>
          {/* Inspector for a selected building */}
          {inspected && (
            <div className="card flex items-center justify-between gap-3 p-3">
              <div className="text-sm">
                <span className="text-lg">{BUILDINGS[inspected.type].emoji}</span>{" "}
                <b className="text-slate-800">{BUILDINGS[inspected.type].name}</b>{" "}
                <span className="text-slate-500">Lv{inspected.level}</span>
                <div className="text-xs text-slate-500">{BUILDINGS[inspected.type].description}</div>
              </div>
              {inspected.level < BUILDINGS[inspected.type].maxLevel ? (
                <button
                  className="btn-primary whitespace-nowrap"
                  onClick={() => upgrade(inspected.id)}
                >
                  업그레이드 · {formatMoney(buildingCostFor(inspected.type, inspected.level + 1))}
                </button>
              ) : (
                <span className="pill bg-slate-100 text-slate-500">최고 레벨</span>
              )}
            </div>
          )}

          {/* Build palette */}
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-500">
              건물을 선택하고 빈 칸을 누르세요
            </div>
            <div className="flex flex-wrap gap-2">
              {BUILDING_LIST.filter((d) => game.config.enabledBuildings.includes(d.type)).map((d) => {
                const active = selectedType === d.type;
                const cost = buildingCostFor(d.type, 1);
                const affordable = company.cash >= cost;
                return (
                  <button
                    key={d.type}
                    onClick={() => {
                      setSelectedType(active ? null : d.type);
                      setSelectedBuilding(null);
                    }}
                    className={`flex flex-col items-center rounded-xl px-3 py-2 ring-2 transition ${
                      active ? "bg-brand-50 ring-brand-500" : "bg-white ring-slate-200 hover:ring-slate-300"
                    } ${affordable ? "" : "opacity-50"}`}
                  >
                    <span className="text-xl">{d.emoji}</span>
                    <span className="text-[11px] font-semibold text-slate-700">{d.name}</span>
                    <span className="text-[10px] text-slate-500">{formatMoney(cost)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Decorative pedestrians & cars that drift across the campus.
function Agents({ width, height, density }: { width: number; height: number; density: number }) {
  const cars = ["🚗", "🚕", "🚙", "🚌"];
  const peds = ["🚶", "🧍", "🏃", "🚴"];
  const items = Array.from({ length: density }).map((_, i) => {
    const horizontal = i % 2 === 0;
    const emoji = horizontal ? cars[i % cars.length] : peds[i % peds.length];
    const dur = 6 + ((i * 1.7) % 6);
    const offset = ((i * 37) % 90) + 5;
    return { horizontal, emoji, dur, offset, delay: (i * 0.9) % 5 };
  });
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-sm opacity-80">
      {items.map((it, i) =>
        it.horizontal ? (
          <span
            key={i}
            className="agent-x absolute"
            style={{
              top: `${it.offset}%`,
              left: 0,
              ["--travel" as string]: `${width}px`,
              animationDuration: `${it.dur}s`,
              animationDelay: `${it.delay}s`,
            }}
          >
            {it.emoji}
          </span>
        ) : (
          <span
            key={i}
            className="agent-y absolute"
            style={{
              left: `${it.offset}%`,
              top: 0,
              ["--travel" as string]: `${height}px`,
              animationDuration: `${it.dur}s`,
              animationDelay: `${it.delay}s`,
            }}
          >
            {it.emoji}
          </span>
        ),
      )}
    </div>
  );
}
