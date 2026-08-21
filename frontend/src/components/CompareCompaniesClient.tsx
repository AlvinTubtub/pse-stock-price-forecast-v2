"use client";

import React, { useState, useMemo } from "react";
import ChangeBadge from "./ChangeBadge";
import { formatNum, formatPeso, formatPct } from "@/lib/format";
import type { CompanySummary, MetricsData } from "@/lib/types";
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

interface CompareCompaniesClientProps {
  companies: CompanySummary[];
  metrics: MetricsData | null;
}

export default function CompareCompaniesClient({
  companies,
  metrics,
}: CompareCompaniesClientProps) {
  // Default selected: 3 diverse companies
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([
    "ALI",
    "BPI",
    "GLO",
  ]);

  const toggleSymbol = (sym: string) => {
    if (selectedSymbols.includes(sym)) {
      if (selectedSymbols.length <= 2) {
        // Enforce minimum 2
        return;
      }
      setSelectedSymbols(selectedSymbols.filter((s) => s !== sym));
    } else {
      if (selectedSymbols.length >= 4) {
        // Enforce maximum 4
        return;
      }
      setSelectedSymbols([...selectedSymbols, sym]);
    }
  };

  const selectedCompanies = useMemo(() => {
    return selectedSymbols
      .map((sym) => companies.find((c) => c.symbol === sym))
      .filter(Boolean) as CompanySummary[];
  }, [selectedSymbols, companies]);

  // Model key mapper
  const modelKeyMap: Record<string, string> = {
    "Lag-Informed Regression": "lag_reg",
    ARIMA: "arima",
    LSTM: "lstm",
    "Naive baseline": "naive",
  };

  // Build row data for comparison
  const comparisonData = useMemo(() => {
    return selectedCompanies.map((c) => {
      const perComp = metrics?.perCompany?.[c.symbol];
      const modelKey = modelKeyMap[c.bestModel] || "arima";
      const m = perComp?.metrics?.[modelKey];

      const rmse = m ? (typeof m.rmse === "number" ? m.rmse : parseFloat(String(m.rmse))) : NaN;
      const mae = m ? (typeof m.mae === "number" ? m.mae : parseFloat(String(m.mae))) : NaN;
      const mase = m ? (typeof m.mase === "number" ? m.mase : parseFloat(String(m.mase))) : NaN;
      const beatsNaive = !isNaN(mase) && mase < 1.0;

      const pesoChange = c.predictedClose - c.latestClose;

      return {
        company: c,
        rmse,
        mae,
        mase,
        beatsNaive,
        pesoChange,
      };
    });
  }, [selectedCompanies, metrics]);

  // Chart data for Expected Change (%)
  const chartData = useMemo(() => {
    return comparisonData.map((d) => ({
      symbol: d.company.symbol,
      pctChange: Number(d.company.pctChange.toFixed(2)),
      isPositive: d.company.pctChange >= 0,
    }));
  }, [comparisonData]);

  return (
    <div className="space-y-8">
      {/* 1. Selector Section */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Select Stocks to Compare (2 to 4)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Currently comparing {selectedSymbols.length} of 4 allowed stocks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedSymbols.length < 2 && (
              <span className="text-xs text-amber-400 font-medium">Select at least 2 stocks</span>
            )}
            {selectedSymbols.length === 4 && (
              <span className="text-xs text-brand-300 font-medium">Maximum 4 stocks selected</span>
            )}
          </div>
        </div>

        {/* Ticker Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {companies.map((c) => {
            const isSelected = selectedSymbols.includes(c.symbol);
            const isMaxReached = selectedSymbols.length >= 4 && !isSelected;
            const isMinReached = selectedSymbols.length <= 2 && isSelected;

            return (
              <button
                key={c.symbol}
                type="button"
                onClick={() => toggleSymbol(c.symbol)}
                disabled={isMaxReached}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSelected
                    ? "bg-brand-600 text-white shadow-sm ring-1 ring-brand-400"
                    : "bg-dark-bg/90 hover:bg-dark-bg text-slate-300 border border-dark-border hover:border-slate-600"
                }`}
                title={isMinReached ? "Minimum 2 stocks required" : isMaxReached ? "Maximum 4 stocks" : undefined}
              >
                <span>{isSelected ? "✓" : "+"}</span>
                <span>{c.symbol}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-sans ${
                    isSelected ? "bg-brand-700 text-white" : "bg-dark-card text-slate-400"
                  }`}
                >
                  {c.pctChange >= 0 ? "+" : ""}{c.pctChange.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Visual Comparison Chart: Expected Change (%) */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-dark-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Expected Change (%) Comparison
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparing next-session expected price movement across selected securities.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">1-Day Horizon</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#243249" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="symbol" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: "bold" }} />
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
                formatter={(val: any) => [`${val > 0 ? "+" : ""}${val}%`, "Expected Change"]}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" />
              <Bar dataKey="pctChange" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.symbol}
                    fill={entry.isPositive ? "#22c55e" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Concise Comparison Table */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm overflow-x-auto space-y-4">
        <div className="pb-3 border-b border-dark-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Side-by-Side Stock Metrics
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed comparison of forecasts, selected models, and error benchmarks.
            </p>
          </div>
        </div>

        <table className="w-full text-xs sm:text-sm">
          <thead className="text-xs text-slate-400 uppercase bg-dark-bg/80 border-b border-dark-border">
            <tr>
              <th className="text-left py-3 px-3.5">Metric</th>
              {comparisonData.map((d) => (
                <th key={d.company.symbol} className="text-left py-3 px-3.5 min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm">{d.company.symbol}</span>
                    <a
                      href={`/companies/${d.company.symbol}`}
                      className="text-brand-400 hover:text-brand-300 text-[11px] uppercase font-normal ml-auto"
                    >
                      View →
                    </a>
                  </div>
                  <span className="text-[11px] text-slate-400 normal-case block truncate max-w-[150px]">
                    {d.company.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/50">
            {/* Sector */}
            <tr className="hover:bg-dark-bg/40">
              <td className="py-2.5 px-3.5 font-medium text-slate-400">Sector</td>
              {comparisonData.map((d) => (
                <td key={d.company.symbol} className="py-2.5 px-3.5 text-slate-200">
                  <span className="px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-[11px]">
                    {d.company.sector}
                  </span>
                </td>
              ))}
            </tr>

            {/* Previous Close */}
            <tr className="hover:bg-dark-bg/40">
              <td className="py-2.5 px-3.5 font-medium text-slate-400">Previous Close</td>
              {comparisonData.map((d) => (
                <td key={d.company.symbol} className="py-2.5 px-3.5 font-mono text-slate-200">
                  {formatPeso(d.company.latestClose)}
                </td>
              ))}
            </tr>

            {/* Forecasted Close */}
            <tr className="hover:bg-dark-bg/40 bg-brand-500/5">
              <td className="py-2.5 px-3.5 font-medium text-brand-300">Forecasted Close</td>
              {comparisonData.map((d) => (
                <td key={d.company.symbol} className="py-2.5 px-3.5 font-mono font-bold text-white">
                  {formatPeso(d.company.predictedClose)}
                </td>
              ))}
            </tr>

            {/* Expected Change */}
            <tr className="hover:bg-dark-bg/40">
              <td className="py-2.5 px-3.5 font-medium text-slate-400">Expected Change</td>
              {comparisonData.map((d) => (
                <td key={d.company.symbol} className="py-2.5 px-3.5">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span
                      className={`font-semibold ${
                        d.company.pctChange >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {d.pesoChange > 0 ? "+" : ""}{formatPeso(d.pesoChange)}
                    </span>
                    <ChangeBadge pctChange={d.company.pctChange} />
                  </div>
                </td>
              ))}
            </tr>

            {/* Selected Model */}
            <tr className="hover:bg-dark-bg/40">
              <td className="py-2.5 px-3.5 font-medium text-slate-400">Selected Model</td>
              {comparisonData.map((d) => (
                <td key={d.company.symbol} className="py-2.5 px-3.5 text-white font-medium">
                  {d.company.bestModel}
                </td>
              ))}
            </tr>

            {/* Test RMSE */}
            <tr className="hover:bg-dark-bg/40">
              <td className="py-2.5 px-3.5 font-medium text-slate-400">Test RMSE (₱)</td>
              {comparisonData.map((d) => (
                <td key={d.company.symbol} className="py-2.5 px-3.5 font-mono text-slate-300">
                  {isNaN(d.rmse) ? "—" : `₱${formatNum(d.rmse, 4)}`}
                </td>
              ))}
            </tr>

            {/* MASE */}
            <tr className="hover:bg-dark-bg/40">
              <td className="py-2.5 px-3.5 font-medium text-slate-400">MASE (Scaled Error)</td>
              {comparisonData.map((d) => (
                <td key={d.company.symbol} className="py-2.5 px-3.5 font-mono">
                  {isNaN(d.mase) ? (
                    "—"
                  ) : (
                    <span className={d.beatsNaive ? "text-emerald-400 font-bold" : "text-amber-400"}>
                      {formatNum(d.mase, 4)}
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* Beats Naive? */}
            <tr className="hover:bg-dark-bg/40">
              <td className="py-2.5 px-3.5 font-medium text-slate-400">Beats Naive Baseline?</td>
              {comparisonData.map((d) => (
                <td key={d.company.symbol} className="py-2.5 px-3.5">
                  {isNaN(d.mase) ? (
                    "—"
                  ) : d.beatsNaive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ✓ Yes (MASE &lt; 1)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      ⚠ Baseline
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
