"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";
import { BUILDINGS, BUILDING_LIST, buildingCostFor } from "@/lib/engine";
import type { BuildingType, Company, GameState, PlacedBuilding } from "@/lib/engine";
import { formatMoney } from "@/lib/format";
import { pickCityVoice } from "@/lib/data/cityVoices";

/* ── palette ─────────────────────────────────────────────────────────────── */
// [body, roof, accent]
const COLORS: Record<BuildingType, [string, string, string]> = {
  factory:   ["#7c8896", "#9aa6b4", "#5b6675"],
  warehouse: ["#c98a3a", "#e0a44e", "#92580f"],
  store:     ["#3b82f6", "#60a5fa", "#1d4ed8"],
  rnd:       ["#a855f7", "#c084fc", "#6d28d9"],
  office:    ["#22a884", "#34d399", "#0f766e"],
  hr:        ["#eab308", "#fde047", "#a16207"],
  power:     ["#ef5350", "#f87171", "#991b1b"],
  park:      ["#34a853", "#4ade80", "#15803d"],
};

const PHASE_BG: Record<string, string> = {
  boom: "#bfe9ff", normal: "#d6efff", recession: "#cdd6e0",
  inflation: "#ffe6c2", deflation: "#dfe7ff", stagflation: "#dcdad6",
};
const PHASE_GRASS: Record<string, string> = {
  boom: "#7ec850", normal: "#86d05a", recession: "#9fb08c",
  inflation: "#b6c46a", deflation: "#8fc4a8", stagflation: "#a7ad8e",
};

const TILE = 1; // world units per grid cell

/* ── low-poly building ───────────────────────────────────────────────────── */
function Building3D({
  building, selected,
}: { building: PlacedBuilding; selected: boolean }) {
  const [body, roof, accent] = COLORS[building.type];
  const lvl = building.level;
  const underConstruction = building.turnsLeft > 0;

  if (underConstruction) {
    return (
      <group>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.7, 0.5, 0.7]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.6} />
        </mesh>
        {/* crane */}
        <mesh position={[0.35, 0.6, 0.35]}>
          <boxGeometry args={[0.05, 1.2, 0.05]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[0.15, 1.15, 0.35]}>
          <boxGeometry args={[0.5, 0.05, 0.05]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      </group>
    );
  }

  const emissive = selected ? new THREE.Color("#6366f1") : new THREE.Color("#000000");

  switch (building.type) {
    case "office": {
      const h = 0.7 + lvl * 0.55;
      return (
        <group>
          <RoundedBox args={[0.62, h, 0.62]} radius={0.04} smoothness={2} position={[0, h / 2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={body} emissive={emissive} emissiveIntensity={selected ? 0.4 : 0} />
          </RoundedBox>
          {/* window bands */}
          {Array.from({ length: lvl + 1 }).map((_, i) => (
            <mesh key={i} position={[0, 0.35 + i * 0.42, 0.315]}>
              <boxGeometry args={[0.5, 0.12, 0.02]} />
              <meshStandardMaterial color="#bfe3ff" emissive="#9cc7ff" emissiveIntensity={0.5} />
            </mesh>
          ))}
          <mesh position={[0, h + 0.04, 0]}>
            <boxGeometry args={[0.66, 0.08, 0.66]} />
            <meshStandardMaterial color={roof} />
          </mesh>
        </group>
      );
    }
    case "factory": {
      const h = 0.5 + lvl * 0.18;
      return (
        <group>
          <RoundedBox args={[0.8, h, 0.8]} radius={0.03} position={[0, h / 2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={body} emissive={emissive} emissiveIntensity={selected ? 0.4 : 0} />
          </RoundedBox>
          <mesh position={[0.22, h + 0.25, 0.22]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
            <meshStandardMaterial color={accent} />
          </mesh>
          <SmokePuff position={[0.22, h + 0.55, 0.22]} />
          {/* sawtooth roof */}
          <mesh position={[0, h + 0.05, 0]}>
            <boxGeometry args={[0.82, 0.06, 0.82]} />
            <meshStandardMaterial color={roof} />
          </mesh>
        </group>
      );
    }
    case "warehouse": {
      const h = 0.4 + lvl * 0.12;
      return (
        <group>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.85, h, 0.85]} />
            <meshStandardMaterial color={body} emissive={emissive} emissiveIntensity={selected ? 0.4 : 0} />
          </mesh>
          {/* gable roof */}
          <mesh position={[0, h + 0.18, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.6, 0.86, 4]} />
            <meshStandardMaterial color={roof} />
          </mesh>
          <mesh position={[0, 0.18, 0.43]}>
            <boxGeometry args={[0.5, 0.34, 0.02]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        </group>
      );
    }
    case "store": {
      const h = 0.45 + lvl * 0.2;
      return (
        <group>
          <RoundedBox args={[0.7, h, 0.7]} radius={0.03} position={[0, h / 2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={body} emissive={emissive} emissiveIntensity={selected ? 0.4 : 0} />
          </RoundedBox>
          {/* awning */}
          <mesh position={[0, 0.28, 0.4]} rotation={[Math.PI / 6, 0, 0]} castShadow>
            <boxGeometry args={[0.72, 0.04, 0.22]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, h + 0.12, 0]}>
            <boxGeometry args={[0.4, 0.16, 0.05]} />
            <meshStandardMaterial color={roof} emissive="#fde047" emissiveIntensity={0.3} />
          </mesh>
        </group>
      );
    }
    case "rnd": {
      const h = 0.55 + lvl * 0.25;
      return (
        <group>
          <RoundedBox args={[0.66, h, 0.66]} radius={0.05} position={[0, h / 2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={body} emissive={emissive} emissiveIntensity={selected ? 0.4 : 0} />
          </RoundedBox>
          <mesh position={[0, h + 0.08, 0]} castShadow>
            <sphereGeometry args={[0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={roof} metalness={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0, h + 0.45, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.35, 6]} />
            <meshStandardMaterial color={accent} />
          </mesh>
          <mesh position={[0, h + 0.62, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    }
    case "power": {
      const h = 0.45 + lvl * 0.15;
      return (
        <group>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.7, h, 0.7]} />
            <meshStandardMaterial color={body} emissive={emissive} emissiveIntensity={selected ? 0.4 : 0} />
          </mesh>
          <mesh position={[-0.15, h + 0.2, -0.1]} castShadow>
            <cylinderGeometry args={[0.16, 0.22, 0.55, 12]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
          <SmokePuff position={[-0.15, h + 0.55, -0.1]} scale={0.7} />
          <mesh position={[0.2, h + 0.02, 0.2]} rotation={[-Math.PI / 5, 0, 0]}>
            <boxGeometry args={[0.28, 0.02, 0.28]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.4} />
          </mesh>
        </group>
      );
    }
    case "hr": {
      const h = 0.5 + lvl * 0.2;
      return (
        <group>
          <RoundedBox args={[0.66, h, 0.66]} radius={0.04} position={[0, h / 2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={body} emissive={emissive} emissiveIntensity={selected ? 0.4 : 0} />
          </RoundedBox>
          <mesh position={[0, 0.16, 0.34]}>
            <boxGeometry args={[0.2, 0.32, 0.02]} />
            <meshStandardMaterial color={accent} />
          </mesh>
          <mesh position={[0, h + 0.04, 0]}>
            <boxGeometry args={[0.7, 0.08, 0.7]} />
            <meshStandardMaterial color={roof} />
          </mesh>
        </group>
      );
    }
    case "park":
    default:
      return (
        <group>
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.04, 16]} />
            <meshStandardMaterial color={body} />
          </mesh>
          {[[-0.2, 0.18], [0.2, -0.15], [0.1, 0.22]].map(([x, z], i) => (
            <Tree key={i} position={[x, 0, z]} scale={0.8} />
          ))}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.18, 0.04, 0.06]} />
            <meshStandardMaterial color="#92400e" />
          </mesh>
        </group>
      );
  }
}

function SmokePuff({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.elapsedTime % 2) / 2;
    ref.current.position.y = position[1] + t * 0.5;
    const s = (0.06 + t * 0.12) * scale;
    ref.current.scale.setScalar(s);
    (ref.current.material as THREE.MeshStandardMaterial).opacity = (1 - t) * 0.5;
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#cbd5e1" transparent opacity={0.4} />
    </mesh>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.2, 6]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <coneGeometry args={[0.16, 0.4, 8]} />
        <meshStandardMaterial color="#2f9e44" />
      </mesh>
    </group>
  );
}

/* ── agents ──────────────────────────────────────────────────────────────── */
function Car({ a }: { a: AgentPath }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = ((state.clock.elapsedTime / a.dur + a.phase) % 1 + 1) % 1;
    const p = a.at(t);
    ref.current.position.set(p.x, 0.08, p.z);
    ref.current.rotation.y = a.heading;
  });
  return (
    <group ref={ref}>
      <RoundedBox args={[0.34, 0.12, 0.18]} radius={0.04} smoothness={2} castShadow>
        <meshStandardMaterial color={a.color} />
      </RoundedBox>
      <RoundedBox args={[0.18, 0.1, 0.15]} radius={0.03} position={[0, 0.1, 0]}>
        <meshStandardMaterial color={a.color} />
      </RoundedBox>
    </group>
  );
}

function Person({
  a, speaking, onClick,
}: { a: AgentPath; speaking: string | null; onClick: () => void }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const raw = (state.clock.elapsedTime / a.dur + a.phase) % 2;
    const t = raw < 1 ? raw : 2 - raw; // ping-pong
    const p = a.at(t);
    ref.current.position.set(p.x, 0, p.z);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.12, 0]} castShadow onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <cylinderGeometry args={[0.06, 0.07, 0.18, 6]} />
        <meshStandardMaterial color={a.color} />
      </mesh>
      <mesh position={[0, 0.27, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color="#fcd5b5" />
      </mesh>
      {speaking && (
        <Html position={[0, 0.5, 0]} center distanceFactor={8} zIndexRange={[40, 0]}>
          <div style={{
            background: "white", border: "1px solid #e2e8f0", borderRadius: 10,
            padding: "5px 8px", fontSize: 13, lineHeight: 1.25, width: 150,
            textAlign: "center", color: "#334155", boxShadow: "0 4px 12px rgba(15,23,42,0.18)",
          }}>
            {speaking}
          </div>
        </Html>
      )}
    </group>
  );
}

function VisitorAgent({ visitor, half }: { visitor: NonNullable<Company["visitor"]>; half: number }) {
  const color = visitor.kind === "politician" ? "#1e3a8a" : visitor.kind === "ceo" ? "#374151" : "#db2777";
  return (
    <group position={[0, 0, half + 0.6]}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.24, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#fcd5b5" />
      </mesh>
      <Html position={[0, 0.62, 0]} center distanceFactor={9}>
        <div style={{
          background: color, color: "white", borderRadius: 999, padding: "3px 9px",
          fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
        }}>
          {visitor.emoji} {visitor.name}
        </div>
      </Html>
    </group>
  );
}

/* ── tile ────────────────────────────────────────────────────────────────── */
function Tile({
  x, z, grass, highlight, onClick, onHover,
}: {
  x: number; z: number; grass: string; highlight: boolean;
  onClick: () => void; onHover: (on: boolean) => void;
}) {
  return (
    <mesh
      position={[x, 0.012, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={() => onHover(false)}
    >
      <planeGeometry args={[TILE * 0.96, TILE * 0.96]} />
      <meshStandardMaterial color={highlight ? "#a7f3d0" : grass} transparent opacity={highlight ? 1 : 0.35} />
    </mesh>
  );
}

/* ── agent path helpers ──────────────────────────────────────────────────── */
interface AgentPath {
  color: string; dur: number; phase: number; heading: number;
  at: (t: number) => { x: number; z: number };
}

function buildPaths(n: number) {
  const half = (n * TILE) / 2;
  const CARS = ["#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4"];
  const PEDS = ["#ec4899", "#84cc16", "#f97316", "#0ea5e9", "#a855f7"];
  const ring = half + 0.45; // outer ring road radius (square)

  const cars: AgentPath[] = [];
  const corners = [
    { x: -ring, z: -ring }, { x: ring, z: -ring },
    { x: ring, z: ring }, { x: -ring, z: ring },
  ];
  const carCount = Math.min(5, 2 + Math.floor(n / 2));
  for (let i = 0; i < carCount; i++) {
    const edge = i % 4;
    const p0 = corners[edge], p1 = corners[(edge + 1) % 4];
    const heading = Math.atan2(p1.x - p0.x, p1.z - p0.z);
    cars.push({
      color: CARS[i % CARS.length], dur: 7 + (i % 4), phase: (i * 0.37) % 1, heading,
      at: (t) => ({ x: p0.x + (p1.x - p0.x) * t, z: p0.z + (p1.z - p0.z) * t }),
    });
  }

  const people: AgentPath[] = [];
  const pedCount = Math.min(9, 3 + Math.floor(n));
  const inner = half - 0.7;
  for (let i = 0; i < pedCount; i++) {
    const horiz = i % 2 === 0;
    const lane = ((i % (n - 1)) - (n - 1) / 2) * (TILE * 0.7);
    people.push({
      color: PEDS[i % PEDS.length], dur: 5 + (i % 5), phase: (i * 0.5) % 2, heading: 0,
      at: (t) => horiz
        ? { x: -inner + 2 * inner * t, z: lane }
        : { x: lane, z: -inner + 2 * inner * t },
    });
  }
  return { cars, people, half };
}

/* ── scene ───────────────────────────────────────────────────────────────── */
function Scene({
  game, company, readOnly, overview, selectedType, selectedBuildingId, onCell,
}: {
  game: GameState; company: Company; readOnly: boolean; overview: boolean;
  selectedType: BuildingType | null;
  selectedBuildingId: string | null;
  onCell: (x: number, y: number) => void;
}) {
  const n = game.config.mapSize;
  const half = (n * TILE) / 2;
  const grass = PHASE_GRASS[game.macro.phase] ?? PHASE_GRASS.normal;
  const [hover, setHover] = useState<string | null>(null);
  const [speaker, setSpeaker] = useState<{ i: number; text: string } | null>(null);

  const grid = useMemo(() => {
    const m = new Map<string, PlacedBuilding>();
    for (const b of company.buildings) m.set(`${b.x},${b.y}`, b);
    return m;
  }, [company.buildings]);

  const { cars, people } = useMemo(() => buildPaths(n), [n]);

  const tileWorld = (gx: number, gy: number) => ({
    x: (gx - (n - 1) / 2) * TILE,
    z: (gy - (n - 1) / 2) * TILE,
  });

  return (
    <>
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#ffffff", "#cbd5e1", 0.5]} />
      <directionalLight
        position={[half + 3, half + 6, half + 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-half - 3}
        shadow-camera-right={half + 3}
        shadow-camera-top={half + 3}
        shadow-camera-bottom={-half - 3}
      />

      {/* plot base (extruded ground); top sits at y=0 */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[n * TILE + 1.4, 0.3, n * TILE + 1.4]} />
        <meshStandardMaterial color="#b9a07a" />
      </mesh>
      {/* ring road (border, just above the base) */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[n * TILE + 0.9, n * TILE + 0.9]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* grass field (above the road) */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[n * TILE, n * TILE]} />
        <meshStandardMaterial color={grass} />
      </mesh>

      {/* tiles + buildings */}
      {Array.from({ length: n }).map((_, gy) =>
        Array.from({ length: n }).map((__, gx) => {
          const key = `${gx},${gy}`;
          const b = grid.get(key);
          const { x, z } = tileWorld(gx, gy);
          return (
            <group key={key}>
              {!b && (
                <Tile
                  x={x} z={z} grass={grass}
                  highlight={!readOnly && !!selectedType && hover === key}
                  onClick={() => onCell(gx, gy)}
                  onHover={(on) => setHover(on ? key : null)}
                />
              )}
              {b && (
                <group
                  position={[x, 0, z]}
                  onClick={(e) => { e.stopPropagation(); onCell(gx, gy); }}
                >
                  <Building3D building={b} selected={b.id === selectedBuildingId} />
                </group>
              )}
            </group>
          );
        }),
      )}

      {/* agents */}
      {cars.map((a, i) => <Car key={`c${i}`} a={a} />)}
      {people.map((a, i) => (
        <Person
          key={`p${i}`}
          a={a}
          speaking={speaker?.i === i ? speaker.text : null}
          onClick={() => setSpeaker({ i, text: pickCityVoice(company, game.macro.phase) })}
        />
      ))}

      {company.visitor && <VisitorAgent visitor={company.visitor} half={half} />}

      <OrbitControls
        enablePan={false}
        minDistance={n * 0.9}
        maxDistance={n * 2.4}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.4}
        autoRotate={overview}
        autoRotateSpeed={0.6}
        target={[0, 0.3, 0]}
      />
    </>
  );
}

/* ── main component ──────────────────────────────────────────────────────── */
export function CompanyMap3D({
  game, company, readOnly = false, overview = false,
}: {
  game: GameState; company: Company; readOnly?: boolean; overview?: boolean;
}) {
  const build = useGameStore((s) => s.build);
  const upgrade = useGameStore((s) => s.upgrade);
  const [selectedType, setSelectedType] = useState<BuildingType | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const n = game.config.mapSize;

  const onCell = (gx: number, gy: number) => {
    if (readOnly) return;
    const existing = company.buildings.find((b) => b.x === gx && b.y === gy);
    if (existing) {
      setSelectedBuildingId(existing.id === selectedBuildingId ? null : existing.id);
      setSelectedType(null);
    } else if (selectedType) {
      build(selectedType, gx, gy);
      setSelectedType(null);
    }
  };

  const inspected = company.buildings.find((b) => b.id === selectedBuildingId);

  return (
    <div className="space-y-3">
      <div
        className="overflow-hidden rounded-2xl"
        style={{ height: overview ? 260 : 420, background: PHASE_BG[game.macro.phase] ?? PHASE_BG.normal }}
      >
        <Canvas
          shadows
          dpr={[1, 1.8]}
          camera={{ position: [n * 1.1, n * 1.1, n * 1.3], fov: 38 }}
        >
          <color attach="background" args={[PHASE_BG[game.macro.phase] ?? PHASE_BG.normal]} />
          <Scene
            game={game}
            company={company}
            readOnly={readOnly}
            overview={overview}
            selectedType={selectedType}
            selectedBuildingId={selectedBuildingId}
            onCell={onCell}
          />
        </Canvas>
      </div>

      {!readOnly && !overview && inspected && (
        <div className="card flex items-center justify-between gap-3 p-3">
          <div className="text-sm">
            <span className="text-lg">{BUILDINGS[inspected.type].emoji}</span>{" "}
            <b className="text-slate-800">{BUILDINGS[inspected.type].name}</b>{" "}
            <span className="text-slate-500">Lv{inspected.level}</span>
            <div className="text-xs text-slate-500">{BUILDINGS[inspected.type].description}</div>
          </div>
          {inspected.level < BUILDINGS[inspected.type].maxLevel ? (
            <button className="btn-primary whitespace-nowrap" onClick={() => upgrade(inspected.id)}>
              업그레이드 · {formatMoney(buildingCostFor(inspected.type, inspected.level + 1))}
            </button>
          ) : (
            <span className="pill bg-slate-100 text-slate-500">최고 레벨</span>
          )}
        </div>
      )}

      {!readOnly && !overview && (
        <div>
          <div className="mb-1 text-xs font-semibold text-slate-500">
            건물을 선택하고 빈 타일을 클릭하세요 · 드래그로 회전, 휠로 확대 · 사람을 누르면 생각이 보여요
          </div>
          <div className="flex flex-wrap gap-2">
            {BUILDING_LIST.filter((d) => game.config.enabledBuildings.includes(d.type)).map((d) => {
              const active = selectedType === d.type;
              const cost = buildingCostFor(d.type, 1);
              const canAfford = company.cash >= cost;
              return (
                <button
                  key={d.type}
                  onClick={() => setSelectedType(active ? null : d.type)}
                  className={`flex flex-col items-center rounded-xl px-3 py-2 ring-2 transition ${
                    active ? "bg-brand-50 ring-brand-500" : "bg-white ring-slate-200 hover:ring-slate-300"
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
      )}
    </div>
  );
}

export default CompanyMap3D;
