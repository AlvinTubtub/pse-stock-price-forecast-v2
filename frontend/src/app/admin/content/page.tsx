"use client";

import React, { useState, useEffect } from "react";
import type { SiteConfig, ContentConfig } from "@/lib/admin/types";

export default function ContentAdminPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [content, setContent] = useState<ContentConfig>({
    heroTitle: "Next-Day Stock Forecasting for the Philippine Stock Exchange",
    heroDescription:
      "Transparent, machine-learning powered price estimations and backtest accuracy metrics for 15 major PSE-listed equities.",
    dataSourceText: "Official PSE Daily Quotations Reports (EOD)",
    disclaimerText:
      "ForecastPH is an academic capstone research project. Forecasts and metrics are strictly educational decision-support tools and do NOT constitute financial advice, buy/sell recommendations, or guaranteed investment targets.",
    announcement: {
      enabled: false,
      text: "Welcome to ForecastPH — All forecasts updated with the latest PSE trading session settlement.",
      type: "info",
    },
  });
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.config) {
          setConfig(data.config);
          setContent(data.config.content);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (asDraft: boolean) => {
    if (!config) return;

    setIsSaving(true);
    setFeedback(null);

    const updatedConfig: SiteConfig = {
      ...config,
      content,
    };

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: updatedConfig,
          asDraft,
          changesSummary: asDraft
            ? "Saved draft homepage content and announcement settings."
            : "Published updated homepage content and announcement settings to public site.",
        }),
      });

      if (!res.ok) throw new Error("Failed to save content changes.");
      setConfig(updatedConfig);
      setFeedback({
        type: "success",
        text: asDraft
          ? "Draft content saved. Click 'Publish to Public Site' when ready."
          : "Content published successfully to the live public site!",
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Save failed." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Copywriting &amp; Announcements
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Homepage &amp; Content Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Update headline copy, source attributions, research disclaimers, and broadcast announcement banners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="px-3.5 py-2 rounded-xl bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {showLivePreview ? "Hide Preview" : "👁️ Live Preview"}
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="px-3.5 py-2 rounded-xl bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            <span>Publish to Public Site</span>
          </button>
        </div>
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

      {/* Live Preview Box */}
      {showLivePreview && (
        <div className="bg-dark-card border border-brand-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-dark-border">
            <span className="text-xs font-mono uppercase font-bold text-brand-400">
              Live Public Preview
            </span>
            <span className="text-[11px] text-slate-500">Matches public homepage appearance</span>
          </div>

          {/* Announcement Preview */}
          {content.announcement?.enabled && (
            <div
              className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                content.announcement.type === "warning"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : content.announcement.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-brand-500/10 border-brand-500/30 text-brand-300"
              }`}
            >
              <span>📢</span>
              <span>{content.announcement.text}</span>
            </div>
          )}

          {/* Hero Preview */}
          <div className="py-4 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {content.heroTitle}
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              {content.heroDescription}
            </p>
          </div>

          {/* Disclaimer Preview */}
          <div className="p-3 bg-dark-bg/80 border border-dark-border rounded-xl text-[11px] text-slate-400">
            <strong>Research Notice: </strong>
            {content.disclaimerText}
          </div>
        </div>
      )}

      {/* Content Edit Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Hero & Text */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            Homepage Hero &amp; Copy
          </h2>

          <div className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label htmlFor="hero-title" className="font-semibold text-slate-300 block">
                Hero Title Headline
              </label>
              <input
                id="hero-title"
                type="text"
                value={content.heroTitle}
                onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-dark-bg border border-dark-border text-white focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="hero-desc" className="font-semibold text-slate-300 block">
                Hero Subtitle Description
              </label>
              <textarea
                id="hero-desc"
                rows={3}
                value={content.heroDescription}
                onChange={(e) => setContent({ ...content, heroDescription: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-dark-bg border border-dark-border text-white focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="data-source-text" className="font-semibold text-slate-300 block">
                Data Source Attribution
              </label>
              <input
                id="data-source-text"
                type="text"
                value={content.dataSourceText}
                onChange={(e) => setContent({ ...content, dataSourceText: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-dark-bg border border-dark-border text-white focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="disclaimer-text" className="font-semibold text-slate-300 block">
                Research Disclaimer Text
              </label>
              <textarea
                id="disclaimer-text"
                rows={3}
                value={content.disclaimerText}
                onChange={(e) => setContent({ ...content, disclaimerText: e.target.value })}
                className="w-full py-2 px-3 rounded-xl bg-dark-bg border border-dark-border text-white focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Broadcast Announcement Banner */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">
              Broadcast Announcement Banner
            </h2>
            <button
              type="button"
              onClick={() =>
                setContent({
                  ...content,
                  announcement: {
                    ...content.announcement,
                    enabled: !content.announcement?.enabled,
                  },
                })
              }
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                content.announcement?.enabled ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  content.announcement?.enabled ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Displays a persistent banner across the top of the public homepage for special notices or pipeline updates.
          </p>

          <div className="space-y-3.5 text-xs pt-2">
            <div className="space-y-1">
              <label htmlFor="banner-type" className="font-semibold text-slate-300 block">
                Banner Style / Urgency
              </label>
              <select
                id="banner-type"
                value={content.announcement?.type || "info"}
                onChange={(e) =>
                  setContent({
                    ...content,
                    announcement: {
                      ...content.announcement,
                      type: e.target.value as any,
                    },
                  })
                }
                className="w-full py-2 px-3 rounded-xl bg-dark-bg border border-dark-border text-white focus:ring-1 focus:ring-brand-500"
              >
                <option value="info">Informational (Blue)</option>
                <option value="success">Success / Operational Update (Green)</option>
                <option value="warning">Notice / Market Closure (Amber)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="banner-msg" className="font-semibold text-slate-300 block">
                Banner Message Text
              </label>
              <textarea
                id="banner-msg"
                rows={3}
                value={content.announcement?.text || ""}
                onChange={(e) =>
                  setContent({
                    ...content,
                    announcement: {
                      ...content.announcement,
                      text: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Philippine Stock Exchange closed today for national holiday."
                className="w-full py-2 px-3 rounded-xl bg-dark-bg border border-dark-border text-white focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
