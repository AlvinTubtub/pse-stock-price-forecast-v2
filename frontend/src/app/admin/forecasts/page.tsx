"use client";

import React, { useState, useEffect } from "react";
import { formatPeso, formatNum, formatDate } from "@/lib/format";
import type { CompanySummary, MetricsData } from "@/lib/types";
import type { SiteConfig, PublicationStatus } from "@/lib/admin/types";
import ConfirmationModal from "@/components/admin/ConfirmationModal";

export default function ForecastPublicationAdminPage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [publicationMap, setPublicationMap] = useState<Record<string, PublicationStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  // Load companies & config
  useEffect(() => {
    fetch("/forecasts/companies.json")
      .then((r) => r.json())
      .then((data) => setCompanies(data))
      .catch(() => {});

    fetch("/forecasts/metrics.json")
      .then((r) => r.json())
      .then((data) => setMetrics(data))
      .catch(() => {});

    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.config) {
          setConfig(data.config);
          setPublicationMap(data.config.forecastPublication || {});
        }
      })
      .catch(() => {});
  }, []);

  const handleStatusChange = async (symbol: string, newStatus: PublicationStatus) => {
    if (!config) return;
    const updatedMap = { ...publicationMap, [symbol]: newStatus };
    setPublicationMap(updatedMap);

    const updatedConfig: SiteConfig = {
      ...config,
      forecastPublication: updatedMap,
    };

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: updatedConfig,
          changesSummary: `Updated ${symbol} forecast publication status to ${newStatus}.`,
        }),
      });

      if (!res.ok) throw new Error("Failed to save publication status.");
      setConfig(updatedConfig);
      setFeedback({
        type: "success",
        text: `Updated ${symbol} status to ${newStatus.toUpperCase()}.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update status." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBatchSet = async (status: PublicationStatus) => {
    if (!config) return;
    const updatedMap: Record<string, PublicationStatus> = {};
    companies.forEach((c) => {
      updatedMap[c.symbol] = status;
    });
    setPublicationMap(updatedMap);

    const updatedConfig: SiteConfig = {
      ...config,
      forecastPublication: updatedMap,
    };

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: updatedConfig,
          changesSummary: `Batch set all company forecast publications to ${status.toUpperCase()}.`,
        }),
      });

      if (!res.ok) throw new Error("Failed to batch save.");
      setConfig(updatedConfig);
      setFeedback({
        type: "success",
        text: `All ${companies.length} company forecasts set to ${status.toUpperCase()}.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to batch update." });
    } finally {
      setIsSaving(false);
    }
  };

  const modelKeyMap: Record<string, string> = {
    "Lag-Informed Regression": "lag_reg",
    ARIMA: "arima",
    LSTM: "lstm",
    "Naive baseline": "naive",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Data Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Forecast Publications
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage public visibility of daily model forecasts per company (Published, Draft, Unpublished).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() =>
              setConfirmAction({
                title: "Publish All Forecasts",
                message: "Are you sure you want to set all 15 company forecasts to PUBLISHED?",
                action: () => handleBatchSet("published"),
              })
            }
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Publish All
          </button>
          <button
            type="button"
            onClick={() =>
              setConfirmAction({
                title: "Unpublish All Forecasts",
                message: "Are you sure you want to unpublish all forecasts? Public users will see an empty directory until republished.",
                action: () => handleBatchSet("unpublished"),
              })
            }
            className="px-3 py-1.5 rounded-xl bg-dark-bg hover:bg-rose-500/20 text-rose-300 border border-dark-border hover:border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            Unpublish All
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

      {/* Table */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm overflow-x-auto space-y-4">
        <div className="pb-3 border-b border-dark-border/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Tracked Equities Forecast Matrix
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {companies.length} Tracked Securities
          </span>
        </div>

        <table className="w-full text-xs sm:text-sm">
          <thead className="text-xs text-slate-400 uppercase bg-dark-bg/80 border-b border-dark-border">
            <tr>
              <th className="text-left py-3 px-3.5">Company</th>
              <th className="text-right py-3 px-3.5">Previous</th>
              <th className="text-right py-3 px-3.5">Forecast</th>
              <th className="text-left py-3 px-3.5">Model</th>
              <th className="text-right py-3 px-3.5">RMSE (₱)</th>
              <th className="text-right py-3 px-3.5">MAE (₱)</th>
              <th className="text-right py-3 px-3.5">MASE</th>
              <th className="text-center py-3 px-3.5">Publication Status</th>
              <th className="text-right py-3 px-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/50">
            {companies.map((c) => {
              const status: PublicationStatus = publicationMap[c.symbol] || "published";
              const perComp = metrics?.perCompany?.[c.symbol];
              const modelKey = modelKeyMap[c.bestModel] || "arima";
              const m = perComp?.metrics?.[modelKey];

              return (
                <tr key={c.symbol} className="hover:bg-dark-bg/40 transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{c.symbol}</span>
                      <span className="text-slate-400 text-xs truncate max-w-[120px]">
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-slate-300">
                    {formatPeso(c.latestClose)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-white">
                    {formatPeso(c.predictedClose)}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300 font-medium">{c.bestModel}</td>
                  <td className="py-3 px-3.5 text-right font-mono text-slate-400">
                    {m ? `₱${formatNum(m.rmse, 2)}` : "—"}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-slate-400">
                    {m ? `₱${formatNum(m.mae, 2)}` : "—"}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-slate-400">
                    {m ? formatNum(m.mase, 3) : "—"}
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border font-mono ${
                        status === "published"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : status === "draft"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/companies/${c.symbol}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-slate-300 hover:text-white text-xs font-medium"
                      >
                        Preview
                      </a>

                      {status !== "published" && (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleStatusChange(c.symbol, "published")}
                          className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer"
                        >
                          Publish
                        </button>
                      )}

                      {status !== "unpublished" && (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleStatusChange(c.symbol, "unpublished")}
                          className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer"
                        >
                          Unpublish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={true}
          title={confirmAction.title}
          message={confirmAction.message}
          isLoading={isSaving}
          onConfirm={async () => {
            await confirmAction.action();
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
