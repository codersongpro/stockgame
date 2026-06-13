import type { CountryDef } from "../engine/types";

// Country catalog. Each country has its own macro baselines, currency and
// central bank. Tax / labor / market-size / regulation create distinct
// strategic flavours.

export const COUNTRIES: CountryDef[] = [
  {
    id: "kr",
    name: "대한민국",
    flag: "🇰🇷",
    currency: "₩",
    centralBank: "한국은행",
    baseGrowth: 2.2,
    baseInflation: 2.5,
    baseRate: 3.0,
    taxRate: 0.22,
    laborCost: 1.0,
    marketSize: 0.9,
    regulation: 0.5,
  },
  {
    id: "us",
    name: "미국",
    flag: "🇺🇸",
    currency: "$",
    centralBank: "연방준비제도(Fed)",
    baseGrowth: 2.5,
    baseInflation: 2.8,
    baseRate: 3.5,
    taxRate: 0.21,
    laborCost: 1.3,
    marketSize: 1.5,
    regulation: 0.4,
  },
  {
    id: "cn",
    name: "중국",
    flag: "🇨🇳",
    currency: "¥",
    centralBank: "인민은행",
    baseGrowth: 4.5,
    baseInflation: 2.0,
    baseRate: 2.5,
    taxRate: 0.25,
    laborCost: 0.7,
    marketSize: 1.6,
    regulation: 0.7,
  },
  {
    id: "jp",
    name: "일본",
    flag: "🇯🇵",
    currency: "¥",
    centralBank: "일본은행(BOJ)",
    baseGrowth: 1.0,
    baseInflation: 1.2,
    baseRate: 0.5,
    taxRate: 0.30,
    laborCost: 1.1,
    marketSize: 1.1,
    regulation: 0.5,
  },
  {
    id: "de",
    name: "독일",
    flag: "🇩🇪",
    currency: "€",
    centralBank: "유럽중앙은행(ECB)",
    baseGrowth: 1.5,
    baseInflation: 2.2,
    baseRate: 2.8,
    taxRate: 0.30,
    laborCost: 1.25,
    marketSize: 1.0,
    regulation: 0.6,
  },
  {
    id: "in",
    name: "인도",
    flag: "🇮🇳",
    currency: "₹",
    centralBank: "인도준비은행",
    baseGrowth: 6.0,
    baseInflation: 4.5,
    baseRate: 5.0,
    taxRate: 0.25,
    laborCost: 0.5,
    marketSize: 1.3,
    regulation: 0.6,
  },
];

export const COUNTRY_MAP: Record<string, CountryDef> = Object.fromEntries(
  COUNTRIES.map((c) => [c.id, c]),
);

export function getCountry(id: string): CountryDef {
  return COUNTRY_MAP[id] ?? COUNTRIES[0];
}
