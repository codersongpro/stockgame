"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  ReferenceLine,
} from "recharts";

export function PriceChart({
  data,
  color = "#6366f1",
  dark = false,
  className = "h-40",
}: {
  data: number[];
  color?: string;
  dark?: boolean;
  className?: string;
}) {
  const uid = useId();
  const gradId = `grad-${uid.replace(/:/g, "")}`;
  const series = data.map((v, i) => ({ i, v: Math.round(v * 100) / 100 }));
  const isUp = series.length > 1 && series[series.length - 1].v >= series[0].v;
  const lineColor = dark ? (isUp ? "#22c55e" : "#ef4444") : color;
  const basePrice = series[0]?.v;

  return (
    <div className={`${className} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={dark ? 0.25 : 0.18} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis
            domain={["auto", "auto"]}
            width={42}
            tick={{ fontSize: 9, fill: dark ? "#475569" : "#94a3b8" }}
            tickLine={false}
            axisLine={false}
          />
          {dark && basePrice != null && (
            <ReferenceLine
              y={basePrice}
              stroke="#334155"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}
          <Tooltip
            formatter={(v: number) => [v.toLocaleString(), "가격"]}
            labelFormatter={() => ""}
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              background: dark ? "#1e293b" : "#ffffff",
              border: dark ? "1px solid #334155" : "1px solid #e2e8f0",
              color: dark ? "#f1f5f9" : "#1e293b",
              padding: "4px 10px",
            }}
            cursor={{ stroke: dark ? "#475569" : "#cbd5e1", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={lineColor}
            strokeWidth={1.8}
            fill={`url(#${gradId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
