"use client";

import React, { useState, useEffect } from "react";
import type { SiteConfig, FeatureFlags, LayoutMode } from "@/lib/admin/types";

export default function FrontendControlsAdminPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [features, setFeatures] = useState<FeatureFlags>({
    aiAssistant: true,
    compareCompanies: true,
    sectorOverview: true,
    forecastHistory: true,
    historicalOhlcv: true,
    nextDayPrediction: true,
    backtest: true,
    forecastError: true,
    modelPerformance: true,
    learnStocks: true,
  });
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("standard");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.config) {
          setConfig(data.config);
          setFeatures(data.config.features);
          setLayoutMode(data.config.layoutMode || "standard");
        }
      })
      .catch(() => {});
  }, []);

  const handleToggle = (key: keyof FeatureFlags) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    setFeedback(null);

    const updatedConfig: SiteConfig = {
      ...config,
      features,
      layoutMode,
    };

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: updatedConfig,
          changesSummary: `Updated frontend feature toggles and layout mode (${layoutMode.toUpperCase()}).`,
        }),
      });

      if (!res.ok) throw new Error("Failed to save changes.");
      setConfig(updatedConfig);
      setFeedback({
        type: "success",
        text: "Frontend controls saved and published to public site.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Save failed." });
    } finally {
      setIsSaving(false);
    }
  };

  const featureItems: { key: keyof FeatureFlags; label: string; desc: string; category: string }[] = [
    {
      key: "aiAssistant",
      label: "AI Assistant (Floating Chatbot)",
      desc: "Enables the Gemini-powered educational chatbot on all public pages.",
      category: "Intelligence",
    },
    {
      key: "compareCompanies",
      label: "Compare Companies Page (/compare-companies)",
      desc: "Enables multi-stock side-by-side metric comparison and expected change chart.",
      category: "Analytical Pages",
    },
    {
      key: "sectorOverview",
      label: "Sector Overview Page (/sectors)",
      desc: "Enables 5-sector industry momentum and breadth analytics.",
      category: "Analytical Pages",
    },
    {
      key: "forecastHistory",
      label: "Forecast History Page (/forecast-history)",
      desc: "Enables 60-session out-of-sample backtest accuracy and residual error tracking.",
      category: "Analytical Pages",
    },
    {
      key: "modelPerformance",
      label: "Model Performance & Benchmarks (/compare)",
      desc: "Enables cross-model comparisons and Friedman hypothesis test results.",
      category: "Analytical Pages",
    },
    {
      key: "learnStocks",
      label: "Learn Stocks Guide (/learn)",
      desc: "Enables beginner-friendly financial education and technical terminology guide.",
      category: "Educational",
    },
    {
      key: "historicalOhlcv",
      label: "Historical OHLCV Line Chart",
      desc: "Shows official PSE daily price and trading volume time-series.",
      category: "Company Charts",
    },
    {
      key: "nextDayPrediction",
      label: "Next-Day Prediction vs Trend Chart",
      desc: "Shows latest historical close prices and dashed step-ahead forecast endpoints.",
      category: "Company Charts",
    },
    {
      key: "backtest",
      label: "Backtest (Predicted vs. Actual) Chart",
      desc: "Shows chronological test window predictions versus realized settlement prices.",
      category: "Company Charts",
    },
    {
      key: "forecastError",
      label: "Forecast Error Over Time (Residuals)",
      desc: "Shows session-by-session deviation (Predicted − Actual in ₱).",
      category: "Company Charts",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Site Orchestration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Frontend Features &amp; Layout Mode
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enable or disable public website features, chart modules, and configure layout progressive disclosure.
          </p>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
        >
          {isSaving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          <span>Save &amp; Publish Changes</span>
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

      {/* 1. Public Layout Mode Selector */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Public Layout Complexity Mode
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Progressive disclosure setting to prevent information overload for target stakeholders.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {/* Beginner */}
          <button
            type="button"
            onClick={() => setLayoutMode("beginner")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              layoutMode === "beginner"
                ? "bg-brand-500/15 border-brand-500 ring-1 ring-brand-500/40"
                : "bg-dark-bg/80 border-dark-border hover:border-slate-600"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-white text-sm">Beginner Mode</span>
              <span className="text-base">🌱</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Focuses on Forecast Summary, Historical OHLCV, Next-Day Prediction, and Backtest. Simplifies technical jargon.
            </p>
          </button>

          {/* Standard */}
          <button
            type="button"
            onClick={() => setLayoutMode("standard")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              layoutMode === "standard"
                ? "bg-brand-500/15 border-brand-500 ring-1 ring-brand-500/40"
                : "bg-dark-bg/80 border-dark-border hover:border-slate-600"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-white text-sm">Standard Mode (Recommended)</span>
              <span className="text-base">⚖️</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Balanced progressive disclosure with summary-first hierarchy, popover guides, and complete analytical charts.
            </p>
          </button>

          {/* Advanced */}
          <button
            type="button"
            onClick={() => setLayoutMode("advanced")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              layoutMode === "advanced"
                ? "bg-brand-500/15 border-brand-500 ring-1 ring-brand-500/40"
                : "bg-dark-bg/80 border-dark-border hover:border-slate-600"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-white text-sm">Advanced Academic</span>
              <span className="text-base">🔬</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Expands detailed residual error distributions, multi-model candidate metrics, and statistical significance tests.
            </p>
          </button>
        </div>
      </div>

      {/* 2. Feature Toggles Grid */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-dark-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Feature &amp; Chart Visibility Toggles
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Turning a feature off dynamically hides its public route and navigation items.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {featureItems.map((item) => {
            const isEnabled = features[item.key] !== false;

            return (
              <div
                key={item.key}
                className="p-4 rounded-xl bg-dark-bg/80 border border-dark-border flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">{item.label}</h3>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-dark-card border border-dark-border text-slate-400">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(item.key)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-0.5 ${
                    isEnabled ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                  aria-label={`Toggle ${item.label}`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      isEnabled ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
