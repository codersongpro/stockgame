import type { BuildingType, CharacterRole } from "@/lib/engine";

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
};

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
