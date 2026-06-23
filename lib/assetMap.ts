import type {
  ActionCardCategory,
  BuildingType,
  CharacterRole,
  CityDistrictId,
  StrategyEventKind,
} from "@/lib/engine";

export interface SpriteSheetCrop {
  src: string;
  cols: number;
  rows: number;
  col: number;
  row: number;
  alt: string;
}

export const BUILDING_IMG: Partial<Record<BuildingType, string>> = {
  office:    "/assets/buildings/office.png",
  factory:   "/assets/buildings/factory.png",
  rnd:       "/assets/buildings/rnd.png",
  store:     "/assets/buildings/store.png",
  warehouse: "/assets/buildings/warehouse.png",
  cafeteria: "/assets/buildings/cafeteria.png",
  gym:       "/assets/buildings/gym.png",
  daycare:   "/assets/buildings/daycare.png",
  clinic:    "/assets/buildings/clinic.png",
  power:     "/assets/buildings/power.png",
  hr:        "/assets/buildings/hr.png",
  park:      "/assets/buildings/park.png",
  dorm:      "/assets/buildings/dorm.png",
  lab:       "/assets/buildings/lab.png",
};

// Management decision icons (one per slider label).
export const MGMT_ICONS = {
  price:      "/assets/icons/icon_price.png",
  production: "/assets/icons/icon_production.png",
  marketing:  "/assets/icons/icon_marketing.png",
  rnd:        "/assets/icons/icon_rnd.png",
  welfare:    "/assets/icons/icon_welfare.png",
  safety:     "/assets/icons/icon_safety.png",
} as const;

// Economy indicator icons (for EconomyIndicators panel).
export const ECONOMY_ICONS = {
  gdp:       "/assets/icons/icon_gdp.png",
  inflation: "/assets/icons/icon_inflation.png",
  rate:      "/assets/icons/icon_rate.png",
  sentiment: "/assets/icons/icon_sentiment.png",
} as const;

// Dashboard / finance icons.
export const FINANCE_ICONS = {
  cash:          "/assets/icons/icon_cash.png",
  portfolio:     "/assets/icons/icon_portfolio.png",
  companyValue:  "/assets/icons/icon_company_value.png",
  debt:          "/assets/icons/icon_debt.png",
} as const;

export const MASCOT_IMG = "/assets/mascot/unicorn.png";

// Per-role images used when no per-character image is assigned.
export const ROLE_IMG: Partial<Record<CharacterRole, string>> = {
  ceo:  "/assets/characters/role_strategy.png",
  cto:  "/assets/characters/role_researcher.png",
  cmo:  "/assets/characters/role_marketing.png",
  cfo:  "/assets/characters/role_finance.png",
  coo:  "/assets/characters/role_sales.png",
  chro: "/assets/characters/role_hr.png",
};

// 32 diverse talent portraits (img_07 × 16 + img_08 × 16).
// Use charCodeSum(character.id) % TALENT_IMGS.length to pick deterministically.
export const TALENT_IMGS: string[] = Array.from({ length: 32 }, (_, i) =>
  `/assets/characters/talent_${String(i + 1).padStart(2, "0")}.png`,
);

// 32 famous-person portraits (img_09 × 16 + img_10 × 16) for visitor events.
export const FAMOUS_IMGS: string[] = Array.from({ length: 32 }, (_, i) =>
  `/assets/characters/famous_${String(i + 1).padStart(2, "0")}.png`,
);

/** Deterministic index into an image array from a string id. */
export function idToIndex(id: string, len: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % len;
}

export const SECRETARY_IMG = "/assets/characters/secretary.png";
export const ICON_STOCK    = "/assets/icons/stock.png";
export const ICON_NEWS     = "/assets/icons/news.png";

// Economy phase icons
export const PHASE_ICONS: Record<string, string> = {
  boom:        "/assets/icons/phase_boom.png",
  normal:      "/assets/icons/phase_normal.png",
  recession:   "/assets/icons/phase_recession.png",
  inflation:   "/assets/icons/phase_inflation.png",
  deflation:   "/assets/icons/phase_deflation.png",
  stagflation: "/assets/icons/phase_stagflation.png",
};

// Tab navigation icons
export const TAB_ICONS = {
  home:    "/assets/icons/tab_home.png",
  company: "/assets/icons/tab_company.png",
  invest:  "/assets/icons/tab_invest.png",
  talent:  "/assets/icons/tab_talent.png",
  news:    "/assets/icons/tab_news.png",
  rank:    "/assets/icons/tab_rank.png",
  visit:   "/assets/icons/tab_visit.png",
} as const;

// Quickfact dashboard icons
export const FACT_ICONS = {
  revenue:   "/assets/icons/fact_revenue.png",
  profit:    "/assets/icons/fact_profit.png",
  buildings: "/assets/icons/fact_buildings.png",
  staff:     "/assets/icons/fact_staff.png",
} as const;

// Result/game-over illustrations
export const RESULT_ICONS = {
  win: "/assets/icons/result_win.png",
  end: "/assets/icons/result_end.png",
} as const;

// Investment asset class icons
export const ASSET_ICONS: Record<string, string> = {
  deposit:    "/assets/icons/asset_deposit.png",
  bond:       "/assets/icons/asset_bond.png",
  etf:        "/assets/icons/asset_etf.png",
  realestate: "/assets/icons/asset_realestate.png",
  gold:       "/assets/icons/asset_gold.png",
  oil:        "/assets/icons/asset_oil.png",
  fx:         "/assets/icons/asset_fx.png",
  crypto:     "/assets/icons/asset_crypto.png",
};

// Event banners
export const BANNER_IMGS = {
  positive: "/assets/banners/banner_positive.png",
  negative: "/assets/banners/banner_negative.png",
  neutral:  "/assets/banners/banner_neutral.png",
  report:   "/assets/banners/banner_report.png",
} as const;

const UNICORN_CITY_ASSET_BASE = "/assets/unicorn-city/unicorn_city_assets";

export const UNICORN_CITY_SHEETS = {
  districts: `${UNICORN_CITY_ASSET_BASE}/01_city_district_icons.png`,
  rivals: `${UNICORN_CITY_ASSET_BASE}/02_rival_ceo_characters.png`,
  strategyEvents: `${UNICORN_CITY_ASSET_BASE}/03_strategy_event_icons.png`,
  actionCards: `${UNICORN_CITY_ASSET_BASE}/04_ceo_action_cards.png`,
  statusBanners: `${UNICORN_CITY_ASSET_BASE}/05_status_banners.png`,
  uiIcons: `${UNICORN_CITY_ASSET_BASE}/06_ui_icons.png`,
} as const;

function crop(
  src: string,
  cols: number,
  rows: number,
  col: number,
  row: number,
  alt: string,
): SpriteSheetCrop {
  return { src, cols, rows, col, row, alt };
}

export const DISTRICT_ART: Record<CityDistrictId, SpriteSheetCrop> = {
  production: crop(UNICORN_CITY_SHEETS.districts, 3, 2, 0, 0, "생산 구역"),
  research: crop(UNICORN_CITY_SHEETS.districts, 3, 2, 1, 0, "연구 구역"),
  commerce: crop(UNICORN_CITY_SHEETS.districts, 3, 2, 2, 0, "상점 구역"),
  welfare: crop(UNICORN_CITY_SHEETS.districts, 3, 2, 0, 1, "복지 구역"),
  logistics: crop(UNICORN_CITY_SHEETS.districts, 3, 2, 1, 1, "물류 구역"),
  finance: crop(UNICORN_CITY_SHEETS.districts, 3, 2, 2, 1, "금융 구역"),
};

export const RIVAL_ART: Record<string, SpriteSheetCrop> = {
  "barry-price": crop(UNICORN_CITY_SHEETS.rivals, 2, 2, 0, 0, "가격 공세 경쟁자"),
};

export const STRATEGY_EVENT_ART: Record<StrategyEventKind, SpriteSheetCrop> = {
  rival_price_pressure: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 0, 0, "경쟁사 가격 공세"),
  customer_complaint: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 1, 0, "고객 불만"),
  supply_problem: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 2, 0, "공급 문제"),
  talent_poach: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 0, 1, "핵심 인재 스카우트"),
  investor_visit: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 1, 1, "투자자 방문"),
  equipment_breakdown: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 2, 0, "설비 고장"),
  logistics_delay: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 2, 0, "물류 지연"),
  safety_inspection: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 1, 0, "안전 점검"),
  local_festival: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 1, 1, "지역 축제"),
  viral_trend: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 1, 1, "바이럴 유행"),
  cyber_incident: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 1, 0, "사이버 사고"),
  regulation_inspection: crop(UNICORN_CITY_SHEETS.strategyEvents, 3, 2, 1, 0, "규제 점검"),
};

export const ACTION_CARD_CATEGORY_ART: Record<ActionCardCategory, SpriteSheetCrop> = {
  production: crop(UNICORN_CITY_SHEETS.actionCards, 3, 2, 0, 0, "생산 행동 카드"),
  rnd: crop(UNICORN_CITY_SHEETS.actionCards, 3, 2, 1, 0, "품질 행동 카드"),
  finance: crop(UNICORN_CITY_SHEETS.actionCards, 3, 2, 2, 0, "재고 행동 카드"),
  marketing: crop(UNICORN_CITY_SHEETS.actionCards, 3, 2, 0, 1, "홍보 행동 카드"),
  pricing: crop(UNICORN_CITY_SHEETS.actionCards, 3, 2, 1, 1, "가격 행동 카드"),
  people: crop(UNICORN_CITY_SHEETS.actionCards, 3, 2, 2, 1, "직원 행동 카드"),
  ethics: crop(UNICORN_CITY_SHEETS.actionCards, 3, 2, 2, 1, "고객 신뢰 행동 카드"),
};

export const STATUS_BANNER_ART = {
  growth: crop(UNICORN_CITY_SHEETS.statusBanners, 2, 2, 0, 0, "성장 결과"),
  warning: crop(UNICORN_CITY_SHEETS.statusBanners, 2, 2, 1, 0, "위기 회의"),
  rivalry: crop(UNICORN_CITY_SHEETS.statusBanners, 2, 2, 0, 1, "시장 경쟁"),
  city: crop(UNICORN_CITY_SHEETS.statusBanners, 2, 2, 1, 1, "도시 성장"),
} as const;
