import { getCountry } from "../data/countries";
import { getIndustry } from "../data/industries";
import { estimateDemand, factoryCapacity } from "./company";
import type { Company, GameState } from "./types";

export interface StrategyTimingSignal {
  score: number;
  label: string;
  summary: string;
  reasons: string[];
}

export interface MassProductionTimingSignal extends StrategyTimingSignal {
  recommendedProduction: number;
  estimatedDemand: number;
}

export interface StrategicTiming {
  rnd: StrategyTimingSignal;
  massProduction: MassProductionTimingSignal;
}

export function getStrategicTiming(company: Company, game: GameState): StrategicTiming {
  const industry = getIndustry(company.industryId);
  const country = getCountry(company.countryId);
  const demand = estimateDemand(company, industry, country, game.macro, game.config);
  const capacity = factoryCapacity(company, game.config);
  const inventory = Math.max(0, company.inventory);
  const currentTarget = Math.max(0, company.decisions.productionTarget);
  const cash = Math.max(0, company.cash);

  const demandAfterInventory = Math.max(0, demand - inventory * 0.65);
  const recommendedProduction = roundToStep(
    clamp(Math.max(currentTarget, demandAfterInventory * 1.08), 10, capacity),
    10,
  );

  const rndReasons: string[] = [];
  const productionReasons: string[] = [];

  let rndScore = 24 + industry.rndDependence * 34;
  let productionScore = 24;

  if (company.quality < 45) {
    rndScore += 20;
    rndReasons.push("품질이 낮아 연구 효과가 커요");
  } else if (company.quality < 75 && industry.rndDependence >= 0.55) {
    rndScore += 16;
    rndReasons.push("다음 좋은 상품을 열려면 연구가 중요해요");
  } else {
    productionScore += 10;
    productionReasons.push("품질이 충분해서 많이 팔 준비가 됐어요");
  }

  if (game.macro.phase === "recession" || game.macro.phase === "deflation") {
    rndScore += 14;
    productionScore -= 12;
    rndReasons.push("손님이 줄 때는 다음 상품을 준비하기 좋아요");
  }
  if (game.macro.phase === "boom" || game.macro.phase === "normal") {
    productionScore += game.macro.phase === "boom" ? 18 : 8;
    productionReasons.push(game.macro.phase === "boom" ? "경기가 좋아 손님이 많아요" : "시장이 안정적이에요");
  }
  if (game.macro.interestRate <= 2.5) {
    rndScore += 8;
    rndReasons.push("이자가 낮아 긴 투자를 하기 좋아요");
  } else if (game.macro.interestRate >= 5.5) {
    rndScore -= 7;
    productionScore += 4;
    productionReasons.push("이자가 높아 빠른 매출이 더 중요해요");
  }

  const demandRatio = currentTarget > 0 ? demand / currentTarget : demand / 100;
  if (demandRatio >= 1.35) {
    productionScore += 22;
    productionReasons.push("예상 손님이 현재 생산보다 많아요");
  } else if (demandRatio >= 1.05) {
    productionScore += 12;
    productionReasons.push("지금보다 조금 더 만들어도 팔릴 가능성이 커요");
  } else if (demandRatio < 0.8) {
    productionScore -= 12;
    rndScore += 8;
    rndReasons.push("지금은 만들기보다 개선이 유리해요");
  }

  if (inventory <= demand * 0.1) {
    productionScore += 14;
    productionReasons.push("창고에 남은 물건이 적어요");
  } else if (inventory >= demand * 0.45) {
    productionScore -= 18;
    rndScore += 6;
    rndReasons.push("재고가 많아 무리해서 만들 필요가 적어요");
  }

  if (company.reputation >= 70) {
    productionScore += 8;
    productionReasons.push("회사 평판이 좋아 잘 팔릴 수 있어요");
  }
  if (company.lastProfit > 0) {
    productionScore += 6;
    productionReasons.push("지난 분기 이익이 나서 생산 여력이 있어요");
  }
  if (cash >= 500_000) {
    rndScore += 6;
    productionScore += 5;
  } else if (cash < 120_000) {
    rndScore -= 10;
    productionScore -= 7;
  }

  const rnd = makeSignal(
    clamp(Math.round(rndScore), 0, 100),
    "연구개발",
    rndReasons,
    ["새 상품과 품질을 준비하기 좋은 때예요", "연구는 조금씩 쌓이는 투자예요"],
  );
  const massProduction = {
    ...makeSignal(
      clamp(Math.round(productionScore), 0, 100),
      "대량생산",
      productionReasons,
      ["많이 만들어 팔기 좋은 때예요", "수요와 재고를 보고 생산량을 정해요"],
    ),
    recommendedProduction,
    estimatedDemand: demand,
  };

  return { rnd, massProduction };
}

export function timingBonusFromScore(score: number): number {
  if (score >= 85) return 4;
  if (score >= 70) return 2;
  return 0;
}

function makeSignal(score: number, label: string, reasons: string[], fallback: [string, string]): StrategyTimingSignal {
  const strong = score >= 75;
  const medium = score >= 55;
  return {
    score,
    label: strong ? `${label} 유리` : medium ? `${label} 보통` : `${label} 천천히`,
    summary: strong ? fallback[0] : medium ? "상황을 보며 조금씩 해도 좋아요" : fallback[1],
    reasons: reasons.length > 0 ? reasons.slice(0, 3) : [fallback[1]],
  };
}

function roundToStep(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
