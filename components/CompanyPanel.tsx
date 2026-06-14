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
import { formatMoney, formatNum } from "@/lib/format";
import { Bar } from "./Sparkline";
import { Term } from "./Term";
import { MGMT_ICONS } from "@/lib/assetMap";

export function CompanyPanel({ game, company }: { game: GameState; company: Company }) {
  const setDecisions = useGameStore((s) => s.setDecisions);
  const loan = useGameStore((s) => s.loan);
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

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h3 className="mb-4 text-base font-bold text-slate-800">🏢 경영 결정</h3>

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
        <Slider
          icon={MGMT_ICONS.marketing}
          label={<><Term term="마케팅" /> 예산</>}
          value={d.marketingBudget}
          min={0}
          max={200000}
          step={5000}
          format={(v) => formatMoney(v)}
          onChange={(v) => setDecisions({ marketingBudget: v })}
        />
        <Slider
          icon={MGMT_ICONS.rnd}
          label={<><Term term="R&D" /> 예산</>}
          value={d.rndBudget}
          min={0}
          max={200000}
          step={5000}
          format={(v) => formatMoney(v)}
          onChange={(v) => setDecisions({ rndBudget: v })}
        />
        <Slider
          icon={MGMT_ICONS.welfare}
          label={<><Term term="사기">복지</Term> 예산</>}
          value={d.welfareBudget ?? 0}
          min={0}
          max={150000}
          step={5000}
          format={(v) => formatMoney(v)}
          onChange={(v) => setDecisions({ welfareBudget: v })}
        />
        <Slider
          icon={MGMT_ICONS.safety}
          label={<><Term term="안전">안전</Term> 예산</>}
          value={d.safetyBudget ?? 0}
          min={0}
          max={150000}
          step={5000}
          format={(v) => formatMoney(v)}
          onChange={(v) => setDecisions({ safetyBudget: v })}
        />

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
          <Info label="생산 능력" value={`${formatNum(capacity)}개`} />
          <Info label="예상 수요" value={`${formatNum(demand)}개`} hint={demand < d.productionTarget ? "수요<생산: 재고 위험" : "수요 충분"} />
          <Info label="재고" value={`${formatNum(company.inventory)}개`} />
          <Info label="지난 분기 이익" value={formatMoney(company.lastProfit)} tone={company.lastProfit >= 0 ? "good" : "bad"} />
        </div>
      </div>

      {/* Company stats */}
      <div className="card p-5">
        <h3 className="mb-3 text-base font-bold text-slate-800">📊 회사 상태</h3>
        <StatBar label={<Term term="품질">품질 / 기술</Term>} value={company.quality} color="#6366f1" />
        <StatBar label={<Term term="평판" />} value={company.reputation} color="#0ea5e9" />
        <StatBar label={<Term term="사기">직원 사기</Term>} value={company.morale} color="#16a34a" />
        <StatBar label={<Term term="안전" />} value={company.safety} color="#f59e0b" hint={company.safety < 40 ? "낮음! 사고 위험" : undefined} />
      </div>

      {/* Finance */}
      {game.config.showAdvancedMetrics && (
        <div className="card p-5">
          <h3 className="mb-3 text-base font-bold text-slate-800">💳 재무</h3>
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
