"use client";

import { create } from "zustand";
import {
  advanceTurn,
  createGame,
  type AssetClass,
  type BuildingType,
  type CompanyDecisions,
  type GameState,
  type Level,
} from "@/lib/engine";
import {
  buildBuilding,
  buyAsset,
  buyStock,
  emptyCell,
  hireCharacter,
  fireCharacter,
  repayLoan,
  sellAsset,
  sellBuilding,
  sellStock,
  takeLoan,
  upgradeBuilding,
  applyCompanyAction,
  proposeDeal,
} from "@/lib/engine/actions";
import type { TurnSummary } from "@/lib/engine/tick";
import { playSfx } from "@/lib/audio";
import { formatMoney } from "@/lib/format";

const SAVE_KEY = "uc-save-single";

export interface NewGameInput {
  level: Level;
  playerCompanyName: string;
  industryId: string;
  countryId: string;
  logoColor?: string;
  basedOn?: string;
  maxTurns?: number;
}

interface GameStore {
  game: GameState | null;
  lastSummary: TurnSummary | null;
  toast: { text: string; tone: "good" | "bad" | "info" } | null;

  newGame: (input: NewGameInput) => void;
  loadSave: () => boolean;
  hasSave: () => boolean;
  clearSave: () => void;

  next: () => void;
  setDecisions: (partial: Partial<CompanyDecisions>) => void;
  build: (type: BuildingType, x?: number, y?: number) => void;
  upgrade: (buildingId: string) => void;
  demolish: (buildingId: string) => void;
  companyAction: (actionId: string) => void;
  proposeDeal: (targetCompanyId: string, dealId: string) => void;
  hire: (characterId: string) => void;
  fire: (characterId: string) => void;
  tradeStock: (companyId: string, shares: number, side: "buy" | "sell") => boolean;
  tradeAsset: (assetClass: AssetClass, units: number, side: "buy" | "sell") => boolean;
  loan: (amount: number, side: "borrow" | "repay") => void;
  dismissToast: () => void;
}

function player(game: GameState) {
  return game.companies.find((c) => c.id === game.playerCompanyId)!;
}

function persist(game: GameState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  } catch {
    /* ignore quota errors */
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  lastSummary: null,
  toast: null,

  newGame: (input) => {
    const game = createGame(input);
    persist(game);
    set({ game, lastSummary: null, toast: null });
  },

  loadSave: () => {
    if (typeof window === "undefined") return false;
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const game = JSON.parse(raw) as GameState;
      set({ game, lastSummary: null });
      return true;
    } catch {
      return false;
    }
  },

  hasSave: () => {
    if (typeof window === "undefined") return false;
    return !!window.localStorage.getItem(SAVE_KEY);
  },

  clearSave: () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(SAVE_KEY);
  },

  next: () => {
    const game = get().game;
    if (!game || game.status === "ended") return;
    const summary = advanceTurn(game);
    persist(game);
    if ((game.status as string) === "ended") playSfx("win");
    else playSfx("turn");
    set({ game: { ...game }, lastSummary: summary });
  },

  setDecisions: (partial) => {
    const game = get().game;
    if (!game) return;
    Object.assign(player(game).decisions, partial);
    persist(game);
    set({ game: { ...game } });
  },

  build: (type, x, y) => {
    const game = get().game;
    if (!game) return;
    const p = player(game);
    let cell: { x: number; y: number } | null = x != null && y != null ? { x, y } : emptyCell(p, game.config.mapSize);
    if (!cell) return showToast(set, "빈 칸이 없습니다.", "bad");
    const res = buildBuilding(game, p, type, cell.x, cell.y);
    if (!res.ok) return showToast(set, res.error ?? "건설 실패", "bad");
    playSfx("build");
    persist(game);
    set({ game: { ...game }, toast: { text: "건설 완료!", tone: "good" } });
  },

  upgrade: (buildingId) => {
    const game = get().game;
    if (!game) return;
    const res = upgradeBuilding(game, player(game), buildingId);
    if (!res.ok) return showToast(set, res.error ?? "업그레이드 실패", "bad");
    playSfx("build");
    persist(game);
    set({ game: { ...game }, toast: { text: "업그레이드 완료!", tone: "good" } });
  },

  demolish: (buildingId) => {
    const game = get().game;
    if (!game) return;
    const res = sellBuilding(game, player(game), buildingId);
    if (!res.ok) return showToast(set, res.error ?? "매각 실패", "bad");
    playSfx("click");
    persist(game);
    set({ game: { ...game }, toast: { text: `건물 매각 · +${formatMoney(res.refund ?? 0)} 환급`, tone: "good" } });
  },

  companyAction: (actionId) => {
    const game = get().game;
    if (!game) return;
    const res = applyCompanyAction(game, player(game), actionId);
    if (!res.ok) return showToast(set, res.error ?? "실패", "bad");
    playSfx("click");
    persist(game);
    set({ game: { ...game }, toast: { text: res.message ?? "실행 완료!", tone: "good" } });
  },

  proposeDeal: (targetCompanyId, dealId) => {
    const game = get().game;
    if (!game) return;
    const res = proposeDeal(game, player(game), targetCompanyId, dealId);
    if (!res.ok) return showToast(set, res.error ?? "제안 실패", "bad");
    const succeeded = !res.message?.includes("결렬");
    playSfx(succeeded ? "hire" : "click");
    persist(game);
    set({ game: { ...game }, toast: { text: res.message ?? "교류 성사!", tone: succeeded ? "good" : "info" } });
  },

  hire: (characterId) => {
    const game = get().game;
    if (!game) return;
    const res = hireCharacter(game, player(game), characterId);
    if (!res.ok) return showToast(set, res.error ?? "영입 실패", "bad");
    playSfx("hire");
    persist(game);
    set({ game: { ...game }, toast: { text: "인재 영입 성공!", tone: "good" } });
  },

  fire: (characterId) => {
    const game = get().game;
    if (!game) return;
    const res = fireCharacter(game, player(game), characterId);
    if (!res.ok) return showToast(set, res.error ?? "해고 실패", "bad");
    playSfx("click");
    persist(game);
    set({ game: { ...game }, toast: { text: "해고 처리 완료", tone: "info" } });
  },

  tradeStock: (companyId, shares, side) => {
    const game = get().game;
    if (!game) return false;
    const p = player(game);
    const res =
      side === "buy" ? buyStock(game, p, companyId, shares) : sellStock(game, p, companyId, shares);
    if (!res.ok) { showToast(set, res.error ?? "거래 실패", "bad"); return false; }
    playSfx(side === "buy" ? "buy" : "sell");
    // Spread companies array so every subscriber sees new references for the mutated player.
    const companies = game.companies.map((c) => (c.id === p.id ? { ...p, portfolio: { ...p.portfolio, stocks: { ...p.portfolio.stocks }, stockCost: { ...p.portfolio.stockCost } } } : c));
    let text = side === "buy" ? `매수 완료 · 잔고 ${formatMoney(p.cash)}` : "매도 완료";
    if (side === "sell" && res.realized != null) {
      const sign = res.realized >= 0 ? "+" : "−";
      text = `매도 완료 · 실현 ${sign}${formatMoney(Math.abs(res.realized))}`;
    }
    const updated = { ...game, companies };
    persist(updated);
    set({ game: updated, toast: { text, tone: "good" } });
    return true;
  },

  tradeAsset: (assetClass, units, side) => {
    const game = get().game;
    if (!game) return false;
    const p = player(game);
    const res =
      side === "buy" ? buyAsset(game, p, assetClass, units) : sellAsset(game, p, assetClass, units);
    if (!res.ok) { showToast(set, res.error ?? "거래 실패", "bad"); return false; }
    playSfx(side === "buy" ? "buy" : "sell");
    const companies = game.companies.map((c) => (c.id === p.id ? { ...p, portfolio: { ...p.portfolio, assets: { ...p.portfolio.assets } } } : c));
    const updated = { ...game, companies };
    persist(updated);
    set({ game: updated, toast: { text: side === "buy" ? `매수 완료 · 잔고 ${formatMoney(p.cash)}` : "매도 완료", tone: "good" } });
    return true;
  },

  loan: (amount, side) => {
    const game = get().game;
    if (!game) return;
    const p = player(game);
    const res = side === "borrow" ? takeLoan(p, amount) : repayLoan(p, amount);
    if (!res.ok) return showToast(set, res.error ?? "실패", "bad");
    playSfx("click");
    persist(game);
    set({ game: { ...game }, toast: { text: side === "borrow" ? "대출 실행" : "상환 완료", tone: "good" } });
  },

  dismissToast: () => set({ toast: null }),
}));

function showToast(
  set: (partial: Partial<GameStore>) => void,
  text: string,
  tone: "good" | "bad" | "info",
): void {
  if (tone === "bad") playSfx("bad");
  set({ toast: { text, tone } });
}
