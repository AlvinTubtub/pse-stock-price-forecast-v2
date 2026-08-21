"use client";

import React, { useState, useEffect } from "react";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import type { SiteConfig } from "@/lib/admin/types";
import type { MetricsData } from "@/lib/types";
import { formatNum } from "@/lib/format";

export default function ModelsAdminPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmTraining, setConfirmTraining] = useState(false);

  useEffect(() => {
    fetch("/forecasts/metrics.json")
      .then((r) => r.json())
      .then((data) => setMetrics(data))
      .catch(() => {});

    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.config) {
          setConfig(data.config);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleModel = async (modelId: "arima" | "lag_reg" | "lstm") => {
    if (!config) return;
    const current = config.models[modelId]?.enabled !== false;
    const updated = {
      ...config.models,
      [modelId]: {
        ...config.models[modelId],
        enabled: !current,
      },
    };

    const updatedConfig: SiteConfig = {
      ...config,
      models: updated,
    };

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: updatedConfig,
          changesSummary: `Toggled ${modelId.toUpperCase()} model state to ${!current ? "ENABLED" : "DISABLED"}.`,
        }),
      });

      if (!res.ok) throw new Error("Failed to update model configuration.");
      setConfig(updatedConfig);
      setFeedback({
        type: "success",
        text: `Model ${modelId.toUpperCase()} is now ${!current ? "ENABLED" : "DISABLED"}.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update model." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerTraining = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "training" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Training dispatch failed.");

      setFeedback({
        type: "success",
        text: "Weekly model training workflow dispatched to GitHub Actions successfully.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Training dispatch failed." });
    } finally {
      setIsSaving(false);
      setConfirmTraining(false);
    }
  };

  const modelDefinitions = [
    {
      id: "arima" as const,
      name: "ARIMA (AutoRegressive Integrated Moving Average)",
      type: "Classical Time-Series",
      inputFeatures: "Historical Close prices only",
      desc: "Stationary differencing, autoregressive terms, and moving average residuals. Serves as our primary econometric benchmark.",
      metrics: metrics?.aggregate?.arima,
    },
    {
      id: "lag_reg" as const,
      name: "Lag-Informed Regression",
      type: "Linear Machine Learning",
      inputFeatures: "Price lags, Volume lags, LASSO selection",
      desc: "Autoregressive multi-day feature engineering with Partial Autocorrelation (PACF) lag discovery and LASSO regularization penalty.",
      metrics: metrics?.aggregate?.lag_reg,
    },
    {
      id: "lstm" as const,
      name: "LSTM (Long Short-Term Memory Neural Network)",
      type: "Deep Recurrent Sequence Model",
      inputFeatures: "Sequential normalized price and volume windows",
      desc: "PyTorch deep neural architecture with memory gates capturing non-linear multi-day temporal dependencies.",
      metrics: metrics?.aggregate?.lstm,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Machine Learning Architectures
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Forecasting Model Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Inspect model training states, cross-stock aggregate test performance, and trigger full retraining workflows.
          </p>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => setConfirmTraining(true)}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <span>🧠</span>
          <span>Run Full Model Retraining</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* 3 Model Cards */}
      <div className="space-y-5">
        {modelDefinitions.map((model) => {
          const isEnabled = config?.models[model.id]?.enabled !== false;
          const lastTrained = config?.models[model.id]?.lastTrained || "2026-08-19";

          return (
            <div
              key={model.id}
              className={`bg-dark-card border rounded-2xl p-6 shadow-sm space-y-4 transition-all ${
                isEnabled ? "border-dark-border" : "border-slate-700/50 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-dark-border/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">{model.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-dark-bg border border-dark-border text-slate-300">
                      {model.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-2xl">{model.desc}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">
                    Status: <strong className={isEnabled ? "text-emerald-400" : "text-slate-500"}>{isEnabled ? "Enabled" : "Disabled"}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleToggleModel(model.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isEnabled
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    }`}
                  >
                    {isEnabled ? "Disable Model" : "Enable Model"}
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3">
                  <span className="text-slate-500 block mb-0.5">Input Features</span>
                  <span className="font-semibold text-white truncate block">{model.inputFeatures}</span>
                </div>

                <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3">
                  <span className="text-slate-500 block mb-0.5">Last Retrained</span>
                  <span className="font-semibold text-white font-mono">{lastTrained}</span>
                </div>

                <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3">
                  <span className="text-slate-500 block mb-0.5">Cross-Stock Median RMSE</span>
                  <span className="font-semibold text-white font-mono">
                    {model.metrics ? `₱${formatNum(model.metrics.rmse, 3)}` : "—"}
                  </span>
                </div>

                <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3">
                  <span className="text-slate-500 block mb-0.5">Cross-Stock Median MASE</span>
                  <span className="font-semibold text-emerald-400 font-mono">
                    {model.metrics ? formatNum(model.metrics.mase, 3) : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmTraining && (
        <ConfirmationModal
          isOpen={true}
          title="Dispatch Full Weekly Model Retraining"
          message="WARNING: This will trigger `.github/workflows/train_models.yml` to retrain all models on GitHub Actions cloud compute. This takes 30-45 minutes."
          danger={true}
          isLoading={isSaving}
          confirmText="Yes, Trigger Retraining"
          onConfirm={handleTriggerTraining}
          onCancel={() => setConfirmTraining(false)}
        />
      )}
    </div>
  );
}
