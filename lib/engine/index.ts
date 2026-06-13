import type {
  Company,
  GameState,
  Level,
  PlacedBuilding,
} from "./types";
import { createRng, nextRange, type RngState } from "./rng";
import { getLevelConfig } from "./levels";
import { getIndustry, INDUSTRIES } from "../data/industries";
import { getCountry } from "../data/countries";
import { COMPANY_PRESETS, PRESET_MAP, type CompanyPreset } from "../data/companyPresets";
import { createMacro } from "./economy";
import { createStocks } from "./market";
import { createAssets } from "./assets";
import { buildTalentPool } from "./characters";
import { createRelations } from "./relations";
import { defaultDecisions } from "./company";
import { shuffle } from "./rng";
import { recordNetWorth } from "./ranking";

export const GAME_VERSION = 1;
export const DEFAULT_MAX_TURNS = 24;

export interface NewGameOptions {
  level: Level;
  seed?: number;
  playerCompanyName: string;
  industryId: string;
  countryId: string;
  logoColor?: string;
  basedOn?: string; // preset id
  maxTurns?: number;
}

let companyCounter = 0;

/** Pick `count` presets with at most one per industry (guaranteed diversity). */
function selectDiversePresets(
  rng: RngState,
  presets: CompanyPreset[],
  excludeId: string | undefined,
  count: number,
): CompanyPreset[] {
  const pool = presets.filter((p) => p.id !== excludeId);
  const byIndustry = new Map<string, CompanyPreset[]>();
  for (const p of pool) {
    if (!byIndustry.has(p.industryId)) byIndustry.set(p.industryId, []);
    byIndustry.get(p.industryId)!.push(p);
  }
  const industries = shuffle(rng, [...byIndustry.keys()]);
  const picked: CompanyPreset[] = [];
  for (const ind of industries) {
    if (picked.length >= count) break;
    picked.push(shuffle(rng, byIndustry.get(ind)!)[0]);
  }
  return picked;
}

function starterBuildings(instant: boolean): PlacedBuilding[] {
  const mk = (type: PlacedBuilding["type"], x: number, y: number): PlacedBuilding => ({
    id: `start-${companyCounter}-${type}`,
    type,
    level: 1,
    x,
    y,
    turnsLeft: 0, // starter buildings are operational immediately
  });
  void instant;
  return [mk("factory", 0, 0), mk("office", 1, 0)];
}

function makeCompany(opts: {
  name: string;
  industryId: string;
  countryId: string;
  logoColor: string;
  isPlayer: boolean;
  cash: number;
  scale: number;
  instant: boolean;
  basedOn?: string;
}): Company {
  const id = `co-${companyCounter++}`;
  const industry = getIndustry(opts.industryId);
  return {
    id,
    name: opts.name,
    logoColor: opts.logoColor,
    industryId: opts.industryId,
    countryId: opts.countryId,
    isPlayer: opts.isPlayer,
    isAI: !opts.isPlayer,
    basedOn: opts.basedOn,

    cash: Math.round(opts.cash),
    debt: 0,
    inventory: 0,
    employees: 10,
    reputation: Math.min(70, 45 + opts.scale * 8),
    morale: 60,
    quality: Math.min(60, 15 + opts.scale * 8),
    safety: 60,

    decisions: defaultDecisions(industry),
    buildings: starterBuildings(opts.instant),
    hired: [],

    lastRevenue: 0,
    lastProfit: 0,
    profitHistory: [],
    netWorthHistory: [],

    portfolio: { stocks: {}, assets: {} },
  };
}

export function createGame(opts: NewGameOptions): GameState {
  companyCounter = 0;
  const config = getLevelConfig(opts.level);
  const seed = opts.seed ?? Math.floor(Math.random() * 1_000_000) + 1;
  const rng = createRng(seed);

  const playerColor = opts.logoColor ?? "#6366f1";
  const playerScale = opts.basedOn ? PRESET_MAP[opts.basedOn]?.scale ?? 1 : 1;

  const player = makeCompany({
    name: opts.playerCompanyName || "내 회사",
    industryId: opts.industryId,
    countryId: opts.countryId,
    logoColor: playerColor,
    isPlayer: true,
    cash: config.startingCash * playerScale,
    scale: playerScale,
    instant: config.instantBuild,
    basedOn: opts.basedOn,
  });

  // Build AI competitors ensuring one company per industry (diverse competition).
  const aiPresets = selectDiversePresets(rng, COMPANY_PRESETS, opts.basedOn, config.aiCount);

  const aiCompanies: Company[] = aiPresets.map((p) =>
    makeCompany({
      name: p.name,
      industryId: p.industryId,
      countryId: p.countryId,
      logoColor: p.logoColor,
      isPlayer: false,
      cash: config.startingCash * p.scale * nextRange(rng, 0.85, 1.15),
      scale: p.scale,
      instant: config.instantBuild,
      basedOn: p.id,
    }),
  );

  // Fall back to random industries if there aren't enough presets.
  while (aiCompanies.length < config.aiCount) {
    const ind = INDUSTRIES[aiCompanies.length % INDUSTRIES.length];
    aiCompanies.push(
      makeCompany({
        name: `${ind.name} 컴퍼니 ${aiCompanies.length + 1}`,
        industryId: ind.id,
        countryId: "us",
        logoColor: "#888888",
        isPlayer: false,
        cash: config.startingCash * nextRange(rng, 0.85, 1.15),
        scale: 1,
        instant: config.instantBuild,
      }),
    );
  }

  const companies = [player, ...aiCompanies];

  const state: GameState = {
    version: GAME_VERSION,
    seed,
    rng,
    level: opts.level,
    config,
    turn: 0,
    maxTurns: opts.maxTurns ?? DEFAULT_MAX_TURNS,
    status: "playing",
    macro: createMacro(getCountry(opts.countryId), rng),
    companies,
    playerCompanyId: player.id,
    stocks: createStocks(companies),
    assets: createAssets(),
    talentPool: buildTalentPool(rng, 8),
    relations: createRelations(companies),
    news: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  recordNetWorth(state);
  return state;
}

// Re-exports for convenient importing from the UI layer.
export * from "./types";
export { advanceTurn } from "./tick";
export { rankings, netWorth, portfolioValue, playerRank } from "./ranking";
export { fundamentalValue } from "./market";
export { LEVEL_CONFIGS, getLevelConfig } from "./levels";
export { PHASE_LABELS, PHASE_EMOJI } from "./economy";
export { LAYER_LABELS } from "./events";
export { BUILDINGS, BUILDING_LIST, buildingCostFor } from "./buildings";
export { ROLE_LABELS, roleBonuses } from "./characters";
export {
  productionCapacity,
  estimateDemand,
  defaultDecisions,
} from "./company";
export * from "./actions";
