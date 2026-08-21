"use client";

import React, { useState, useMemo } from "react";
import ChangeBadge from "./ChangeBadge";
import { formatPeso, formatPct } from "@/lib/format";
import type { CompanySummary } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";

interface SectorsClientProps {
  companies: CompanySummary[];
}

function calculateMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default function SectorsClient({ companies }: { companies: CompanySummary[] }) {
  const [activeSector, setActiveSector] = useState<string | null>(null);

  // Group companies by sector
  const sectorData = useMemo(() => {
    const map: Record<string, CompanySummary[]> = {};
    for (const c of companies) {
      if (!map[c.sector]) map[c.sector] = [];
      map[c.sector].push(c);
    }

    return Object.entries(map).map(([sectorName, list]) => {
      const gainers = list.filter((c) => c.pctChange > 0).length;
      const losers = list.filter((c) => c.pctChange < 0).length;
      const unchanged = list.filter((c) => c.pctChange === 0).length;

      // Model frequencies
      const modelCounts: Record<string, number> = {};
      for (const c of list) {
        modelCounts[c.bestModel] = (modelCounts[c.bestModel] || 0) + 1;
      }
      let dominantModel = "ARIMA";
      let maxCount = 0;
      for (const [mod, cnt] of Object.entries(modelCounts)) {
        if (cnt > maxCount) {
          maxCount = cnt;
          dominantModel = mod;
        }
      }

      const pctChanges = list.map((c) => c.pctChange);
      const medianPctChange = calculateMedian(pctChanges);

      return {
        sector: sectorName,
        companies: list,
        count: list.length,
        gainers,
        losers,
        unchanged,
        dominantModel,
        medianPctChange: Number(medianPctChange.toFixed(2)),
      };
    });
  }, [companies]);

  const chartData = useMemo(() => {
    return sectorData.map((s) => ({
      sector: s.sector,
      medianChange: s.medianPctChange,
      isPositive: s.medianPctChange >= 0,
    }));
  }, [sectorData]);

  return (
    <div className="space-y-8">
      {/* 1. Sector Median Expected Change Chart */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-dark-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Median Expected Change (%) by Sector
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cross-sector overview of next-session median price momentum.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">1-Session Horizon</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#243249" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="sector"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                interval={0}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                unit="%"
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "#111c2e",
                  border: "1px solid #243249",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                formatter={(val: any) => [`${val > 0 ? "+" : ""}${val}%`, "Median Expected Change"]}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" />
              <Bar dataKey="medianChange" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.sector}
                    fill={entry.isPositive ? "#22c55e" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Sector Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Tracked PSE Industry Sectors
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any sector to view its constituent stocks and model details.
            </p>
          </div>
          {activeSector && (
            <button
              type="button"
              onClick={() => setActiveSector(null)}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium cursor-pointer"
            >
              Show All Sectors
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectorData.map((sec) => {
            const isSelected = activeSector === sec.sector;
            return (
              <div
                key={sec.sector}
                className={`bg-dark-card border rounded-2xl p-5 shadow-sm space-y-4 transition-all ${
                  isSelected
                    ? "border-brand-500 ring-1 ring-brand-500/30"
                    : "border-dark-border hover:border-slate-600"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base tracking-tight">{sec.sector}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {sec.count} PSE-listed companies tracked
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full border ${
                      sec.medianPctChange >= 0
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    Median: {sec.medianPctChange >= 0 ? "+" : ""}{sec.medianPctChange.toFixed(2)}%
                  </span>
                </div>

                {/* Metrics */}
                <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Direction Breadth</span>
                    <span className="font-mono text-slate-200 font-medium">
                      <strong className="text-emerald-400">{sec.gainers} ↑</strong> /{" "}
                      <strong className="text-rose-400">{sec.losers} ↓</strong>
                      {sec.unchanged > 0 && <span> ({sec.unchanged} =)</span>}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block">Dominant Model</span>
                    <span className="font-medium text-white truncate block" title={sec.dominantModel}>
                      {sec.dominantModel}
                    </span>
                  </div>
                </div>

                {/* Companies list */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Companies in {sec.sector}
                  </span>
                  <div className="space-y-1.5">
                    {sec.companies.map((c) => (
                      <a
                        key={c.symbol}
                        href={`/companies/${c.symbol}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-dark-bg/60 hover:bg-dark-bg border border-dark-border/60 hover:border-brand-500/30 transition-all text-xs group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white group-hover:text-brand-400 transition-colors font-mono">
                            {c.symbol}
                          </span>
                          <span className="text-slate-400 truncate max-w-[120px] text-[11px]">
                            {c.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-300 font-semibold">{formatPeso(c.predictedClose)}</span>
                          <ChangeBadge pctChange={c.pctChange} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Footer link */}
                <div className="pt-2 border-t border-dark-border/40 text-right">
                  <button
                    type="button"
                    onClick={() => setActiveSector(isSelected ? null : sec.sector)}
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium cursor-pointer"
                  >
                    {isSelected ? "Collapse Details" : `Focus on ${sec.sector} →`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
