"use client";

import React, { useState, useMemo } from "react";
import { formatDate, formatNum, formatPeso } from "@/lib/format";
import type { ModelMetric } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";

interface CompanyHistoryData {
  symbol: string;
  name: string;
  sector: string;
  model: string;
  metrics: Record<string, ModelMetric>;
  backtestDates: string[];
  backtestActual: number[];
  backtestByModel: Record<string, number[]>;
}

export default function ForecastHistoryClient({ data }: { data: CompanyHistoryData[] }) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(data[0]?.symbol || "ALI");
  const [showAllRows, setShowAllRows] = useState(false);

  const selectedCompany = useMemo(() => {
    return data.find((c) => c.symbol === selectedSymbol) || data[0];
  }, [data, selectedSymbol]);

  // Model key mapper
  const modelKeyMap: Record<string, string> = {
    "Lag-Informed Regression": "lag_reg",
    ARIMA: "arima",
    LSTM: "lstm",
    "Naive baseline": "naive",
  };

  const selectedMetrics = useMemo(() => {
    if (!selectedCompany) return null;
    const modelKey = modelKeyMap[selectedCompany.model] || "arima";
    return selectedCompany.metrics[modelKey] || null;
  }, [selectedCompany]);

  // Build table rows
  const historyRows = useMemo(() => {
    if (
      !selectedCompany ||
      !selectedCompany.backtestDates ||
      selectedCompany.backtestDates.length === 0 ||
      !selectedCompany.backtestActual ||
      selectedCompany.backtestActual.length === 0
    ) {
      return [];
    }

    const dates = selectedCompany.backtestDates;
    const actuals = selectedCompany.backtestActual;
    const preds = selectedCompany.backtestByModel[selectedCompany.model] || [];

    const rows = [];
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      const actual = actuals[i];
      const pred = preds[i];
      const error = pred !== undefined && actual !== undefined ? pred - actual : NaN;

      rows.push({
        date: d,
        predicted: pred,
        actual,
        error,
        model: selectedCompany.model,
      });
    }

    // Most recent forecasts first
    return rows.reverse();
  }, [selectedCompany]);

  // Build chart points (chronological order for graph)
  const chartData = useMemo(() => {
    if (historyRows.length === 0) return [];
    // Clone and reverse to get oldest -> newest for line chart
    return [...historyRows].reverse().map((r) => ({
      date: r.date,
      formattedDate: formatDate(r.date),
      Actual: r.actual,
      Predicted: r.predicted,
      Error: Number(r.error.toFixed(2)),
    }));
  }, [historyRows]);

  const maseVal = selectedMetrics ? parseFloat(String(selectedMetrics.mase)) : NaN;
  const beatsNaive = !isNaN(maseVal) && maseVal < 1.0;

  // Handle case with insufficient history
  if (!selectedCompany || historyRows.length === 0) {
    return (
      <div className="space-y-6">
        {/* Company Selector */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm">
          <label htmlFor="company-select" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Select Company
          </label>
          <select
            id="company-select"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {data.map((c) => (
              <option key={c.symbol} value={c.symbol}>
                {c.symbol} &mdash; {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center space-y-3">
          <p className="text-4xl">📂</p>
          <h3 className="text-lg font-bold text-white">Not enough forecast history yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Historical out-of-sample forecast logs are not currently available for {selectedSymbol}.
          </p>
        </div>
      </div>
    );
  }

  const displayedRows = showAllRows ? historyRows : historyRows.slice(0, 15);

  return (
    <div className="space-y-8">
      {/* 1. Selector & Header */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Active Stock Selection
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {selectedCompany.symbol}
            </h2>
            <span className="text-xs text-slate-400">({selectedCompany.name})</span>
            <span className="text-xs px-2.5 py-0.5 rounded bg-dark-bg border border-dark-border text-slate-300">
              {selectedCompany.sector}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="ticker-picker" className="text-xs text-slate-400">
            Switch Ticker:
          </label>
          <select
            id="ticker-picker"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            {data.map((c) => (
              <option key={c.symbol} value={c.symbol}>
                {c.symbol} ({c.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Accuracy Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Historical MAE</p>
          <p className="text-2xl font-bold text-white font-mono">
            {selectedMetrics ? `₱${formatNum(selectedMetrics.mae, 4)}` : "—"}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Average Absolute Deviation</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Historical RMSE</p>
          <p className="text-2xl font-bold text-white font-mono">
            {selectedMetrics ? `₱${formatNum(selectedMetrics.rmse, 4)}` : "—"}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Penalizes Extreme Misses</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">MASE Benchmark</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${beatsNaive ? "text-emerald-400" : "text-amber-400"}`}>
              {selectedMetrics ? formatNum(selectedMetrics.mase, 4) : "—"}
            </span>
            <span className="text-[10px] text-slate-400">
              {beatsNaive ? "(< 1 Beats Naive)" : "(≥ 1 Baseline)"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Scaled Accuracy Ratio</p>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Logged Sessions</p>
          <p className="text-2xl font-bold text-white font-mono">{historyRows.length}</p>
          <p className="text-[11px] text-brand-400 mt-1">{selectedCompany.model}</p>
        </div>
      </div>

      {/* 3. Historical Accuracy Line Chart */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-dark-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Historical Predicted vs. Actual Settlement
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log comparing what {selectedCompany.model} forecasted versus the realized settlement price.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Held-Out Test Window</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#243249" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `₱${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#111c2e",
                  border: "1px solid #243249",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                formatter={(val: any) => [`₱${Number(val).toFixed(2)}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="Actual"
                name="Actual Close (₱)"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Predicted"
                name={`Predicted Close (${selectedCompany.model})`}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Chronological Forecast Log Table */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm overflow-x-auto space-y-4">
        <div className="pb-3 border-b border-dark-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Chronological Forecast Log ({selectedCompany.symbol})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {displayedRows.length} of {historyRows.length} recorded forecast sessions (most recent first).
            </p>
          </div>

          <a
            href={`/companies/${selectedCompany.symbol}`}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium"
          >
            Go to {selectedCompany.symbol} Live Forecast →
          </a>
        </div>

        <table className="w-full text-xs sm:text-sm">
          <thead className="text-xs text-slate-400 uppercase bg-dark-bg/80 border-b border-dark-border">
            <tr>
              <th className="text-left py-2.5 px-3">Forecast Date</th>
              <th className="text-right py-2.5 px-3">Predicted Close</th>
              <th className="text-right py-2.5 px-3">Actual Close</th>
              <th className="text-right py-2.5 px-3">Forecast Error (₱)</th>
              <th className="text-left py-2.5 px-3">Selected Model</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/50 font-mono">
            {displayedRows.map((r, i) => {
              const isOver = r.error > 0;
              const isExact = r.error === 0;

              return (
                <tr key={i} className="hover:bg-dark-bg/40 transition-colors">
                  <td className="py-2.5 px-3 text-slate-200">{formatDate(r.date)}</td>
                  <td className="text-right py-2.5 px-3 text-white font-bold">{formatPeso(r.predicted)}</td>
                  <td className="text-right py-2.5 px-3 text-slate-300">{formatPeso(r.actual)}</td>
                  <td className="text-right py-2.5 px-3 font-semibold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        isExact
                          ? "text-slate-400 bg-slate-500/10"
                          : isOver
                          ? "text-amber-400 bg-amber-500/10"
                          : "text-blue-400 bg-blue-500/10"
                      }`}
                    >
                      {r.error > 0 ? "+" : ""}{formatPeso(r.error)}
                    </span>
                  </td>
                  <td className="text-left py-2.5 px-3 font-sans text-xs text-slate-400">
                    {r.model}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Expand / Collapse rows button */}
        {historyRows.length > 15 && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowAllRows(!showAllRows)}
              className="px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-xs text-slate-300 hover:text-white rounded-xl transition-colors font-medium cursor-pointer"
            >
              {showAllRows ? "Show Less (Latest 15 Sessions)" : `Show All ${historyRows.length} Recorded Sessions`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
