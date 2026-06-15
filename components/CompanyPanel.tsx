"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import {
  estimateDemand,
  productionCapacity,
  type Company,
  type GameState,
} from "@/lib/engine";
import { getIndustry } from "@/lib/data/industries";
import { getCountry } from "@/lib/data/countries";
import { getIndustryProducts } from "@/lib/data/products";
import { formatMoney, formatNum } from "@/lib/format";
import { Bar } from "./Sparkline";
import { Term } from "./Term";
import { MGMT_ICONS, BUILDING_IMG } from "@/lib/assetMap";

// Management action definitions for button-based UI
const ACTION_SECTIONS = [
  {
    key: "marketing",
    label: "마케팅",
    icon: MGMT_ICONS.marketing,
    actions: [
      { id: "mkt_basic",     label: "기본 마케팅",     cost: 30_000 },
      { id: "mkt_active",    label: "적극 마케팅",     cost: 80_000 },
      { id: "mkt_intensive", label: "집중 캠페인",     cost: 150_000 },
      { id: "mkt_event",     label: "특별 이벤트",     cost: 50_000 },
    ],
  },
  {
    key: "rnd",
    label: "연구개발",
    icon: MGMT_ICONS.rnd,
    actions: [
      { id: "rnd_basic",  label: "기초 연구", cost: 30_000 },
      { id: "rnd_active", label: "기술 개발", cost: 80_000 },
      { id: "rnd_patent", label: "특허 출원", cost: 100_000 },
    ],
  },
  {
    key: "welfare",
    label: "직원 복지",
    icon: MGMT_ICONS.welfare,
    actions: [
      { id: "wlf_dinner",   label: "직원 회식", cost: 20_000 },
      { id: "wlf_training", label: "사내 교육", cost: 40_000 },
      { id: "wlf_workshop", label: "워크숍",    cost: 60_000 },
    ],
  },
  {
    key: "safety",
    label: "안전 관리",
    icon: MGMT_ICONS.safety,
    actions: [
      { id: "sft_inspect",  label: "안전 점검", cost: 15_000 },
      { id: "sft_training", label: "안전 교육", cost: 30_000 },
    ],
  },
  {
    key: "extra",
    label: "기타 경영",
    icon: undefined as string | undefined,
    actions: [
      { id: "csr",         label: "ESG활동",    cost: 50_000 },
      { id: "consulting",  label: "외부컨설팅", cost: 80_000 },
      { id: "pr_campaign", label: "언론홍보",   cost: 40_000 },
    ],
  },
] as const;

export function CompanyPanel({ game, company }: { game: GameState; company: Company }) {
  const setDecisions = useGameStore((s) => s.setDecisions);
  const companyAction = useGameStore((s) => s.companyAction);
  const loan = useGameStore((s) => s.loan);
  const setProductPrice = useGameStore((s) => s.setProductPrice);
  const [loanAmt, setLoanAmt] = useState(0);

  // Per-quarter interest ≈ debt × (annual rate / 4). (engine: company.ts)
  const quarterlyRate = game.macro.interestRate / 100 / 4;
  const currentInterest = Math.round(company.debt * quarterlyRate);
  const loanInterest = Math.round(loanAmt * quarterlyRate);

  const industry = getIndustry(company.industryId);
  const country = getCountry(company.countryId);
  const capacity = productionCapacity(company, game.config);
  const demand = estimateDemand(company, industry, country, game.macro, game.config);
  const d = company.decisions;

  const productDefs = getIndustryProducts(company.industryId);
  const productPrices = company.productPrices ?? productDefs.map((p) => Math.round(industry.basePrice * p.priceRatio));
  const rndUnlockDone = company.rndUnlockDone ?? false;

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
          {BUILDING_IMG.office && <img src={BUILDING_IMG.office} alt="" className="h-7 w-7 object-contain" />}
          경영 결정
        </h3>

        <Slider
          icon={MGMT_ICONS.price}
          label="판매 가격"
          value={d.price}
          min={Math.round(industry.unitCost)}
          max={Math.round(industry.basePrice * 2)}
          step={1}
          format={(v) => `${formatNum(v)}원`}
          onChange={(v) => setDecisions({ price: v })}
        />
        <Slider
          icon={MGMT_ICONS.production}
          label="생산 목표 (수량)"
          value={d.productionTarget}
          min={0}
          max={Math.max(capacity, d.productionTarget)}
          step={10}
          format={(v) => `${formatNum(v)}개`}
          onChange={(v) => setDecisions({ productionTarget: v })}
        />

        {/* Product lineup */}
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">상품 라인업</div>
          <div className="space-y-2">
            {productDefs.map((def, i) => {
              const isRndProduct = def.isRndUnlock;
              const isUnlocked = isRndProduct ? rndUnlockDone : true;
              const meetsQuality = company.quality >= def.qualityRequired;
              const isActive = isUnlocked && meetsQuality;
              const currentPrice = productPrices[i] ?? Math.round(industry.basePrice * def.priceRatio);
              const defaultPrice = Math.round(industry.basePrice * def.priceRatio);

              if (isRndProduct && !rndUnlockDone) {
                return (
                  <div key={def.id} className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 opacity-60">
                    <span className="text-base">{def.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-500">{def.name}</div>
                      <div className="text-[10px] text-slate-400">R&D 품질 75 달성 시 잠금 해제</div>
                    </div>
                    <span className="text-xs text-slate-400">🔒 R&D</span>
                  </div>
                );
              }

              return (
                <div
                  key={def.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                    isActive
                      ? "border-brand-200 bg-brand-50"
                      : "border-slate-200 bg-slate-50 opacity-70"
                  }`}
                >
                  <span className="text-base">{def.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold ${isActive ? "text-brand-700" : "text-slate-500"}`}>
                      {def.name}
                      {isRndProduct && <span className="ml-1 rounded px-1 py-0.5 text-[9px] bg-purple-100 text-purple-600">R&D</span>}
                    </div>
                    {!meetsQuality && (
                      <div className="text-[10px] text-amber-600">품질 {def.qualityRequired} 달성 시 활성화</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={currentPrice}
                      min={1}
                      step={Math.max(1, Math.round(defaultPrice * 0.05))}
                      disabled={!isActive}
                      onChange={(e) => setProductPrice(i, Math.max(1, Number(e.target.value)))}
                      className={`w-20 rounded border px-2 py-0.5 text-right text-xs font-bold outline-none ${
                        isActive
                          ? "border-brand-300 bg-white text-brand-700 focus:border-brand-500"
                          : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">원</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Management action buttons */}
        <div className="mt-4 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">경영 활동</div>
          {ACTION_SECTIONS.map((section) => (
            <div key={section.key}>
              <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                {section.icon && <img src={section.icon} alt="" className="h-4 w-4 object-contain" />}
                {section.label}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {section.actions.map((action) => {
                  const canAfford = company.cash >= action.cost;
                  return (
                    <button
                      key={action.id}
                      disabled={!canAfford}
                      onClick={() => companyAction(action.id)}
                      className={`rounded-lg border px-2 py-1.5 text-left text-xs transition-colors ${
                        canAfford
                          ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200"
                          : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      <div className="font-semibold leading-tight">{action.label}</div>
                      <div className={`mt-0.5 text-[10px] ${canAfford ? "text-brand-500" : "text-slate-400"}`}>
                        {formatMoney(action.cost)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
          <Info label="생산 능력" value={`${formatNum(capacity)}개`} />
          <Info label="예상 수요" value={`${formatNum(demand)}개`} hint={demand < d.productionTarget ? "수요<생산: 재고 위험" : "수요 충분"} />
          <Info label="재고" value={`${formatNum(company.inventory)}개`} />
          <Info label="지난 분기 이익" value={formatMoney(company.lastProfit)} tone={company.lastProfit >= 0 ? "good" : "bad"} />
        </div>
      </div>

      {/* Company stats */}
      <div className="card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
          {BUILDING_IMG.rnd && <img src={BUILDING_IMG.rnd} alt="" className="h-7 w-7 object-contain" />}
          회사 상태
        </h3>
        <StatBar label={<Term term="품질">품질 / 기술</Term>} value={company.quality} color="#6366f1" />
        <StatBar label={<Term term="평판" />} value={company.reputation} color="#0ea5e9" />
        <StatBar label={<Term term="사기">직원 사기</Term>} value={company.morale} color="#16a34a" />
        <StatBar label={<Term term="안전" />} value={company.safety} color="#f59e0b" hint={company.safety < 40 ? "낮음! 사고 위험" : undefined} />
      </div>

      {/* Finance */}
      {game.config.showAdvancedMetrics && (
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
            {BUILDING_IMG.office && <img src={BUILDING_IMG.office} alt="" className="h-7 w-7 object-contain" />}
            재무
          </h3>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-slate-500">부채</span>
            <span className="font-bold text-slate-800">{formatMoney(company.debt)}</span>
          </div>
          <div className="mb-3 flex justify-between text-xs">
            <span className="text-slate-400">현재 분기 이자 (연 {game.macro.interestRate.toFixed(2)}%)</span>
            <span className="font-semibold text-bear">≈ {formatMoney(currentInterest)}/분기</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={loanAmt}
              step={50000}
              onChange={(e) => setLoanAmt(Math.max(0, Number(e.target.value)))}
              className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800"
            />
            <button className="btn-ghost" onClick={() => loan(loanAmt, "borrow")}>
              대출
            </button>
            <button className="btn-ghost" onClick={() => loan(loanAmt, "repay")}>
              상환
            </button>
          </div>
          {loanAmt > 0 && (
            <div className="mt-2 text-xs text-slate-500">
              {formatMoney(loanAmt)} 대출 시 분기 이자 약 <b className="text-bear">{formatMoney(loanInterest)}</b>씩
              추가됩니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Slider({
  icon,
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  icon?: string;
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const sliderMax = Math.max(max, value);
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-slate-600">
          {icon && <img src={icon} alt="" className="h-5 w-5 object-contain" />}
          {label}
        </span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={Math.round(value)}
            min={min}
            step={step}
            onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
            className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right font-bold text-brand-700 outline-none focus:border-brand-500"
          />
          <span className="text-xs text-slate-400">{format(value)}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={sliderMax}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
    </div>
  );
}

function Info({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "bad" }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`font-bold ${tone === "good" ? "text-bull" : tone === "bad" ? "text-bear" : "text-slate-800"}`}>
        {value}
      </div>
      {hint && <div className="text-[10px] text-amber-600">{hint}</div>}
    </div>
  );
}

function StatBar({ label, value, color, hint }: { label: React.ReactNode; value: number; color: string; hint?: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-700">{Math.round(value)}</span>
      </div>
      <Bar value={value} color={color} />
      {hint && <div className="mt-0.5 text-[10px] text-amber-600">{hint}</div>}
    </div>
  );
}
