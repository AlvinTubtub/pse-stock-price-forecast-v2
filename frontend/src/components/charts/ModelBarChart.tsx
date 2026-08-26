"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const BAR_COLORS = ["#60a5fa", "#f59e0b", "#a855f7", "#64748b"];

export default function ModelBarChart({
  data,
  dataKey,
  label,
}: {
  data: { model: string; value: number }[];
  dataKey?: string;
  label: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="model" tick={{ fill: "var(--chart-tick)", fontSize: 11 }} />
        <YAxis tick={{ fill: "var(--chart-tick)", fontSize: 11 }} label={{ value: label, angle: -90, position: "insideLeft", fill: "var(--chart-label)", fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--chart-tooltip-text)", fontWeight: 600 }}
        />
        <Bar dataKey={dataKey ?? "value"} radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
