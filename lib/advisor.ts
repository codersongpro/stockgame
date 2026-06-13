import {
  estimateDemand,
  playerRank,
  productionCapacity,
  type GameState,
} from "@/lib/engine";
import { getCountry } from "@/lib/data/countries";
import { getIndustry } from "@/lib/data/industries";

// Rule-based CEO secretary. Inspects the game state and returns prioritised
// advice (warnings, opportunities, tips). Tone could later be upgraded with a
// Claude API call, but this works fully offline.

export interface Advice {
  tone: "warn" | "tip" | "good";
  text: string;
}

export function generateAdvice(game: GameState): Advice[] {
  const p = game.companies.find((c) => c.id === game.playerCompanyId)!;
  const out: Advice[] = [];
  const industry = getIndustry(p.industryId);
  const country = getCountry(p.countryId);

  // --- Warnings ---
  if (p.cash < 100_000) {
    out.push({ tone: "warn", text: "현금이 거의 없어요! 생산을 줄이거나 대출을 고려하세요." });
  }
  if (p.debt > p.cash * 2 && game.config.showAdvancedMetrics) {
    out.push({ tone: "warn", text: "부채가 너무 많아요. 신용등급 강등 위험이 있어요." });
  }
  if (p.safety < 40) {
    out.push({ tone: "warn", text: "안전 수준이 낮아요. R&D·관리 투자를 늘리지 않으면 사고가 날 수 있어요." });
  }
  if (p.morale < 45) {
    out.push({ tone: "warn", text: "직원 사기가 낮아요. 인사센터를 짓거나 인재를 영입해 사기를 올리세요." });
  }

  const capacity = productionCapacity(p, game.config);
  const demand = estimateDemand(p, industry, country, game.macro, game.config);
  if (p.inventory > demand * 1.5) {
    out.push({ tone: "tip", text: "재고가 많이 쌓였어요. 가격을 낮추거나 마케팅을 늘려 판매를 늘려보세요." });
  }
  if (demand > capacity * 1.2) {
    out.push({ tone: "tip", text: "수요가 생산 능력을 넘어요. 공장을 더 지어 생산을 늘리면 좋겠어요." });
  }
  if (p.decisions.rndBudget < 5000 && industry.rndDependence > 0.6) {
    out.push({ tone: "tip", text: `${industry.name}은(는) 기술이 중요해요. R&D 투자를 늘려 품질을 높이세요.` });
  }

  // --- Macro-driven opportunities ---
  if (game.macro.phase === "inflation" || game.macro.phase === "stagflation") {
    out.push({ tone: "tip", text: "물가가 오르고 있어요. 금·원자재 같은 인플레이션 방어 자산이 유리할 수 있어요." });
  }
  if (game.macro.sentiment < -0.3) {
    out.push({ tone: "tip", text: "시장이 불안해요. 안전자산(채권·예금)이나 현금 비중을 늘려 위험을 줄이세요." });
  }
  if (game.macro.sentiment > 0.4) {
    out.push({ tone: "good", text: "시장 분위기가 좋아요. 성장주 투자 기회를 살펴보세요!" });
  }

  // --- Performance ---
  const rank = playerRank(game);
  if (rank === 1) {
    out.push({ tone: "good", text: "현재 순자산 1위예요! 이대로 유지해봐요. 🏆" });
  } else {
    out.push({ tone: "tip", text: `현재 ${rank}위예요. 경영과 투자, 두 마리 토끼를 모두 잡아 1위에 도전하세요!` });
  }

  return out.slice(0, 5);
}
