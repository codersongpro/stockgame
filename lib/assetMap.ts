import type { BuildingType, CharacterRole } from "@/lib/engine";

// Pixel-art assets only cover a subset of building types / character roles.
// Components fall back to their existing emoji when there's no image here.

export const BUILDING_IMG: Partial<Record<BuildingType, string>> = {
  office: "/assets/buildings/office.png",
  factory: "/assets/buildings/factory.png",
  rnd: "/assets/buildings/rnd.png",
  store: "/assets/buildings/store.png",
  warehouse: "/assets/buildings/warehouse.png",
};

export const ROLE_IMG: Partial<Record<CharacterRole, string>> = {
  ceo: "/assets/characters/ceo.png",
  cto: "/assets/characters/engineer.png",
};

export const SECRETARY_IMG = "/assets/characters/secretary.png";
export const ICON_STOCK = "/assets/icons/stock.png";
export const ICON_NEWS = "/assets/icons/news.png";
