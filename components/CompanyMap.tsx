"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { BUILDINGS, BUILDING_LIST, buildingCostFor } from "@/lib/engine";
import type { BuildingType, Company, GameState, PlacedBuilding } from "@/lib/engine";
import { formatMoney } from "@/lib/format";

/* ── Adaptive tile dimensions ───────────────────────────────────────────── */
function getTW(n: number) {
  return n <= 5 ? 80 : n <= 6 ? 74 : n <= 7 ? 66 : 58;
}

/* ── Isometric coordinate math ──────────────────────────────────────────── */
function sX(gx: number, gy: number, n: number, tw: number): number {
  return Math.floor((n * tw) / 2) + (gx - gy) * (tw / 2);
}
function sY(gx: number, gy: number, tw: number): number {
  const th = tw >> 1;
  const bh = Math.round(tw * 0.36);
  return (gx + gy) * (th / 2) + bh + th / 2;
}
const svgW = (n: number, tw: number) => n * tw;
const svgH = (n: number, tw: number) => n * (tw >> 1) + Math.round(tw * 0.36);
const diam = (cx: number, cy: number, tw: number) => {
  const th = tw >> 1;
  return `${cx},${cy - th / 2} ${cx + tw / 2},${cy} ${cx},${cy + th / 2} ${cx - tw / 2},${cy}`;
};

/* ── Building colors: [roof, left-wall, right-wall] ─────────────────────── */
const BC: Record<string, [string, string, string]> = {
  factory:   ["#94a3b8", "#475569", "#64748b"],
  warehouse: ["#f59e0b", "#92400e", "#b45309"],
  store:     ["#60a5fa", "#1d4ed8", "#2563eb"],
  rnd:       ["#c084fc", "#6d28d9", "#7c3aed"],
  office:    ["#6ee7b7", "#065f46", "#047857"],
  hr:        ["#fde68a", "#b45309", "#d97706"],
  power:     ["#fca5a5", "#991b1b", "#b91c1c"],
  park:      ["#86efac", "#15803d", "#16a34a"],
};

const PHASE_GROUND: Record<string, string> = {
  boom: "#bbf7d0", normal: "#d1fae5", recession: "#e2e8f0",
  inflation: "#fef3c7", deflation: "#dbeafe", stagflation: "#e7e5e4",
};

/* ── Isometric tile ─────────────────────────────────────────────────────── */
function IsoTile({
  gx, gy, n, tw, building, phase, selected, buildHighlight, onClick,
}: {
  gx: number; gy: number; n: number; tw: number;
  building?: PlacedBuilding; phase: string;
  selected: boolean; buildHighlight: boolean;
  onClick: () => void;
}) {
  const cx = sX(gx, gy, n, tw);
  const cy = sY(gx, gy, tw);
  const th = tw >> 1;
  const bh = Math.round(tw * 0.36);
  const ground = PHASE_GROUND[phase] ?? PHASE_GROUND.normal;

  if (!building) {
    const fill = buildHighlight ? "#86efac" : ground;
    return (
      <polygon
        points={diam(cx, cy, tw)}
        fill={fill}
        stroke={buildHighlight ? "#16a34a" : "rgba(0,0,0,0.08)"}
        strokeWidth={buildHighlight ? 1.5 : 0.5}
        onClick={onClick}
        style={{ cursor: "pointer" }}
      />
    );
  }

  const isBuilding = building.turnsLeft <= 0;
  const faceH = isBuilding ? bh : Math.round(bh / 3);
  const [roof, lw, rw] = BC[building.type] ?? BC.office;

  // Roof polygon (shifted up by faceH)
  const roofPts = `${cx},${cy - th / 2 - faceH} ${cx + tw / 2},${cy - faceH} ${cx},${cy + th / 2 - faceH} ${cx - tw / 2},${cy - faceH}`;
  // Left wall: (left-ground) → (bottom-ground) → (bottom-roof) → (left-roof)
  const leftFace = `${cx - tw / 2},${cy} ${cx},${cy + th / 2} ${cx},${cy + th / 2 - faceH} ${cx - tw / 2},${cy - faceH}`;
  // Right wall
  const rightFace = `${cx + tw / 2},${cy} ${cx},${cy + th / 2} ${cx},${cy + th / 2 - faceH} ${cx + tw / 2},${cy - faceH}`;

  const roofFill = selected ? "#818cf8" : isBuilding ? roof : "#d1d5db";
  const lwFill = isBuilding ? lw : "#9ca3af";
  const rwFill = isBuilding ? rw : "#6b7280";
  const fontSize = Math.max(10, Math.round(tw * 0.2));

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <polygon points={diam(cx, cy, tw)} fill={ground} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
      <polygon points={leftFace} fill={lwFill} />
      <polygon points={rightFace} fill={rwFill} />
      <polygon
        points={roofPts}
        fill={roofFill}
        stroke={selected ? "#6366f1" : "rgba(0,0,0,0.12)"}
        strokeWidth={selected ? 1.5 : 0.5}
      />
      <text
        x={cx} y={cy - faceH}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={fontSize}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {isBuilding ? BUILDINGS[building.type].emoji : "🏗️"}
      </text>
      {building.level > 1 && isBuilding && (
        <text
          x={cx + tw / 2 - 2} y={cy - faceH - th / 2 + 6}
          textAnchor="end" fontSize="8" fontWeight="bold" fill="white"
          style={{ pointerEvents: "none" }}
        >
          Lv{building.level}
        </text>
      )}
      {!isBuilding && (
        <text
          x={cx} y={cy + th / 2 - 3}
          textAnchor="middle" fontSize="8" fill="#374151"
          style={{ pointerEvents: "none" }}
        >
          {building.turnsLeft}턴
        </text>
      )}
    </g>
  );
}

/* ── SVG agent shapes (no emoji) ────────────────────────────────────────── */
function CarShape({ color }: { color: string }) {
  return (
    <g>
      <rect x="-13" y="-4" width="26" height="8" rx="2.5" fill={color} />
      <rect x="-8" y="-8.5" width="16" height="6" rx="2" fill={color} />
      <rect x="-7" y="-8" width="5" height="4" rx="1" fill="#bfdbfe" opacity="0.85" />
      <rect x="1" y="-8" width="5" height="4" rx="1" fill="#bfdbfe" opacity="0.85" />
      <circle cx="-8" cy="5" r="2.5" fill="#1f2937" />
      <circle cx="8" cy="5" r="2.5" fill="#1f2937" />
      <circle cx="-8" cy="5" r="1" fill="#9ca3af" />
      <circle cx="8" cy="5" r="1" fill="#9ca3af" />
    </g>
  );
}

function PersonShape({ color }: { color: string }) {
  return (
    <g>
      <circle cx="0" cy="-8" r="3.5" fill={color} />
      <rect x="-3" y="-4.5" width="6" height="8" rx="2" fill={color} />
      <rect x="-3.5" y="3" width="3" height="6" rx="1.5" fill={color} />
      <rect x="0.5" y="3" width="3" height="6" rx="1.5" fill={color} />
    </g>
  );
}

interface AgentDef {
  isCar: boolean; color: string;
  sx: number; sy: number; dx: number; dy: number;
  flipX: boolean; dur: number; delayS: number;
}

function buildAgents(n: number, tw: number, density: number): AgentDef[] {
  const th = tw >> 1;
  const tX = (n - 1) * (tw / 2);
  const tY = (n - 1) * (th / 2);
  const CARS = ["#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#10b981"];
  const PEDS = ["#ec4899", "#84cc16", "#f97316"];
  const crossPos = (i: number) => 1 + (i % Math.max(1, n - 2));

  return Array.from({ length: density }, (_, i) => {
    const horiz = i % 2 === 0;
    const rev   = (i >> 1) % 2 === 1;
    const isCar = i % 3 < 2;
    const p     = crossPos(i);

    let sx: number, sy: number, dx: number, dy: number, flipX: boolean;
    if (horiz) {
      // travel along x-axis: (0,p)→(n-1,p) right-down in screen
      sx = sX(rev ? n - 1 : 0, p, n, tw);
      sy = sY(rev ? n - 1 : 0, p, tw);
      dx = rev ? -tX : tX;
      dy = rev ? -tY : tY;
      flipX = rev;
    } else {
      // travel along y-axis: (p,0)→(p,n-1) left-down in screen
      sx = sX(p, rev ? n - 1 : 0, n, tw);
      sy = sY(p, rev ? n - 1 : 0, tw);
      dx = rev ? tX : -tX;
      dy = rev ? -tY : tY;
      flipX = !rev;
    }
    return {
      isCar, flipX,
      color: isCar ? CARS[i % CARS.length] : PEDS[i % PEDS.length],
      sx, sy, dx, dy,
      dur: 5 + ((i * 1.7) % 7),
      delayS: (i * 0.9) % 6,
    };
  });
}

/* ── Main component ─────────────────────────────────────────────────────── */
export function CompanyMap({
  game, company, readOnly = false,
}: {
  game: GameState; company: Company; readOnly?: boolean;
}) {
  const build   = useGameStore((s) => s.build);
  const upgrade = useGameStore((s) => s.upgrade);
  const [selectedType, setSelectedType]         = useState<BuildingType | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell]           = useState<string | null>(null);

  const n  = game.config.mapSize;
  const tw = getTW(n);
  const w  = svgW(n, tw);
  const h  = svgH(n, tw);

  const grid = new Map<string, PlacedBuilding>();
  for (const b of company.buildings) grid.set(`${b.x},${b.y}`, b);

  // Sort tiles back-to-front (lower x+y drawn first)
  const tiles: { x: number; y: number }[] = [];
  for (let s = 0; s < 2 * n - 1; s++) {
    for (let x = 0; x <= s && x < n; x++) {
      const y = s - x;
      if (y >= 0 && y < n) tiles.push({ x, y });
    }
  }

  const onCell = (x: number, y: number) => {
    if (readOnly) return;
    const key = `${x},${y}`;
    const existing = grid.get(key);
    if (existing) {
      setSelectedBuilding(existing.id === selectedBuilding ? null : existing.id);
      setSelectedType(null);
    } else if (selectedType) {
      build(selectedType, x, y);
      setSelectedType(null);
    }
  };

  const inspected = company.buildings.find((b) => b.id === selectedBuilding);
  const density = Math.min(10, 2 + Math.floor(company.buildings.length * 1.4));
  const agents  = buildAgents(n, tw, density);

  return (
    <div className="space-y-3">
      {/* Isometric SVG campus */}
      <div className="flex justify-center">
        <svg
          width={w} height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ display: "block", overflow: "visible" }}
          aria-label="회사 캠퍼스 지도"
        >
          {/* Ground tiles (back to front) */}
          {tiles.map(({ x, y }) => {
            const key = `${x},${y}`;
            return (
              <IsoTile
                key={key}
                gx={x} gy={y} n={n} tw={tw}
                building={grid.get(key)}
                phase={game.macro.phase}
                selected={grid.get(key)?.id === selectedBuilding}
                buildHighlight={!readOnly && !!selectedType && !grid.has(key) && hoveredCell === key}
                onClick={() => onCell(x, y)}
              />
            );
          })}

          {/* Hover highlight for build-mode empty cells */}
          {!readOnly && selectedType && tiles.map(({ x, y }) => {
            const key = `${x},${y}`;
            if (grid.has(key)) return null;
            const cx = sX(x, y, n, tw);
            const cy = sY(x, y, tw);
            return (
              <polygon
                key={`hover-${key}`}
                points={diam(cx, cy, tw)}
                fill="transparent"
                onMouseEnter={() => setHoveredCell(key)}
                onMouseLeave={() => setHoveredCell(null)}
                style={{ pointerEvents: "all", cursor: "pointer" }}
              />
            );
          })}

          {/* Ambient agents (SVG shapes, no emoji) */}
          <g style={{ pointerEvents: "none" }} opacity="0.85">
            {agents.map((a, i) => (
              <g
                key={i}
                transform={`translate(${a.sx} ${a.sy})`}
              >
                <g
                  className="iso-agent-anim"
                  style={{
                    "--dx": `${a.dx}px`,
                    "--dy": `${a.dy}px`,
                    "--dur": `${a.dur}s`,
                    animationDelay: `-${a.delayS}s`,
                  } as React.CSSProperties}
                >
                  <g transform={a.flipX ? "scale(-1,1)" : undefined}>
                    {a.isCar ? <CarShape color={a.color} /> : <PersonShape color={a.color} />}
                  </g>
                </g>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {!readOnly && (
        <>
          {/* Building inspector */}
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
              건물을 선택하고 빈 타일을 클릭하세요
            </div>
            <div className="flex flex-wrap gap-2">
              {BUILDING_LIST.filter((d) => game.config.enabledBuildings.includes(d.type)).map((d) => {
                const active    = selectedType === d.type;
                const cost      = buildingCostFor(d.type, 1);
                const canAfford = company.cash >= cost;
                return (
                  <button
                    key={d.type}
                    onClick={() => {
                      setSelectedType(active ? null : d.type);
                      setSelectedBuilding(null);
                    }}
                    className={`flex flex-col items-center rounded-xl px-3 py-2 ring-2 transition ${
                      active
                        ? "bg-brand-50 ring-brand-500"
                        : "bg-white ring-slate-200 hover:ring-slate-300"
                    } ${canAfford ? "" : "opacity-50"}`}
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
