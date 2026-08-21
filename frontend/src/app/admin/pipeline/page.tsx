"use client";

import React, { useState, useEffect } from "react";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { formatDate } from "@/lib/format";

interface PipelineRun {
  id: string;
  action: string;
  status: "queued" | "running" | "success" | "failed";
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  message?: string;
}

export default function PipelineAdminPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [activeModal, setActiveModal] = useState<{
    actionKey: string;
    title: string;
    message: string;
    danger?: boolean;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchRuns = () => {
    fetch("/api/admin/pipeline")
      .then((res) => res.json())
      .then((data) => {
        if (data?.runs) {
          setRuns(data.runs);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async () => {
    if (!activeModal) return;

    setIsSubmitting(true);
    setStatusFeedback(null);

    try {
      const res = await fetch("/api/admin/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: activeModal.actionKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Workflow dispatch failed.");

      setStatusFeedback({
        type: "success",
        text: data.message || `Successfully triggered ${activeModal.title}.`,
      });

      fetchRuns();
    } catch (err: any) {
      setStatusFeedback({
        type: "error",
        text: err.message || "Failed to dispatch workflow.",
      });
    } finally {
      setIsSubmitting(false);
      setActiveModal(null);
    }
  };

  const getStatusBadge = (status: PipelineRun["status"]) => {
    switch (status) {
      case "success":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "running":
        return "bg-brand-500/10 text-brand-400 border-brand-500/30 animate-pulse";
      case "queued":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "failed":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Workflow Dispatch &amp; Automation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pipeline Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Trigger GitHub Actions pipelines remotely for daily data ingestion, price inference, and weekly model retraining.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono bg-dark-card border border-dark-border px-3 py-1.5 rounded-lg self-start sm:self-auto">
          GitHub Actions Remote Dispatch
        </div>
      </div>

      {/* Feedback Banner */}
      {statusFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            statusFeedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{statusFeedback.type === "success" ? "✅" : "⚠️"}</span>
            <span>{statusFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Fast Pipeline */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xl">⚡</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                Daily (~3 mins)
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Run Fast Data Update
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingests the newest official PSE Quotations Report, executes daily model inference, and exports updated frontend JSONs.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveModal({
                actionKey: "data_update",
                title: "Trigger Fast Data Pipeline",
                message:
                  "This triggers `.github/workflows/update_pipeline.yml` to ingest quotes and update next-day forecasts.",
              })
            }
            className="w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Dispatch Data Update
          </button>
        </div>

        {/* Inference Only */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xl">🎯</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-dark-bg text-slate-400 border border-dark-border">
                Inference (~1 min)
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Run Daily Inference
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Recalculates next-day closing price estimations using pre-trained model weights without re-scraping raw data.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveModal({
                actionKey: "inference",
                title: "Trigger Daily Inference",
                message:
                  "This runs model prediction across all 15 tickers to recompute expected prices.",
              })
            }
            className="w-full py-2 px-3 rounded-xl bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Dispatch Inference
          </button>
        </div>

        {/* Weekly Model Retraining */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xl">🧠</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Heavy (~45 mins)
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Run Weekly Retraining
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full retraining of all candidate models (ARIMA, Lag-Informed Regression, LSTM) across all 15 PSE tickers on GitHub Actions runners.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveModal({
                actionKey: "training",
                title: "Trigger Full Model Retraining",
                message:
                  "WARNING: This triggers `.github/workflows/train_models.yml` which retrains all deep learning and regression models. Execution takes 30-45 minutes.",
                danger: true,
              })
            }
            className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Dispatch Model Training
          </button>
        </div>

        {/* Validate Artifacts */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xl">🔍</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-dark-bg text-slate-400 border border-dark-border">
                Diagnostic (~30s)
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Validate Export Artifacts
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Runs validation checks against all JSON forecast files, verifying metric formatting, schema bounds, and non-empty outputs.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveModal({
                actionKey: "validate",
                title: "Run Artifact Validation",
                message: "Verify all 15 company JSON files and metrics pass consistency rules.",
              })
            }
            className="w-full py-2 px-3 rounded-xl bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Validate Artifacts
          </button>
        </div>

        {/* Export Artifacts */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xl">📦</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-dark-bg text-slate-400 border border-dark-border">
                Export (~30s)
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Export Forecast Artifacts
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Converts backend master CSV records and cached predictions into optimized JSON structures for the public web app.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveModal({
                actionKey: "export",
                title: "Export Artifacts",
                message: "Regenerate JSON forecast files in `public/forecasts`.",
              })
            }
            className="w-full py-2 px-3 rounded-xl bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Export Artifacts
          </button>
        </div>
      </div>

      {/* 2. Pipeline Execution Log Table */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm overflow-x-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-dark-border/60">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Pipeline Execution History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of dispatched workflow runs and completion states.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchRuns}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium cursor-pointer"
          >
            Refresh Logs ⟳
          </button>
        </div>

        <table className="w-full text-xs sm:text-sm">
          <thead className="text-xs text-slate-400 uppercase bg-dark-bg/80 border-b border-dark-border">
            <tr>
              <th className="text-left py-3 px-3.5">Action</th>
              <th className="text-center py-3 px-3.5">Status</th>
              <th className="text-left py-3 px-3.5">Triggered By</th>
              <th className="text-left py-3 px-3.5">Started At (PHT)</th>
              <th className="text-left py-3 px-3.5">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/50">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-dark-bg/40 transition-colors">
                <td className="py-3 px-3.5 font-bold text-white">{run.action}</td>
                <td className="py-3 px-3.5 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border font-mono ${getStatusBadge(
                      run.status
                    )}`}
                  >
                    {run.status}
                  </span>
                </td>
                <td className="py-3 px-3.5 font-mono text-slate-300">{run.triggeredBy}</td>
                <td className="py-3 px-3.5 font-mono text-slate-400 text-xs">
                  {formatDate(run.startedAt)}
                </td>
                <td className="py-3 px-3.5 text-slate-300 text-xs truncate max-w-[280px]">
                  {run.message || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {activeModal && (
        <ConfirmationModal
          isOpen={true}
          title={activeModal.title}
          message={activeModal.message}
          danger={activeModal.danger}
          isLoading={isSubmitting}
          onConfirm={handleTrigger}
          onCancel={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
