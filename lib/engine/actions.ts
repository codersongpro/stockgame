import type {
  AssetClass,
  BuildingType,
  Company,
  GameState,
  PlacedBuilding,
} from "./types";
import { BUILDINGS, buildingCostFor } from "./buildings";
import { autoAssignRole, generateCharacter } from "./characters";
import { adjustRivalry } from "./relations";
import { shockStock } from "./market";

// Mutating player/AI actions that happen *between* turns (they don't advance
// the clock). Single-sourced so the AI and the human player obey the same rules.

export interface ActionResult {
  ok: boolean;
  error?: string;
  /** Realized profit/loss on a stock sale (current proceeds − cost basis). */
  realized?: number;
  /** Cash refunded when demolishing/selling a building. */
  refund?: number;
}

/** Average purchase price per share for a held stock (0 if none / unknown). */
export function avgCost(company: Company, targetCompanyId: string): number {
  const shares = company.portfolio.stocks[targetCompanyId] ?? 0;
  if (shares <= 0) return 0;
  const basis = company.portfolio.stockCost?.[targetCompanyId] ?? 0;
  return basis / shares;
}

let buildingCounter = 0;

export function findCompany(state: GameState, id: string): Company | undefined {
  return state.companies.find((c) => c.id === id);
}

/** First empty grid cell (row-major), or null if the map is full. */
export function emptyCell(
  company: Company,
  mapSize: number,
): { x: number; y: number } | null {
  const occupied = new Set(company.buildings.map((b) => `${b.x},${b.y}`));
  for (let y = 0; y < mapSize; y++) {
    for (let x = 0; x < mapSize; x++) {
      if (!occupied.has(`${x},${y}`)) return { x, y };
    }
  }
  return null;
}

export function buildBuilding(
  state: GameState,
  company: Company,
  type: BuildingType,
  x: number,
  y: number,
): ActionResult {
  if (!state.config.enabledBuildings.includes(type)) {
    return { ok: false, error: "이 레벨에서는 사용할 수 없는 건물입니다." };
  }
  const max = state.config.mapSize;
  if (x < 0 || y < 0 || x >= max || y >= max) {
    return { ok: false, error: "맵 범위를 벗어났습니다." };
  }
  if (company.buildings.some((b) => b.x === x && b.y === y)) {
    return { ok: false, error: "이미 건물이 있는 칸입니다." };
  }
  const cost = buildingCostFor(type, 1);
  if (company.cash < cost) return { ok: false, error: "현금이 부족합니다." };

  company.cash -= cost;
  const building: PlacedBuilding = {
    id: `b-${buildingCounter++}`,
    type,
    level: 1,
    x,
    y,
    turnsLeft: state.config.instantBuild ? 0 : BUILDINGS[type].buildTurns,
  };
  company.buildings.push(building);
  return { ok: true };
}

/** Demolish/sell a building, refunding part of its construction cost. */
export function sellBuilding(
  state: GameState,
  company: Company,
  buildingId: string,
): ActionResult {
  const idx = company.buildings.findIndex((b) => b.id === buildingId);
  if (idx < 0) return { ok: false, error: "건물을 찾을 수 없습니다." };
  const b = company.buildings[idx];
  // Refund 50% of the total spent across all of its levels.
  let spent = 0;
  for (let lvl = 1; lvl <= b.level; lvl++) spent += buildingCostFor(b.type, lvl);
  const refund = Math.round(spent * 0.5);
  company.cash += refund;
  company.buildings.splice(idx, 1);
  return { ok: true, refund };
}

/** Building-specific one-off management actions (cost → stat boost). */
interface CompanyActionDef {
  label: string;
  cost: number;
  apply: (company: Company) => void;
}
const clamp01 = (v: number) => Math.max(0, Math.min(100, v));
export const COMPANY_ACTIONS: Record<string, CompanyActionDef> = {
  inspect: { label: "라인 점검", cost: 40_000, apply: (c) => { c.safety = clamp01(c.safety + 7); } },
  research: { label: "집중 연구", cost: 60_000, apply: (c) => { c.quality = clamp01(c.quality + 5); } },
  promo: { label: "프로모션", cost: 50_000, apply: (c) => { c.reputation = clamp01(c.reputation + 5); } },
  training: { label: "직원 교육", cost: 50_000, apply: (c) => { c.morale = clamp01(c.morale + 5); c.quality = clamp01(c.quality + 2); } },
  welfare: {
    label: "복지 강화", cost: 40_000,
    apply: (c) => {
      c.morale = clamp01(c.morale + 6);
      for (const h of c.hired) h.loyalty = Math.min(100, (h.loyalty ?? 70) + 6);
    },
  },
};

/** Player-initiated cooperation with another company (from the visit screen). */
interface DealDef { label: string; cost: number; }
export const DEALS: Record<string, DealDef> = {
  partner: { label: "전략적 제휴", cost: 120_000 },
  license: { label: "기술 제휴", cost: 150_000 },
  comarket: { label: "공동 마케팅", cost: 100_000 },
  scout: { label: "인재 스카우트", cost: 200_000 },
};

export function proposeDeal(
  state: GameState,
  company: Company,
  targetCompanyId: string,
  dealId: string,
): ActionResult {
  const def = DEALS[dealId];
  if (!def) return { ok: false, error: "알 수 없는 제안입니다." };
  const target = findCompany(state, targetCompanyId);
  if (!target || target.id === company.id) return { ok: false, error: "대상 회사를 찾을 수 없습니다." };
  if (company.cash < def.cost) return { ok: false, error: "현금이 부족합니다." };

  company.cash -= def.cost;
  const bump = (c: Company, q = 0, r = 0) => {
    c.quality = Math.min(100, c.quality + q);
    c.reputation = Math.min(100, c.reputation + r);
  };
  switch (dealId) {
    case "partner":
      adjustRivalry(state.relations, company.id, targetCompanyId, -0.25);
      shockStock(state.stocks, company.id, 0.02);
      shockStock(state.stocks, targetCompanyId, 0.02);
      bump(company, 0, 3);
      break;
    case "license":
      adjustRivalry(state.relations, company.id, targetCompanyId, -0.1);
      bump(company, 5, 1);
      shockStock(state.stocks, company.id, 0.02);
      break;
    case "comarket":
      adjustRivalry(state.relations, company.id, targetCompanyId, -0.15);
      bump(company, 0, 4);
      shockStock(state.stocks, company.id, 0.02);
      shockStock(state.stocks, targetCompanyId, 0.01);
      break;
    case "scout": {
      const cand = generateCharacter(state.rng, "epic");
      state.talentPool = [cand, ...state.talentPool];
      adjustRivalry(state.relations, company.id, targetCompanyId, 0.2);
      break;
    }
  }
  return { ok: true };
}

export function applyCompanyAction(
  _state: GameState,
  company: Company,
  actionId: string,
): ActionResult {
  const def = COMPANY_ACTIONS[actionId];
  if (!def) return { ok: false, error: "알 수 없는 활동입니다." };
  if (company.cash < def.cost) return { ok: false, error: "현금이 부족합니다." };
  company.cash -= def.cost;
  def.apply(company);
  return { ok: true };
}

export function upgradeBuilding(
  state: GameState,
  company: Company,
  buildingId: string,
): ActionResult {
  const b = company.buildings.find((x) => x.id === buildingId);
  if (!b) return { ok: false, error: "건물을 찾을 수 없습니다." };
  const def = BUILDINGS[b.type];
  if (b.level >= def.maxLevel) return { ok: false, error: "이미 최고 레벨입니다." };
  const cost = buildingCostFor(b.type, b.level + 1);
  if (company.cash < cost) return { ok: false, error: "현금이 부족합니다." };
  company.cash -= cost;
  b.level += 1;
  if (!state.config.instantBuild) b.turnsLeft = Math.max(b.turnsLeft, 1);
  return { ok: true };
}

export function hireCharacter(
  state: GameState,
  company: Company,
  characterId: string,
): ActionResult {
  const idx = state.talentPool.findIndex((c) => c.id === characterId);
  if (idx < 0) return { ok: false, error: "인재를 찾을 수 없습니다." };
  const character = state.talentPool[idx];
  const signingBonus = character.salary; // one-off hiring fee
  if (company.cash < signingBonus) return { ok: false, error: "영입 비용이 부족합니다." };

  company.cash -= signingBonus;
  const hired = { ...character, loyalty: 75 };
  autoAssignRole(company, hired);
  company.hired.push(hired);
  state.talentPool.splice(idx, 1);
  return { ok: true };
}

/** Dismiss a hired employee. Costs severance and dents morale/reputation. */
export function fireCharacter(
  _state: GameState,
  company: Company,
  characterId: string,
): ActionResult {
  const idx = company.hired.findIndex((c) => c.id === characterId);
  if (idx < 0) return { ok: false, error: "해당 직원을 찾을 수 없습니다." };
  const severance = Math.round(company.hired[idx].salary); // one-off payout
  if (company.cash < severance) return { ok: false, error: "퇴직금을 지급할 현금이 부족합니다." };

  company.cash -= severance;
  company.hired.splice(idx, 1);
  company.morale = Math.max(0, company.morale - 5);
  company.reputation = Math.max(0, company.reputation - 2);
  return { ok: true };
}

export function buyStock(
  state: GameState,
  company: Company,
  targetCompanyId: string,
  shares: number,
): ActionResult {
  if (shares <= 0) return { ok: false, error: "수량을 확인하세요." };
  if (targetCompanyId === company.id) {
    return { ok: false, error: "자기 회사 주식은 살 수 없습니다." };
  }
  const stock = state.stocks[targetCompanyId];
  if (!stock) return { ok: false, error: "종목을 찾을 수 없습니다." };
  const alreadyHeld = company.portfolio.stocks[targetCompanyId] ?? 0;
  const float = stock.sharesOutstanding - (stock.treasury ?? 0); // tradable free float
  const maxBuyable = float - alreadyHeld;
  if (maxBuyable <= 0) return { ok: false, error: "유통 물량을 모두 보유 중입니다." };
  const actualShares = Math.min(shares, maxBuyable);
  const cost = stock.price * actualShares;
  if (company.cash < cost) return { ok: false, error: "현금이 부족합니다." };
  company.cash -= cost;
  company.portfolio.stocks[targetCompanyId] = alreadyHeld + actualShares;
  // Track cost basis for average-price / realized-P&L display.
  if (!company.portfolio.stockCost) company.portfolio.stockCost = {};
  company.portfolio.stockCost[targetCompanyId] =
    (company.portfolio.stockCost[targetCompanyId] ?? 0) + cost;
  return { ok: true };
}

export function sellStock(
  state: GameState,
  company: Company,
  targetCompanyId: string,
  shares: number,
): ActionResult {
  const held = company.portfolio.stocks[targetCompanyId] ?? 0;
  if (shares <= 0 || held <= 0) return { ok: false, error: "보유 수량이 부족합니다." };
  const sellShares = Math.min(shares, held); // never sell more than held
  const stock = state.stocks[targetCompanyId];
  if (!stock) return { ok: false, error: "종목을 찾을 수 없습니다." };

  const proceeds = stock.price * sellShares;
  const basis = company.portfolio.stockCost?.[targetCompanyId] ?? 0;
  const costOfSold = held > 0 ? basis * (sellShares / held) : 0;
  const realized = proceeds - costOfSold;

  company.cash += proceeds;
  const remaining = held - sellShares;
  if (remaining > 0) {
    company.portfolio.stocks[targetCompanyId] = remaining;
    if (company.portfolio.stockCost) company.portfolio.stockCost[targetCompanyId] = basis - costOfSold;
  } else {
    delete company.portfolio.stocks[targetCompanyId];
    if (company.portfolio.stockCost) delete company.portfolio.stockCost[targetCompanyId];
  }
  return { ok: true, realized };
}

export function buyAsset(
  state: GameState,
  company: Company,
  assetClass: AssetClass,
  units: number,
): ActionResult {
  if (units <= 0) return { ok: false, error: "수량을 확인하세요." };
  if (!state.config.enabledAssets.includes(assetClass)) {
    return { ok: false, error: "이 레벨에서는 거래할 수 없는 자산입니다." };
  }
  const asset = state.assets[assetClass];
  const cost = asset.price * units;
  if (company.cash < cost) return { ok: false, error: "현금이 부족합니다." };
  company.cash -= cost;
  company.portfolio.assets[assetClass] =
    (company.portfolio.assets[assetClass] ?? 0) + units;
  return { ok: true };
}

export function sellAsset(
  state: GameState,
  company: Company,
  assetClass: AssetClass,
  units: number,
): ActionResult {
  const held = company.portfolio.assets[assetClass] ?? 0;
  if (units <= 0 || units > held) return { ok: false, error: "보유 수량이 부족합니다." };
  const asset = state.assets[assetClass];
  company.cash += asset.price * units;
  const remaining = held - units;
  if (remaining > 0) company.portfolio.assets[assetClass] = remaining;
  else delete company.portfolio.assets[assetClass];
  return { ok: true };
}

/** Take on debt to raise cash. */
export function takeLoan(company: Company, amount: number): ActionResult {
  if (amount <= 0) return { ok: false, error: "금액을 확인하세요." };
  company.cash += amount;
  company.debt += amount;
  return { ok: true };
}

/** Repay outstanding debt from cash. */
export function repayLoan(company: Company, amount: number): ActionResult {
  const pay = Math.min(amount, company.debt, company.cash);
  if (pay <= 0) return { ok: false, error: "상환할 수 없습니다." };
  company.cash -= pay;
  company.debt -= pay;
  return { ok: true };
}
