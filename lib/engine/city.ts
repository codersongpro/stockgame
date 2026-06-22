import type {
  BuildingType,
  CityDistrictId,
  CityDistrictState,
  CityState,
  Company,
  GameState,
  Level,
  PlacedBuilding,
} from "./types";

const DISTRICT_BUILDINGS: Record<CityDistrictId, BuildingType[]> = {
  production: ["factory", "power"],
  research: ["rnd", "lab"],
  commerce: ["store", "office"],
  welfare: ["hr", "park", "cafeteria", "dorm", "gym", "daycare", "clinic"],
  logistics: ["warehouse"],
  finance: ["office"],
};

const DISTRICT_LABELS: Record<CityDistrictId, string> = {
  production: "생산 구역",
  research: "연구 구역",
  commerce: "상점 구역",
  welfare: "복지 구역",
  logistics: "물류 구역",
  finance: "금융 구역",
};

const LEVEL_UNLOCKS: Record<Level, CityDistrictId[]> = {
  elementary_low: ["production", "commerce", "welfare"],
  elementary_mid: ["production", "commerce", "welfare", "logistics"],
  elementary_high: ["production", "research", "commerce", "welfare", "logistics"],
  middle: ["production", "research", "commerce", "welfare", "logistics"],
  high: ["production", "research", "commerce", "welfare", "logistics", "finance"],
  adult: ["production", "research", "commerce", "welfare", "logistics", "finance"],
};

export function createCityState(level: Level, company?: Company): CityState {
  const unlockedDistrictIds = LEVEL_UNLOCKS[level];
  const districts = Object.fromEntries(
    (Object.keys(DISTRICT_BUILDINGS) as CityDistrictId[]).map((id) => [
      id,
      calculateDistrict(id, unlockedDistrictIds.includes(id), company?.buildings ?? []),
    ]),
  ) as Record<CityDistrictId, CityDistrictState>;

  return {
    unlockedDistrictIds,
    districts,
    satisfaction: calculateSatisfaction(districts),
  };
}

export function updateCityState(game: GameState): CityState {
  const player = game.companies.find((company) => company.id === game.playerCompanyId);
  game.city = createCityState(game.level, player);
  return game.city;
}

export function cityBonusFor(game: GameState, districtId: CityDistrictId): number {
  return game.city?.districts[districtId]?.bonus ?? 0;
}

export function cityTurnEffects(game: GameState): {
  productionBonus: number;
  qualityBonus: number;
  commerceBonus: number;
  moraleBonus: number;
  safetyBonus: number;
  financeBonus: number;
} {
  return {
    productionBonus: cityBonusFor(game, "production"),
    qualityBonus: cityBonusFor(game, "research"),
    commerceBonus: cityBonusFor(game, "commerce"),
    moraleBonus: cityBonusFor(game, "welfare"),
    safetyBonus: cityBonusFor(game, "welfare"),
    financeBonus: cityBonusFor(game, "finance"),
  };
}

function calculateDistrict(
  id: CityDistrictId,
  unlocked: boolean,
  buildings: PlacedBuilding[],
): CityDistrictState {
  const types = new Set(DISTRICT_BUILDINGS[id]);
  const districtBuildings = buildings.filter(
    (building) => building.turnsLeft <= 0 && types.has(building.type),
  );
  const buildingCount = districtBuildings.length;
  const synergy = countAdjacencySynergy(districtBuildings);
  const level = !unlocked ? 0 : Math.min(5, buildingCount + synergy);
  const bonus = !unlocked ? 0 : Math.min(0.25, level * 0.03 + synergy * 0.02);

  return {
    id,
    label: DISTRICT_LABELS[id],
    unlocked,
    level,
    buildingCount,
    synergy,
    bonus,
  };
}

function countAdjacencySynergy(buildings: PlacedBuilding[]): number {
  let count = 0;
  for (let i = 0; i < buildings.length; i++) {
    for (let j = i + 1; j < buildings.length; j++) {
      const a = buildings[i];
      const b = buildings[j];
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1) count += 1;
    }
  }
  return count;
}

function calculateSatisfaction(districts: Record<CityDistrictId, CityDistrictState>): number {
  const active = Object.values(districts).filter((district) => district.unlocked);
  if (active.length === 0) return 50;
  const score = active.reduce((sum, district) => sum + district.level * 10 + district.synergy * 5, 50);
  return Math.max(0, Math.min(100, Math.round(score / active.length)));
}
