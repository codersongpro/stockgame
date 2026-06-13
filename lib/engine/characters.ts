import type { Character, CharacterRole, Company } from "./types";
import { CHARACTERS } from "../data/characters";
import { type RngState, shuffle, nextInt, nextFloat } from "./rng";

// Hiring, role bonuses and loyalty/poaching for the talent system.

export const ROLE_LABELS: Record<CharacterRole, string> = {
  ceo: "대표(CEO)",
  cto: "기술총괄(CTO)",
  cmo: "마케팅총괄(CMO)",
  cfo: "재무총괄(CFO)",
  coo: "운영총괄(COO)",
  chro: "인사총괄(CHRO)",
};

/** Build the initial talent pool (a shuffled subset of the catalog). */
export function buildTalentPool(rng: RngState, size: number): Character[] {
  return shuffle(rng, CHARACTERS)
    .slice(0, Math.min(size, CHARACTERS.length))
    .map((c) => ({ ...c }));
}

export interface RoleBonuses {
  productionEfficiency: number;
  rndPower: number;
  marketingMult: number;
  financeCostMult: number; // <1 reduces interest/marketing waste
  moraleAdd: number;
  reputationAdd: number;
  investReturnAdd: number; // extra fraction on investment gains
  safetyAdd: number;
}

const ZERO_BONUS: RoleBonuses = {
  productionEfficiency: 0,
  rndPower: 0,
  marketingMult: 1,
  financeCostMult: 1,
  moraleAdd: 0,
  reputationAdd: 0,
  investReturnAdd: 0,
  safetyAdd: 0,
};

/** Compute aggregate bonuses from a company's hired+assigned characters. */
export function roleBonuses(company: Company): RoleBonuses {
  const b: RoleBonuses = { ...ZERO_BONUS };
  for (const ch of company.hired) {
    if (!ch.role) continue;
    const s = ch.stats;
    const loyalty = (ch.loyalty ?? 70) / 100;
    const eff = loyalty; // disloyal staff underperform

    switch (ch.role) {
      case "coo":
        b.productionEfficiency += (s.management / 1000) * eff;
        break;
      case "cto":
        b.rndPower += (s.tech / 6) * eff;
        break;
      case "cmo":
        b.marketingMult += (s.marketing / 400) * eff;
        break;
      case "cfo":
        b.financeCostMult -= (s.finance / 1200) * eff;
        b.investReturnAdd += (s.finance / 2500) * eff;
        break;
      case "chro":
        b.moraleAdd += (s.leadership / 20) * eff;
        break;
      case "ceo":
        b.reputationAdd += (s.leadership / 40) * eff;
        b.marketingMult += (s.marketing / 1500) * eff;
        b.productionEfficiency += (s.management / 4000) * eff;
        break;
    }

    // Trait bonuses.
    switch (ch.trait) {
      case "innovator":
        b.rndPower += 4 * eff;
        break;
      case "rainmaker":
        b.marketingMult += 0.08 * eff;
        break;
      case "investor":
        b.investReturnAdd += 0.05 * eff;
        break;
      case "negotiator":
        b.financeCostMult -= 0.04 * eff;
        break;
      case "operator":
        b.productionEfficiency += 0.03 * eff;
        break;
      case "motivator":
        b.moraleAdd += 4 * eff;
        break;
      case "guardian":
        b.safetyAdd += 5 * eff;
        b.reputationAdd += 1 * eff;
        break;
      case "trendspotter":
        b.marketingMult += 0.04 * eff;
        break;
      case "visionary":
        b.reputationAdd += 2 * eff;
        b.rndPower += 2 * eff;
        b.marketingMult += 0.03 * eff;
        break;
      case "eager":
        b.productionEfficiency += 0.01 * eff;
        break;
    }
  }
  b.financeCostMult = Math.max(0.6, b.financeCostMult);
  return b;
}

/** Total per-turn salary for hired staff. */
export function totalSalary(company: Company): number {
  return company.hired.reduce((s, c) => s + c.salary, 0);
}

/**
 * Update loyalty each turn based on whether the company can pay and morale.
 * Returns characters who quit (loyalty hit zero).
 */
export function updateLoyalty(
  company: Company,
  canPay: boolean,
  rng: RngState,
): Character[] {
  const quit: Character[] = [];
  for (const ch of company.hired) {
    let loyalty = ch.loyalty ?? 70;
    loyalty += canPay ? 1.5 : -12;
    loyalty += (company.morale - 60) / 20;
    loyalty = Math.max(0, Math.min(100, loyalty));
    ch.loyalty = loyalty;
    if (loyalty <= 0 && nextFloat(rng) < 0.5) quit.push(ch);
  }
  if (quit.length) {
    company.hired = company.hired.filter((c) => !quit.includes(c));
  }
  return quit;
}

/** Assign the best free role to a freshly hired character. */
export function autoAssignRole(company: Company, ch: Character): void {
  const taken = new Set(company.hired.map((c) => c.role).filter(Boolean));
  if (!taken.has(ch.preferredRole)) {
    ch.role = ch.preferredRole;
    return;
  }
  const order: CharacterRole[] = ["coo", "cto", "cmo", "cfo", "chro", "ceo"];
  ch.role = order.find((r) => !taken.has(r)) ?? ch.preferredRole;
}

/** Refresh the talent pool with a couple of new faces. */
export function refreshTalentPool(
  pool: Character[],
  hiredIds: Set<string>,
  rng: RngState,
): Character[] {
  const available = CHARACTERS.filter(
    (c) => !hiredIds.has(c.id) && !pool.some((p) => p.id === c.id),
  );
  if (!available.length) return pool;
  const additions = shuffle(rng, available).slice(0, nextInt(rng, 1, 2));
  return [...pool, ...additions.map((c) => ({ ...c }))];
}
