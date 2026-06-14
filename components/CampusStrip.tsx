"use client";

import type { PlacedBuilding, BuildingType } from "@/lib/engine";
import { BUILDING_IMG } from "@/lib/assetMap";

// A lightweight 2D "company skyline" — a decorative row of the company's own
// building art, bottom-aligned. Purely ornamental (pointer-events-none); the
// interactive campus is the 3D CompanyCity. Falls back to a representative set
// when the company has no recognizable buildings yet.
const FALLBACK: BuildingType[] = ["office", "factory", "rnd", "store"];

export function CampusStrip({
  buildings,
  className = "",
  max = 6,
  opacity = 0.9,
}: {
  buildings?: PlacedBuilding[];
  className?: string;
  max?: number;
  opacity?: number;
}) {
  // Collect distinct building types that have art, in placement order.
  const seen = new Set<BuildingType>();
  const types: BuildingType[] = [];
  for (const b of buildings ?? []) {
    if (b.turnsLeft > 0) continue; // skip under-construction
    if (seen.has(b.type) || !BUILDING_IMG[b.type]) continue;
    seen.add(b.type);
    types.push(b.type);
    if (types.length >= max) break;
  }
  const list = (types.length ? types : FALLBACK).slice(0, max);

  return (
    <div
      className={`pointer-events-none flex items-end justify-center gap-1 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden
    >
      {list.map((t, i) => (
        <img
          key={`${t}-${i}`}
          src={BUILDING_IMG[t]}
          alt=""
          className="h-full w-auto object-contain"
          style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.18))" }}
        />
      ))}
    </div>
  );
}
