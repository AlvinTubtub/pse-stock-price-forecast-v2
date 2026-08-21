"use client";

import React, { useState, useEffect } from "react";
import type { CompanySummary } from "@/lib/types";
import type { SiteConfig, CompanyConfig } from "@/lib/admin/types";

export default function CompaniesAdminPage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [companyConfigs, setCompanyConfigs] = useState<Record<string, CompanyConfig>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/forecasts/companies.json")
      .then((r) => r.json())
      .then((data) => setCompanies(data))
      .catch(() => {});

    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.config) {
          setConfig(data.config);
          setCompanyConfigs(data.config.companies || {});
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleVisible = (symbol: string) => {
    const curr = companyConfigs[symbol] || { symbol, visible: true, featured: false, order: 99 };
    const updated = {
      ...companyConfigs,
      [symbol]: { ...curr, visible: !curr.visible },
    };
    setCompanyConfigs(updated);
  };

  const handleToggleFeatured = (symbol: string) => {
    const curr = companyConfigs[symbol] || { symbol, visible: true, featured: false, order: 99 };
    const updated = {
      ...companyConfigs,
      [symbol]: { ...curr, featured: !curr.featured },
    };
    setCompanyConfigs(updated);
  };

  const handleOrderChange = (symbol: string, newOrder: number) => {
    const curr = companyConfigs[symbol] || { symbol, visible: true, featured: false, order: 99 };
    const updated = {
      ...companyConfigs,
      [symbol]: { ...curr, order: isNaN(newOrder) ? 1 : newOrder },
    };
    setCompanyConfigs(updated);
  };

  const handleAliasChange = (symbol: string, alias: string) => {
    const curr = companyConfigs[symbol] || { symbol, visible: true, featured: false, order: 99 };
    const updated = {
      ...companyConfigs,
      [symbol]: { ...curr, displayNameAlias: alias },
    };
    setCompanyConfigs(updated);
  };

  const handleSaveAll = async () => {
    if (!config) return;

    setIsSaving(true);
    setFeedback(null);

    const updatedConfig: SiteConfig = {
      ...config,
      companies: companyConfigs,
    };

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: updatedConfig,
          changesSummary: "Updated company visibility, featured flags, and display order.",
        }),
      });

      if (!res.ok) throw new Error("Failed to save changes.");

      setConfig(updatedConfig);
      setFeedback({ type: "success", text: "Company settings saved and published successfully." });
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
            Directory Controls
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Company Directory Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure visibility, featured highlights, display aliases, and sorting order across the public company grid.
          </p>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSaveAll}
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

      {/* Company List Table */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm overflow-x-auto space-y-4">
        <div className="pb-3 border-b border-dark-border/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            15 PSE Equities Configuration
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {companies.length} Companies Listed
          </span>
        </div>

        <table className="w-full text-xs sm:text-sm">
          <thead className="text-xs text-slate-400 uppercase bg-dark-bg/80 border-b border-dark-border">
            <tr>
              <th className="text-center py-3 px-2 w-12">Order</th>
              <th className="text-left py-3 px-3.5">Symbol</th>
              <th className="text-left py-3 px-3.5">Default Company Name</th>
              <th className="text-left py-3 px-3.5">Display Alias (Optional)</th>
              <th className="text-left py-3 px-3.5">Sector</th>
              <th className="text-center py-3 px-3.5">Visible?</th>
              <th className="text-center py-3 px-3.5">Featured?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/50">
            {companies.map((c) => {
              const cfg = companyConfigs[c.symbol] || {
                symbol: c.symbol,
                visible: true,
                featured: false,
                order: 99,
              };

              return (
                <tr key={c.symbol} className="hover:bg-dark-bg/40 transition-colors">
                  {/* Order Input */}
                  <td className="py-2.5 px-2 text-center">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={cfg.order ?? 1}
                      onChange={(e) => handleOrderChange(c.symbol, parseInt(e.target.value, 10))}
                      className="w-12 py-1 px-1.5 rounded-lg bg-dark-bg border border-dark-border text-center text-xs text-white font-mono focus:ring-1 focus:ring-brand-500"
                    />
                  </td>

                  {/* Symbol */}
                  <td className="py-2.5 px-3.5 font-bold font-mono text-white">
                    {c.symbol}
                  </td>

                  {/* Name */}
                  <td className="py-2.5 px-3.5 text-slate-300">
                    {c.name}
                  </td>

                  {/* Alias */}
                  <td className="py-2.5 px-3.5">
                    <input
                      type="text"
                      placeholder="e.g. Ayala Land"
                      value={cfg.displayNameAlias || ""}
                      onChange={(e) => handleAliasChange(c.symbol, e.target.value)}
                      className="w-full max-w-[200px] py-1 px-2 rounded-lg bg-dark-bg border border-dark-border text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-brand-500"
                    />
                  </td>

                  {/* Sector */}
                  <td className="py-2.5 px-3.5 text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-xs">
                      {c.sector}
                    </span>
                  </td>

                  {/* Visible toggle */}
                  <td className="py-2.5 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleVisible(c.symbol)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                        cfg.visible !== false
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-500/10 text-slate-500 border-slate-600"
                      }`}
                    >
                      {cfg.visible !== false ? "Visible" : "Hidden"}
                    </button>
                  </td>

                  {/* Featured toggle */}
                  <td className="py-2.5 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(c.symbol)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                        cfg.featured
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-slate-500/10 text-slate-500 border-slate-600"
                      }`}
                    >
                      {cfg.featured ? "⭐ Featured" : "Standard"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
