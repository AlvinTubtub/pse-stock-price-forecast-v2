"use client";

import React, { useState } from "react";
import { formatDate, formatPct, formatPeso } from "@/lib/format";

interface ForecastSummaryCardProps {
  symbol: string;
  name?: string;
  previousClose: number;
  predictedClose: number;
  pesoChange: number;
  pctChange: number;
  model: string;
  forecastDate?: string;
  dataAsOf?: string | null;
}

export default function ForecastSummaryCard({
  symbol,
  name,
  previousClose,
  predictedClose,
  pesoChange,
  pctChange,
  model,
  forecastDate,
  dataAsOf,
}: ForecastSummaryCardProps) {
  const [showWhyModal, setShowWhyModal] = useState(false);

  const isPositive = pctChange > 0;
  const isNegative = pctChange < 0;
  const directionLabel = isPositive
    ? "Potential Increase"
    : isNegative
    ? "Potential Decrease"
    : "Potential Neutral";
  const directionArrow = isPositive ? "↑" : isNegative ? "↓" : "→";
  const directionColor = isPositive
    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
    : isNegative
    ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
    : "text-slate-400 border-slate-500/30 bg-slate-500/10";

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden space-y-5">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-dark-border/70">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-0.5">
            Executive Summary
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Forecast Summary for {symbol} {name && <span className="text-sm font-normal text-slate-400">({name})</span>}
          </h2>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${directionColor}`}>
            <span className="text-sm font-bold leading-none">{directionArrow}</span>
            <span>{directionLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowWhyModal(true)}
            className="px-3 py-1 rounded-full bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs font-semibold transition-colors cursor-pointer"
            aria-label="Why this forecast explanation"
          >
            ❓ Why this forecast?
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-1">
        <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Previous Close</p>
          <p className="text-xl font-bold text-white font-mono">{formatPeso(previousClose)}</p>
          {dataAsOf && (
            <p className="text-[11px] text-slate-500 mt-1">Settled on {formatDate(dataAsOf)}</p>
          )}
        </div>

        <div className="bg-dark-bg/80 border border-brand-500/30 rounded-xl p-4 ring-1 ring-brand-500/20">
          <p className="text-xs text-brand-300 font-medium mb-1">Forecasted Close</p>
          <p className="text-2xl font-bold text-white font-mono">{formatPeso(predictedClose)}</p>
          {forecastDate && (
            <p className="text-[11px] text-brand-400 mt-1">Target: {formatDate(forecastDate)}</p>
          )}
        </div>

        <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Expected Change</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold font-mono ${isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-slate-300"}`}>
              {pesoChange > 0 ? "+" : ""}{formatPeso(pesoChange)}
            </span>
            <span className={`text-xs font-semibold ${isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-slate-400"}`}>
              ({formatPct(pctChange)})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Relative Price Shift</p>
        </div>

        <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Selected Model</p>
          <p className="text-base font-bold text-white truncate" title={model}>
            {model}
          </p>
          <p className="text-[11px] text-brand-400 mt-1">Lowest out-of-sample RMSE</p>
        </div>
      </div>

      {/* Brief Summary Text */}
      <div className="pt-3 text-xs text-slate-300 leading-relaxed bg-brand-500/5 rounded-xl p-4 border border-brand-500/15">
        <p>
          <strong className="text-white font-medium">Educational Estimate: </strong>
          The selected model ({model}) estimates that the next trading session&apos;s closing price may be{" "}
          {isPositive ? "higher than" : isNegative ? "lower than" : "approximately equal to"}{" "}
          the previous close ({formatPeso(previousClose)} → {formatPeso(predictedClose)}).
        </p>
        <p className="text-slate-400 mt-1.5 text-[11px]">
          Forecasts are statistical models for academic decision-support and do not constitute financial advice, buy/sell signals, or guaranteed outcomes.
        </p>
      </div>

      {/* "Why this forecast?" Modal */}
      {showWhyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Why this forecast explanation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowWhyModal(false)}
        >
          <div
            className="w-full max-w-lg bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-dark-border">
              <div>
                <h3 className="text-base font-bold text-white">Why This Forecast?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Model Selection Rationale for {symbol}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowWhyModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-dark-bg/80 border border-dark-border p-3.5 rounded-xl space-y-1.5">
                <span className="text-brand-300 font-semibold uppercase font-mono text-[11px]">1. Model Selection Rule</span>
                <p>
                  For {symbol}, <strong className="text-white">{model}</strong> was autonomously selected because it achieved the <strong className="text-white">lowest Root Mean Squared Error (RMSE)</strong> among all candidate models (ARIMA, Lag-Informed Regression, and LSTM) during chronological out-of-sample backtesting.
                </p>
              </div>

              <div className="bg-dark-bg/80 border border-dark-border p-3.5 rounded-xl space-y-1.5">
                <span className="text-emerald-400 font-semibold uppercase font-mono text-[11px]">2. Step-Ahead Prediction</span>
                <p>
                  The model takes the most recent historical market sequence up to {dataAsOf ? formatDate(dataAsOf) : "the latest session"} and computes the single next trading-session closing price estimate ({formatPeso(predictedClose)}).
                </p>
              </div>

              <div className="bg-dark-bg/80 border border-dark-border p-3.5 rounded-xl space-y-1.5">
                <span className="text-amber-400 font-semibold uppercase font-mono text-[11px]">3. Responsible Analytical Scope</span>
                <p>
                  This forecast is derived purely from numerical price and volume action. It does not integrate real-time corporate disclosures, political events, or breaking macroeconomic news. Never rely on statistical forecasts as investment advice.
                </p>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                type="button"
                onClick={() => setShowWhyModal(false)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
