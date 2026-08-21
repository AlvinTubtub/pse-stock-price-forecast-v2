"use client";

import React, { useState } from "react";
import { formatNum } from "@/lib/format";
import type { ModelMetric } from "@/lib/types";

interface ModelReliabilitySnapshotProps {
  symbol: string;
  selectedModel: string;
  metrics: ModelMetric;
}

export default function ModelReliabilitySnapshot({
  symbol,
  selectedModel,
  metrics,
}: ModelReliabilitySnapshotProps) {
  const [activeModal, setActiveModal] = useState<"howItWorks" | "beatBaseline" | "naiveBaseline" | null>(null);

  const rmse = formatNum(metrics.rmse, 4);
  const mae = formatNum(metrics.mae, 4);
  const mase = formatNum(metrics.mase, 4);
  const r2 = formatNum(metrics.r2, 4);

  const maseVal = parseFloat(String(metrics.mase));
  const beatsNaive = !isNaN(maseVal) && maseVal < 1.0;

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-border/70">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-0.5">
            Validation &amp; Accuracy
          </span>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Model Reliability Snapshot
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Measured on the 15% chronological out-of-sample test window for {symbol}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold border ${
              beatsNaive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
          >
            {beatsNaive ? "✓ Better than Naive Baseline" : "⚠ Equal / Slower than Baseline"}
          </span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* RMSE */}
        <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-wide block mb-1">
              Test RMSE
            </span>
            <p className="text-xl font-bold text-white font-mono">₱{rmse}</p>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-tight">
            Typical error size, heavily penalizing large misses.
          </p>
        </div>

        {/* MAE */}
        <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide block mb-1">
              Test MAE
            </span>
            <p className="text-xl font-bold text-white font-mono">₱{mae}</p>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-tight">
            Average absolute misestimation distance in Pesos.
          </p>
        </div>

        {/* MASE */}
        <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide block mb-1">
              MASE
            </span>
            <p className={`text-xl font-bold font-mono ${beatsNaive ? "text-emerald-400" : "text-amber-400"}`}>
              {mase}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-tight">
            &lt; 1.0 indicates superior accuracy to the naive benchmark.
          </p>
        </div>

        {/* R² */}
        <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide block mb-1">
              R² (Goodness of Fit)
            </span>
            <p className="text-xl font-bold text-white font-mono">{r2}</p>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-tight">
            Explained price variance in test split (not probability).
          </p>
        </div>
      </div>

      {/* Interactive Plain-English Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setActiveModal("howItWorks")}
          className="px-3 py-1.5 rounded-lg bg-dark-bg hover:bg-dark-bg/60 border border-dark-border text-xs text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
        >
          🔍 How does this model work?
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("beatBaseline")}
          className="px-3 py-1.5 rounded-lg bg-dark-bg hover:bg-dark-bg/60 border border-dark-border text-xs text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
        >
          ⚖️ Does this model beat the simple baseline?
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("naiveBaseline")}
          className="px-3 py-1.5 rounded-lg bg-dark-bg hover:bg-dark-bg/60 border border-dark-border text-xs text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
        >
          ❓ What is the Naive baseline?
        </button>
      </div>

      {/* Modal 1: How does this model work? */}
      {activeModal === "howItWorks" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-dark-border">
              <h3 className="text-base font-bold text-white">How Forecasting Models Work</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-dark-bg/80 border border-dark-border p-3.5 rounded-xl space-y-1">
                <h4 className="font-bold text-white text-sm">📈 ARIMA (AutoRegressive Integrated Moving Average)</h4>
                <p>
                  <strong>Input Features:</strong> Historical <strong className="text-brand-300">Close prices only</strong>.
                </p>
                <p>
                  ARIMA models time-series stationarity through differencing, past autoregressive lag coefficients, and moving average error adjustments. It serves as our econometric benchmark.
                </p>
              </div>

              <div className="bg-dark-bg/80 border border-dark-border p-3.5 rounded-xl space-y-1">
                <h4 className="font-bold text-white text-sm">🧮 Lag-Informed Regression</h4>
                <p>
                  <strong>Input Features:</strong> Multi-day price lags, volume metrics, and engineered technical features.
                </p>
                <p>
                  Uses Partial Autocorrelation (PACF) to discover repetitive multi-day cycles and LASSO regularization to penalize unhelpful features, creating an interpretable predictive model.
                </p>
              </div>

              <div className="bg-dark-bg/80 border border-dark-border p-3.5 rounded-xl space-y-1">
                <h4 className="font-bold text-white text-sm">🧠 LSTM (Long Short-Term Memory Neural Network)</h4>
                <p>
                  <strong>Input Features:</strong> Sequential window of normalized historical price and volume time series.
                </p>
                <p>
                  A recurrent deep learning architecture with memory and forget gates that captures non-linear temporal interactions across longer market sequences.
                </p>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Does this model beat the simple baseline? */}
      {activeModal === "beatBaseline" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-dark-border">
              <h3 className="text-base font-bold text-white">Baseline Comparison (MASE)</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-dark-bg border border-dark-border space-y-1">
                <span className="text-slate-400 font-mono text-[11px]">Calculated MASE for {symbol}:</span>
                <p className={`text-2xl font-bold font-mono ${beatsNaive ? "text-emerald-400" : "text-amber-400"}`}>
                  {mase}
                </p>
                <p className="font-semibold text-white mt-1">
                  {beatsNaive
                    ? "✓ This model successfully outperformed the naive baseline."
                    : "⚠ This model performed equal to or slightly worse than naive persistence."}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <p>
                  <strong>How to interpret MASE:</strong>
                </p>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-400">
                  <li><strong className="text-emerald-400">MASE &lt; 1.0:</strong> The model produced lower errors than naive persistence.</li>
                  <li><strong className="text-slate-300">MASE = 1.0:</strong> Equivalent performance to guessing yesterday&apos;s price.</li>
                  <li><strong className="text-amber-400">MASE &gt; 1.0:</strong> The model had higher errors than simply guessing the previous close.</li>
                </ul>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: What is the Naive baseline? */}
      {activeModal === "naiveBaseline" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-dark-border">
              <h3 className="text-base font-bold text-white">What is the Naive Baseline?</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                In financial econometrics, the <strong className="text-white">Naive Baseline (Random Walk Persistence)</strong> is the simplest possible benchmark:
              </p>
              <div className="bg-dark-bg border border-brand-500/30 p-3 rounded-xl text-center font-mono text-brand-300 font-semibold text-xs">
                Forecast(Tomorrow) = Actual Close(Today)
              </div>
              <p>
                Because stock prices often follow near-random-walk dynamics on efficient markets, beating the naive baseline is challenging. If a machine learning model cannot achieve a MASE &lt; 1.0, its forecasts are not adding value over standard persistence.
              </p>
            </div>

            <div className="text-right pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
