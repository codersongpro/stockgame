// Central type contract for the Unicorn City simulation engine.
// Pure data only — no React, no DB. The same types are used by single-player
// (browser) and multiplayer (server-authoritative) code.

import type { RngState } from "./rng";

export type Level =
  | "elementary_low"
  | "elementary_mid"
  | "elementary_high"
  | "middle"
  | "high"
  | "adult";

// ---------------------------------------------------------------------------
// Macro economy
// ---------------------------------------------------------------------------

export type EconomyPhase =
  | "boom"
  | "normal"
  | "recession"
  | "inflation"
  | "deflation"
  | "stagflation";

export interface MacroState {
  phase: EconomyPhase;
  gdpGrowth: number; // %
  inflation: number; // %
  interestRate: number; // central-bank policy rate, %
  sentiment: number; // market mood, -1..1
  phaseTurnsLeft: number; // turns until the current phase may shift
}

// ---------------------------------------------------------------------------
// Static catalog definitions (industries / countries / buildings / characters)
// ---------------------------------------------------------------------------

export interface IndustryDef {
  id: string;
  name: string;
  emoji: string;
  startCapital: number;
  unitCost: number; // base production cost per unit
  basePrice: number; // base selling price per unit
  baseDemand: number; // units demanded at base price
  demandElasticity: number; // how strongly price affects demand
  volatility: number; // stock-price volatility multiplier
  rndDependence: number; // 0..1, how much R&D matters
  trend: number; // baseline drift bias
  /** Event tag -> impact multiplier for this industry. */
  sensitivities: Record<string, number>;
  modern?: boolean; // cutting-edge theme industry (AI/space/robot...)
}

export interface CountryDef {
  id: string;
  name: string;
  flag: string;
  currency: string;
  centralBank: string;
  baseGrowth: number;
  baseInflation: number;
  baseRate: number;
  taxRate: number; // 0..1
  laborCost: number; // multiplier around 1.0
  marketSize: number; // demand multiplier around 1.0
  regulation: number; // 0..1
}

export type BuildingType =
  | "factory"
  | "rnd"
  | "office"
  | "warehouse"
  | "store"
  | "power"
  | "hr"
  | "park"
  | "cafeteria"
  | "dorm"
  | "gym"
  | "daycare"
  | "clinic"
  | "lab";

export interface CompanyCapabilities {
  productionCapacity: number;
  productionEfficiency: number; // 0..1 cost reduction
  rndPower: number;
  marketingReach: number;
  logistics: number;
  hiringCap: number;
  morale: number;
  reputation: number;
}

export interface BuildingDef {
  type: BuildingType;
  name: string;
  emoji: string;
  cost: number;
  buildTurns: number;
  upkeep: number;
  maxLevel: number;
  /** Capability contribution per building level. */
  effects: Partial<CompanyCapabilities>;
  description: string;
}

export interface PlacedBuilding {
  id: string;
  type: BuildingType;
  level: number; // 1..maxLevel
  x: number;
  y: number;
  turnsLeft: number; // construction turns remaining; 0 = operational
}

export type CharacterRole = "ceo" | "cto" | "cmo" | "cfo" | "coo" | "chro";

export interface CharacterStats {
  management: number;
  tech: number;
  creativity: number;
  finance: number;
  leadership: number;
  marketing: number;
}

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Character {
  id: string;
  name: string;
  avatar: string; // emoji
  preferredRole: CharacterRole;
  stats: CharacterStats;
  trait: string; // trait id
  traitName: string;
  traitDesc: string;
  rarity: Rarity;
  salary: number; // per turn
  role?: CharacterRole; // assigned role once hired
  loyalty?: number; // 0..100 once hired
}

// ---------------------------------------------------------------------------
// Markets: stocks + other asset classes
// ---------------------------------------------------------------------------

export interface Stock {
  companyId: string;
  price: number;
  history: number[];
  sharesOutstanding: number;
  /** Treasury shares held by the company itself (reduces free float). */
  treasury?: number;
  /** Listings for companies not actively played (presets + extra fictional). */
  external?: boolean;
  name?: string;
  logoColor?: string;
  industryId?: string;
  countryId?: string;
  /** Slowly drifting fundamental baseline used to mean-revert external prices. */
  anchor?: number;
  /** Synthetic baseline return-on-equity for external listings (for PER/PBR/ROE). */
  roeBase?: number;
  /**
   * Investment archetype. Growth stocks swing hard with the economy and rates;
   * dividend stocks are defensive and steady; balanced sit between. Drives how
   * the price reacts to macro conditions and news (see market.tickStocks).
   */
  kind?: StockKind;
  /** Per-turn baseline price support from dividends (0 for growth). */
  dividendYield?: number;
}

export type StockKind = "growth" | "dividend" | "balanced";

export type AssetClass =
  | "bond"
  | "realestate"
  | "gold"
  | "oil"
  | "crypto"
  | "etf"
  | "fx"
  | "deposit";

export interface AssetMarketItem {
  id: AssetClass;
  name: string;
  emoji: string;
  price: number;
  history: number[];
  risk: number; // relative volatility
  desc: string;
}

export interface Portfolio {
  stocks: Record<string, number>; // companyId -> shares held
  /** companyId -> total acquisition cost (cost basis) for average-price display. */
  stockCost?: Record<string, number>;
  assets: Partial<Record<AssetClass, number>>; // assetClass -> units held
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export interface CompanyDecisions {
  price: number; // selling price per unit
  productionTarget: number; // units to attempt to produce
  marketingBudget: number;
  rndBudget: number;
  welfareBudget: number; // raises employee morale
  safetyBudget: number; // raises workplace safety
}

export interface Company {
  id: string;
  name: string;
  logoColor: string;
  /** Unique company icon/mark (emoji), assigned at game creation. */
  mark?: string;
  industryId: string;
  countryId: string;
  isPlayer: boolean;
  isAI: boolean;
  basedOn?: string; // preset id, if modelled on a real company

  cash: number;
  debt: number;
  inventory: number;
  employees: number;
  reputation: number; // 0..100
  morale: number; // 0..100
  quality: number; // product quality / tech level, grows with R&D
  safety: number; // 0..100, affects accident/recall risk

  decisions: CompanyDecisions;
  buildings: PlacedBuilding[];
  hired: Character[];

  lastRevenue: number;
  lastProfit: number;
  profitHistory: number[];
  netWorthHistory: number[];

  portfolio: Portfolio;

  /** Per-product prices. Index matches getIndustryProducts(industryId). */
  productPrices: number[];
  /** Which products the player has chosen to actively sell (index matches productPrices). */
  productEnabled: boolean[];
  /** Per-product unsold inventory (index matches productPrices). */
  productInventory: number[];
  /** True once R&D quality threshold (≥75) has been reached to unlock 4th product. */
  rndUnlockDone: boolean;

  /** A notable visitor currently at the campus (cleared each turn). */
  visitor?: VisitorInfo;

  /** Demand-side factor breakdown from the previous turn, for delta display. */
  lastDemandFactors?: DemandFactorBreakdown;

  /** Consecutive turns spent over the bankruptcy debt threshold (see tick.ts). */
  creditWarningStreak?: number;
}

/**
 * Multiplicative components of a company's demand pull, used both to compute
 * `marketAttractiveness` and to explain turn-over-turn sales swings to the
 * player (see CompanyTurnResult.demandFactors in company.ts).
 */
export interface DemandFactorBreakdown {
  price: number;
  marketing: number;
  quality: number;
  reputation: number;
  share: number;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type EventLayer =
  | "macro"
  | "monetary"
  | "geopolitics"
  | "intercompany"
  | "internal"
  | "market"
  | "visitor";

export type EventTone = "positive" | "negative" | "neutral";

export interface NewsItem {
  id: string;
  turn: number;
  layer: EventLayer;
  tone: EventTone;
  title: string;
  body: string;
  emoji: string;
  /** Large portrait emoji for cut-in style popups (visitors / talent). */
  portrait?: string;
  /** Pixel-art portrait image path (visitor events). */
  portraitImg?: string;
  /** Companies/assets/industries referenced, for UI highlighting. */
  tags: string[];
}

/** A notable outsider visiting a company's campus this quarter. */
export interface VisitorInfo {
  kind: "politician" | "ceo" | "celebrity" | "investor";
  name: string;
  emoji: string;
  turn: number;
  /** Pixel-art portrait image path for 2D UI overlays. */
  portraitImg?: string;
}

// ---------------------------------------------------------------------------
// Relations (between companies and countries)
// ---------------------------------------------------------------------------

export interface RelationState {
  /** "a|b" company-pair key -> rivalry score (-1 ally .. +1 rival). */
  companyRivalry: Record<string, number>;
  /** "a|b" country-pair key -> tension score (-1 allied .. +1 hostile). */
  countryTension: Record<string, number>;
}

// ---------------------------------------------------------------------------
// City and strategy layers
// ---------------------------------------------------------------------------

export type CityDistrictId =
  | "production"
  | "research"
  | "commerce"
  | "welfare"
  | "logistics"
  | "finance";

export interface CityDistrictState {
  id: CityDistrictId;
  label: string;
  unlocked: boolean;
  level: number;
  buildingCount: number;
  synergy: number;
  bonus: number;
}

export interface CityState {
  unlockedDistrictIds: CityDistrictId[];
  districts: Record<CityDistrictId, CityDistrictState>;
  satisfaction: number;
}

export type StrategyActionType =
  | "decision"
  | "card_play"
  | "build"
  | "upgrade"
  | "demolish"
  | "company_action"
  | "deal"
  | "hire"
  | "fire"
  | "poach"
  | "salary"
  | "stock_trade"
  | "asset_trade"
  | "loan"
  | "product_price"
  | "product_toggle";

export interface StrategyAction {
  id: string;
  turn: number;
  type: StrategyActionType;
  area: "company" | "city" | "talent" | "strategy" | "market";
  targetId?: string;
  value?: number;
}

export type StrategyEventKind =
  | "rival_price_pressure"
  | "talent_poach"
  | "supply_problem"
  | "customer_complaint"
  | "investor_visit";

export interface StrategyEvent {
  id: string;
  kind: StrategyEventKind;
  title: string;
  body: string;
  severity: "notice" | "major";
  status: "active" | "resolved";
  rivalCompanyId?: string;
  createdTurn: number;
  expiresTurn: number;
  responseActionTypes: StrategyActionType[];
}

export interface StrategyState {
  actionLog: StrategyAction[];
  majorEvents: StrategyEvent[];
  rivalryPressureByCompanyId: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Campaign action cards
// ---------------------------------------------------------------------------

export interface ActionPointState {
  current: number;
  max: number;
  freeActionsUsed: number;
}

export type ActionCardCategory =
  | "production"
  | "pricing"
  | "marketing"
  | "rnd"
  | "people"
  | "finance"
  | "ethics";

export type CardRarity = "common" | "rare" | "epic" | "legendary";

export type CardEffectKind =
  | "production_target_delta"
  | "product_price_multiplier"
  | "inventory_delta"
  | "quality_delta"
  | "reputation_delta"
  | "morale_delta"
  | "cash_delta"
  | "debt_delta"
  | "loyalty_delta";

export interface CardEffect {
  kind: CardEffectKind;
  value: number;
  productIndex?: number;
}

export interface ActionCardDefinition {
  id: string;
  name: string;
  emoji: string;
  category: ActionCardCategory;
  rarity: CardRarity;
  description: string;
  simpleDescription: string;
  actionPointCost: number;
  cashCost?: number;
  cooldownTurns?: number;
  levelMin: Level;
  tags: string[];
  effects: CardEffect[];
}

export interface PlayerCardState {
  unlockedCardIds: string[];
  deckCardIds: string[];
  handCardIds: string[];
  discardCardIds: string[];
  cooldowns: Record<string, number>;
  playedThisTurn: string[];
}

// ---------------------------------------------------------------------------
// Campaign rivals
// ---------------------------------------------------------------------------

export type RivalArchetype = "price_destroyer";

export interface RivalDefinition {
  id: string;
  name: string;
  title: string;
  emoji: string;
  archetype: RivalArchetype;
  chapterId: string;
  chapterTitle: string;
  intro: string;
  taunts: string[];
  victoryText: string;
  defeatText: string;
}

export type RivalChapterStatus = "active" | "won" | "lost";

export interface RivalObjectiveState {
  id: string;
  label: string;
  passed: boolean;
  current: number;
  target: number;
}

export interface RivalState {
  schemaVersion: number;
  activeRivalId: string;
  chapterId: string;
  status: RivalChapterStatus;
  turnInChapter: number;
  turnsTotal: number;
  playerMarketShare: number;
  rivalMarketShare: number;
  specialMovesUsed: string[];
  responsesUsed: string[];
  currentTaunt: string;
  objectiveStates: RivalObjectiveState[];
  /** How many price-war chapters have been fought so far (0 = first chapter). */
  escalation: number;
  /** Game turn at which a resolved chapter respawns as a tougher rematch. */
  respawnAtTurn?: number;
}

// ---------------------------------------------------------------------------
// Level configuration (difficulty presets)
// ---------------------------------------------------------------------------

export interface LevelConfig {
  level: Level;
  label: string;
  description: string;
  recommendedAge: string;
  mapSize: number; // grid is mapSize x mapSize
  instantBuild: boolean;
  adjacencyBonus: boolean;
  startingCash: number;
  volatility: number; // global multiplier on price moves
  eventIntensity: number; // multiplier on event frequency/strength
  enabledAssets: AssetClass[];
  enabledBuildings: BuildingType[];
  enabledEventLayers: EventLayer[];
  showAdvancedMetrics: boolean; // financials, debt, FX...
  characterDepth: "simple" | "roles" | "full";
  simplifiedLabels: boolean; // kid-friendly section/button text (elementary_low only)
  maxChoices: number;
  numberScale: "small" | "medium" | "large" | "advanced";
  feedbackDepth: "picture" | "simple" | "reason" | "analysis";
  aiCount: number;
  /**
   * How sustained over-leverage (see CompanyTurnResult.insolvent) is resolved.
   * "bailout": debt is partially forgiven and reputation dented, game continues
   * (used for younger levels so a bad quarter isn't a hard stop).
   * "strict": the player's game ends in bankruptcy; AI companies still get a
   * bailout since there's no company-removal machinery.
   */
  bankruptcyPolicy: "bailout" | "strict";
}

// ---------------------------------------------------------------------------
// Embedded sandbox campaign
// ---------------------------------------------------------------------------

export type CampaignEvaluationTiming = "before_turn" | "after_turn";

export type CampaignObjectiveKind =
  | "decision_at_most"
  | "decision_at_least"
  | "product_price_between"
  | "company_metric_at_least"
  | "company_metric_at_most"
  | "turn_metric_at_least"
  | "turn_metric_at_most"
  | "building_count_at_least"
  | "district_level_at_least"
  | "district_synergy_at_least"
  | "hired_count_at_least"
  | "role_assigned"
  | "action_recorded"
  | "relationship_at_most"
  | "portfolio_value_at_least";

export type CampaignCompanyMetric =
  | "cash"
  | "debt"
  | "inventory"
  | "quality"
  | "reputation"
  | "morale"
  | "safety";

export type CampaignDecisionMetric =
  | "price"
  | "productionTarget"
  | "marketingBudget"
  | "rndBudget"
  | "welfareBudget"
  | "safetyBudget";

export type CampaignTurnMetric =
  | "revenue"
  | "unitsSold"
  | "unitsProduced"
  | "profit"
  | "quitCount";

export interface CampaignObjective {
  id: string;
  label: string;
  kind: CampaignObjectiveKind;
  target: number;
  min?: number;
  max?: number;
  metric?: CampaignCompanyMetric | CampaignDecisionMetric | CampaignTurnMetric;
  productIndex?: number;
  buildingType?: BuildingType;
  districtId?: CityDistrictId;
  role?: CharacterRole;
  actionType?: StrategyActionType;
  targetId?: string;
}

export interface CampaignMission {
  id: string;
  level: Level;
  levelBand: Level;
  title: string;
  summary: string;
  concept: string;
  targetAction: string;
  targetArea: "company" | "city" | "talent" | "strategy" | "market";
  timing: CampaignEvaluationTiming;
  objectives: CampaignObjective[];
  hint: string;
  successText: string;
  retryText: string;
  nextMissionId?: string;
}

export interface CampaignObjectiveState {
  objectiveId: string;
  passed: boolean;
  current: number;
  target: number;
}

export interface CampaignEvaluation {
  missionId: string;
  success: boolean;
  stars: number;
  message: string;
  objectiveStates: CampaignObjectiveState[];
}

export interface CampaignProgress {
  schemaVersion: number;
  enabled: boolean;
  activeMissionId: string;
  completedMissionIds: string[];
  unlockedMissionIds: string[];
  bestStarsByMissionId: Record<string, number>;
  attemptsByMissionId: Record<string, number>;
  currentObjectiveState: CampaignObjectiveState[];
  lastMessage?: string;
}

// ---------------------------------------------------------------------------
// Top-level game state
// ---------------------------------------------------------------------------

export interface GameState {
  version: number;
  seed: number;
  rng: RngState;
  level: Level;
  config: LevelConfig;
  turn: number;
  maxTurns: number;
  status: "playing" | "ended";
  /** Why the game ended (undefined while still playing). */
  endReason?: "bankrupt" | "maxTurns";

  macro: MacroState;

  companies: Company[];
  playerCompanyId: string;
  stocks: Record<string, Stock>;
  assets: Record<AssetClass, AssetMarketItem>;
  talentPool: Character[];

  relations: RelationState;
  news: NewsItem[];
  city: CityState;
  strategy: StrategyState;
  actionPoints?: ActionPointState;
  /** Category -> times used this turn, for diminishing-returns on repeated one-off actions. */
  actionCategoryUsage?: Record<string, number>;
  /** IDs of net-worth/rank milestones the player has already been celebrated for. */
  milestonesReached?: string[];
  cards?: PlayerCardState;
  rival?: RivalState;
  campaign?: CampaignProgress;

  createdAt: number;
  updatedAt: number;
}

export interface RankingEntry {
  companyId: string;
  name: string;
  logoColor: string;
  isPlayer: boolean;
  netWorth: number;
  cash: number;
  portfolioValue: number;
  companyValue: number;
}
