"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

export function PriceChart({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  const series = data.map((v, i) => ({ i, v: Math.round(v * 100) / 100 }));
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <YAxis domain={["auto", "auto"]} width={44} tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(v: number) => [v.toLocaleString(), "가격"]}
            labelFormatter={() => ""}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
