import type { Company, DecisionEffects, GameState, PendingDecision } from "./types";
import { shockStock } from "./market";
import { nextFloat, nextInt } from "./rng";

// Interactive "management events": instead of a one-line news blurb, these stop
// and ask the player to make a choice with real trade-offs. Each option carries
// serializable effects so a save can round-trip a pending decision.

interface DecisionTemplate {
  id: string;
  emoji: string;
  title: string;
  body: string;
  /** Higher = more likely. Can read company state for context-aware odds. */
  weight: (c: Company) => number;
  options: PendingDecision["options"];
}

const TEMPLATES: DecisionTemplate[] = [
  {
    id: "bulk_order",
    emoji: "🤝",
    title: "대형 거래처의 대량 주문",
    body: "한 대형 유통사가 대량 주문을 제안하면서 단가를 크게 깎아 달라고 해요. 받아들일까요?",
    weight: () => 1,
    options: [
      {
        id: "accept",
        label: "수락한다",
        desc: "지금 현금이 들어오고 평판도 오르지만, 헐값 납품이에요.",
        effects: { cash: 180_000, reputation: 6, morale: -3 },
        resultText: "대량 납품 계약 체결! 현금과 평판이 늘었어요.",
      },
      {
        id: "reject",
        label: "거절한다",
        desc: "브랜드 가치를 지키지만 큰 기회를 놓쳐요.",
        effects: { reputation: -2 },
        resultText: "제안을 정중히 거절했어요. 브랜드는 지켰습니다.",
      },
    ],
  },
  {
    id: "poach",
    emoji: "🧑‍💻",
    title: "핵심 인재 스카우트 위협",
    body: "경쟁사가 우리 핵심 개발자에게 거액을 제시했어요. 어떻게 대응할까요?",
    weight: (c) => (c.quality > 40 ? 1.4 : 0.8),
    options: [
      {
        id: "raise",
        label: "연봉을 올려 붙잡는다",
        desc: "비용이 들지만 기술력과 사기를 지켜요.",
        effects: { cash: -120_000, morale: 6, quality: 3 },
        resultText: "파격 대우로 인재를 지켰어요. 사기가 올랐습니다.",
      },
      {
        id: "letgo",
        label: "보내준다",
        desc: "돈은 아끼지만 기술력과 사기가 떨어져요.",
        effects: { quality: -6, morale: -8 },
        resultText: "핵심 인재가 떠났어요. 기술력과 사기가 하락했습니다.",
      },
    ],
  },
  {
    id: "safety_warn",
    emoji: "🦺",
    title: "안전 점검 경고",
    body: "현장에서 안전 설비가 노후됐다는 경고가 올라왔어요. 지금 투자할까요?",
    weight: (c) => (c.safety < 60 ? 1.8 : 0.6),
    options: [
      {
        id: "invest",
        label: "안전에 투자한다",
        desc: "현금이 들지만 사고 위험을 크게 줄여요.",
        effects: { cash: -90_000, safety: 14 },
        resultText: "안전 설비를 교체했어요. 사고 위험이 줄었습니다.",
      },
      {
        id: "ignore",
        label: "일단 미룬다",
        desc: "돈을 아끼지만 사고가 나면 큰일이에요.",
        effects: { safety: -10, reputation: -2 },
        resultText: "점검을 미뤘어요. 안전도가 떨어졌습니다.",
      },
    ],
  },
  {
    id: "interview",
    emoji: "🎤",
    title: "유명 매체 인터뷰 제안",
    body: "인기 경제 매체가 CEO 인터뷰를 제안했어요. 어떻게 할까요?",
    weight: () => 1,
    options: [
      {
        id: "bold",
        label: "비전을 적극 홍보",
        desc: "홍보비가 들지만 평판과 주가가 오를 수 있어요.",
        effects: { cash: -50_000, reputation: 8, stockShockPct: 0.05 },
        resultText: "인터뷰가 화제가 됐어요! 평판과 주가가 올랐습니다.",
      },
      {
        id: "modest",
        label: "조용히 사양",
        desc: "리스크는 없지만 기회도 없어요.",
        effects: {},
        resultText: "이번 인터뷰는 사양했어요.",
      },
    ],
  },
  {
    id: "recall",
    emoji: "⚠️",
    title: "제품 결함 발견",
    body: "출시한 제품에서 결함이 발견됐어요. 대응 방식을 정하세요.",
    weight: (c) => (c.quality < 55 ? 1.4 : 0.7),
    options: [
      {
        id: "recall",
        label: "즉시 전량 리콜",
        desc: "큰 비용이 들지만 신뢰를 지켜요.",
        effects: { cash: -150_000, reputation: 5, quality: 4 },
        resultText: "신속한 리콜로 신뢰를 지켰어요.",
      },
      {
        id: "hide",
        label: "조용히 넘긴다",
        desc: "당장은 아끼지만 들통나면 평판과 주가가 폭락해요.",
        effects: { reputation: -12, stockShockPct: -0.08 },
        resultText: "문제를 덮었지만 소문이 퍼져 평판과 주가가 하락했어요.",
      },
    ],
  },
  {
    id: "expansion_loan",
    emoji: "🏦",
    title: "공격적 확장 기회",
    body: "지금 대출을 받아 설비를 늘리면 시장을 선점할 수 있다는 보고가 올라왔어요.",
    weight: (c) => (c.cash < 400_000 ? 1.2 : 0.7),
    options: [
      {
        id: "borrow",
        label: "대출받아 확장",
        desc: "빚이 늘지만 품질·생산 기반을 키워요.",
        effects: { debt: 300_000, cash: 280_000, quality: 4 },
        resultText: "대출로 설비를 확장했어요. 빚이 늘었지만 기반이 강해졌습니다.",
      },
      {
        id: "wait",
        label: "신중하게 보류",
        desc: "재무는 안전하지만 성장 기회는 미뤄져요.",
        effects: {},
        resultText: "확장을 보류하고 재무 안정을 택했어요.",
      },
    ],
  },
  {
    id: "union",
    emoji: "🧑‍🏭",
    title: "직원들의 처우 개선 요구",
    body: "직원들이 복지와 처우 개선을 요구하고 있어요. 어떻게 할까요?",
    weight: (c) => (c.morale < 55 ? 1.6 : 0.7),
    options: [
      {
        id: "accept",
        label: "요구를 수용한다",
        desc: "비용이 들지만 사기가 크게 올라요.",
        effects: { cash: -100_000, morale: 12 },
        resultText: "처우를 개선했어요. 직원 사기가 크게 올랐습니다.",
      },
      {
        id: "refuse",
        label: "거절한다",
        desc: "돈은 아끼지만 사기와 평판이 떨어져요.",
        effects: { morale: -10, reputation: -3 },
        resultText: "요구를 거절했어요. 사기가 떨어졌습니다.",
      },
    ],
  },
  {
    id: "green_invest",
    emoji: "🌱",
    title: "친환경 전환 압박",
    body: "사회적으로 친환경 경영 요구가 거세요. 선제적으로 투자할까요?",
    weight: () => 0.9,
    options: [
      {
        id: "invest",
        label: "친환경에 투자",
        desc: "비용이 들지만 평판과 주가에 긍정적이에요.",
        effects: { cash: -110_000, reputation: 9, stockShockPct: 0.04 },
        resultText: "친환경 전환을 발표했어요. 평판과 주가가 올랐습니다.",
      },
      {
        id: "later",
        label: "나중에 한다",
        desc: "지금은 아끼지만 평판이 조금 깎여요.",
        effects: { reputation: -3 },
        resultText: "친환경 투자를 미뤘어요.",
      },
    ],
  },
];

/**
 * Maybe produce an interactive decision for the player this turn. Returns the
 * decision (the caller stores it on state.pendingDecision) or null.
 */
export function maybeGenerateDecision(state: GameState): PendingDecision | null {
  if (state.pendingDecision) return null;
  const player = state.companies.find((c) => c.id === state.playerCompanyId);
  if (!player) return null;

  // ~35% per quarter, scaled by event intensity, and never on turn 0.
  const chance = 0.35 * state.config.eventIntensity;
  if (state.turn < 1 || nextFloat(state.rng) > chance) return null;

  const weighted = TEMPLATES.map((t) => ({ t, w: Math.max(0, t.weight(player)) }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  if (total <= 0) return null;
  let r = nextFloat(state.rng) * total;
  let chosen = weighted[0].t;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) {
      chosen = x.t;
      break;
    }
  }

  return {
    id: `${chosen.id}-${state.turn}-${nextInt(state.rng, 0, 9999)}`,
    emoji: chosen.emoji,
    title: chosen.title,
    body: chosen.body,
    options: chosen.options,
  };
}

/** Apply a chosen option's effects to the player's company. Returns result text. */
export function applyDecision(state: GameState, optionId: string): string | null {
  const decision = state.pendingDecision;
  if (!decision) return null;
  const option = decision.options.find((o) => o.id === optionId);
  state.pendingDecision = undefined;
  if (!option) return null;

  const player = state.companies.find((c) => c.id === state.playerCompanyId);
  if (player) applyEffects(state, player, option.effects);
  return option.resultText;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function applyEffects(state: GameState, company: Company, e: DecisionEffects): void {
  if (e.cashPct) company.cash += company.cash * e.cashPct;
  if (e.cash) company.cash += e.cash;
  if (e.debt) company.debt = Math.max(0, company.debt + e.debt);
  if (e.reputation) company.reputation = clamp(company.reputation + e.reputation, 0, 100);
  if (e.morale) company.morale = clamp(company.morale + e.morale, 0, 100);
  if (e.quality) company.quality = clamp(company.quality + e.quality, 0, 100);
  if (e.safety) company.safety = clamp(company.safety + e.safety, 0, 100);
  if (e.stockShockPct) shockStock(state.stocks, company.id, e.stockShockPct);
}
