import type { AssetClass, BuildingType, EventLayer, Level, LevelConfig } from "./types";

// Difficulty presets. A single engine is parameterised by these configs so the
// same simulation can serve elementary, middle/high and university players.

const ALL_ASSETS: AssetClass[] = [
  "deposit",
  "bond",
  "etf",
  "realestate",
  "gold",
  "oil",
  "fx",
  "crypto",
];

const ALL_BUILDINGS: BuildingType[] = [
  "factory",
  "rnd",
  "office",
  "warehouse",
  "store",
  "power",
  "hr",
  "park",
];

const ALL_LAYERS: EventLayer[] = [
  "macro",
  "monetary",
  "geopolitics",
  "intercompany",
  "internal",
  "market",
];

export const LEVEL_CONFIGS: Record<Level, LevelConfig> = {
  elementary: {
    level: "elementary",
    label: "초등학생",
    description: "쉬운 용어와 큰 버튼. 회사를 키우고 주식을 사보며 경제와 친해져요.",
    mapSize: 5,
    instantBuild: true,
    adjacencyBonus: false,
    startingCash: 1_500_000,
    volatility: 0.5,
    eventIntensity: 0.6,
    enabledAssets: ["deposit", "etf"],
    enabledBuildings: ["factory", "store", "office", "park"],
    enabledEventLayers: ["macro", "market", "internal"],
    showAdvancedMetrics: false,
    characterDepth: "simple",
    aiCount: 3,
  },
  middle: {
    level: "middle",
    label: "중·고등학생",
    description: "금리·인플레이션·R&D까지. 경영과 투자 전략을 본격적으로 배워요.",
    mapSize: 6,
    instantBuild: false,
    adjacencyBonus: true,
    startingCash: 1_200_000,
    volatility: 1.0,
    eventIntensity: 1.0,
    enabledAssets: ["deposit", "bond", "etf", "realestate", "gold", "oil"],
    enabledBuildings: ["factory", "rnd", "office", "warehouse", "store", "hr", "park"],
    enabledEventLayers: ["macro", "monetary", "geopolitics", "intercompany", "internal", "market"],
    showAdvancedMetrics: true,
    characterDepth: "roles",
    aiCount: 4,
  },
  university: {
    level: "university",
    label: "대학생·성인",
    description: "재무·부채·환율·암호화폐까지 본격 시뮬레이션. 복합 이벤트가 연쇄적으로 발생합니다.",
    mapSize: 8,
    instantBuild: false,
    adjacencyBonus: true,
    startingCash: 1_000_000,
    volatility: 1.5,
    eventIntensity: 1.4,
    enabledAssets: ALL_ASSETS,
    enabledBuildings: ALL_BUILDINGS,
    enabledEventLayers: ALL_LAYERS,
    showAdvancedMetrics: true,
    characterDepth: "full",
    aiCount: 5,
  },
};

export function getLevelConfig(level: Level): LevelConfig {
  return LEVEL_CONFIGS[level];
}
