import type { Company, RelationState } from "./types";
import { COUNTRIES } from "../data/countries";

// Tracks rivalry between companies and tension between countries. These scores
// nudge event probabilities (rivals are more likely to clash, tense countries
// to impose tariffs, etc.) and decay gently toward neutral over time.

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function createRelations(companies: Company[]): RelationState {
  const companyRivalry: Record<string, number> = {};
  for (let i = 0; i < companies.length; i++) {
    for (let j = i + 1; j < companies.length; j++) {
      // Same-industry companies start as mild rivals.
      const rivalry =
        companies[i].industryId === companies[j].industryId ? 0.3 : 0;
      companyRivalry[pairKey(companies[i].id, companies[j].id)] = rivalry;
    }
  }

  const countryTension: Record<string, number> = {};
  for (let i = 0; i < COUNTRIES.length; i++) {
    for (let j = i + 1; j < COUNTRIES.length; j++) {
      countryTension[pairKey(COUNTRIES[i].id, COUNTRIES[j].id)] = 0;
    }
  }

  return { companyRivalry, countryTension };
}

export function getRivalry(rel: RelationState, a: string, b: string): number {
  return rel.companyRivalry[pairKey(a, b)] ?? 0;
}

export function adjustRivalry(rel: RelationState, a: string, b: string, delta: number): void {
  const k = pairKey(a, b);
  rel.companyRivalry[k] = clamp((rel.companyRivalry[k] ?? 0) + delta, -1, 1);
}

export function getTension(rel: RelationState, a: string, b: string): number {
  return rel.countryTension[pairKey(a, b)] ?? 0;
}

export function adjustTension(rel: RelationState, a: string, b: string, delta: number): void {
  if (a === b) return;
  const k = pairKey(a, b);
  rel.countryTension[k] = clamp((rel.countryTension[k] ?? 0) + delta, -1, 1);
}

/** Gentle decay toward neutral each turn. */
export function decayRelations(rel: RelationState): void {
  for (const k of Object.keys(rel.companyRivalry)) {
    rel.companyRivalry[k] *= 0.95;
  }
  for (const k of Object.keys(rel.countryTension)) {
    rel.countryTension[k] *= 0.93;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
