import type {
  AssetClass,
  BuildingType,
  Company,
  GameState,
  PlacedBuilding,
} from "./types";
import { BUILDINGS, buildingCostFor } from "./buildings";
import { autoAssignRole } from "./characters";

// Mutating player/AI actions that happen *between* turns (they don't advance
// the clock). Single-sourced so the AI and the human player obey the same rules.

export interface ActionResult {
  ok: boolean;
  error?: string;
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
  const cost = stock.price * shares;
  if (company.cash < cost) return { ok: false, error: "현금이 부족합니다." };
  company.cash -= cost;
  company.portfolio.stocks[targetCompanyId] =
    (company.portfolio.stocks[targetCompanyId] ?? 0) + shares;
  return { ok: true };
}

export function sellStock(
  state: GameState,
  company: Company,
  targetCompanyId: string,
  shares: number,
): ActionResult {
  const held = company.portfolio.stocks[targetCompanyId] ?? 0;
  if (shares <= 0 || shares > held) return { ok: false, error: "보유 수량이 부족합니다." };
  const stock = state.stocks[targetCompanyId];
  if (!stock) return { ok: false, error: "종목을 찾을 수 없습니다." };
  company.cash += stock.price * shares;
  const remaining = held - shares;
  if (remaining > 0) company.portfolio.stocks[targetCompanyId] = remaining;
  else delete company.portfolio.stocks[targetCompanyId];
  return { ok: true };
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
