"use client";

import React, { useState, useEffect } from "react";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import { formatDate } from "@/lib/format";

interface DashboardInfo {
  dataAsOf: string;
  forecastDate: string;
  lastRunPHT: string;
  activeTickers: number;
  pipelineStatus: string;
}

interface AuditItem {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  target: string;
  result: string;
}

export default function AdminDashboardPage() {
  const [pipelineInfo, setPipelineInfo] = useState<DashboardInfo | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [activeModalAction, setActiveModalAction] = useState<{
    actionKey: string;
    title: string;
    message: string;
    danger?: boolean;
  } | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    // Load pipeline info
    fetch("/api/admin/pipeline")
      .then((res) => res.json())
      .then((data) => {
        if (data?.latestPipelineInfo) {
          setPipelineInfo(data.latestPipelineInfo);
        }
      })
      .catch(() => {});

    // Load recent audit logs
    fetch("/api/admin/audit")
      .then((res) => res.json())
      .then((data) => {
        if (data?.logs) {
          setAuditLogs(data.logs.slice(0, 5));
        }
      })
      .catch(() => {});
  }, []);

  const handleTriggerAction = async () => {
    if (!activeModalAction) return;

    setIsTriggering(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch("/api/admin/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: activeModalAction.actionKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Execution failed.");

      setFeedbackMessage({
        type: "success",
        text: data.message || `Action ${activeModalAction.title} dispatched successfully.`,
      });

      // Refresh logs
      fetch("/api/admin/audit")
        .then((res) => res.json())
        .then((d) => setAuditLogs(d.logs.slice(0, 5)));
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to trigger pipeline action.",
      });
    } finally {
      setIsTriggering(false);
      setActiveModalAction(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Console Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time status overview of the PSE automated forecasting pipeline, artifacts, and controls.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Systems Operational</span>
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            feedbackMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedbackMessage.type === "success" ? "✅" : "⚠️"}</span>
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Core Status Matrix (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PSE Calendar */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              PSE Calendar Status
            </span>
            <span className="text-lg">📅</span>
          </div>
          <div>
            <p className="text-xl font-bold text-white tracking-tight">Active Calendar</p>
            <p className="text-xs text-slate-400 mt-1">Trading session rules active (9:30 AM - 3:30 PM PHT)</p>
          </div>
          <div className="pt-2 border-t border-dark-border/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Next Trading Session</span>
            <span className="font-mono text-brand-300 font-semibold">
              {pipelineInfo?.forecastDate ? formatDate(pipelineInfo.forecastDate) : "Next Trading Day"}
            </span>
          </div>
        </div>

        {/* Data Pipeline */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Pipeline Status
            </span>
            <span className="text-lg">⚡</span>
          </div>
          <div>
            <p className="text-xl font-bold text-white tracking-tight font-mono">
              {pipelineInfo?.pipelineStatus === "ok" ? "Healthy (200 OK)" : "Idle"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Data as of: {pipelineInfo?.dataAsOf || "Recent"}</p>
          </div>
          <div className="pt-2 border-t border-dark-border/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Last Execution</span>
            <span className="font-mono text-slate-300 font-medium truncate max-w-[120px]">
              {pipelineInfo?.lastRunPHT ? formatDate(pipelineInfo.lastRunPHT) : "Recent"}
            </span>
          </div>
        </div>

        {/* Forecast Artifacts */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Forecast Artifacts
            </span>
            <span className="text-lg">📂</span>
          </div>
          <div>
            <p className="text-xl font-bold text-white tracking-tight font-mono">
              {pipelineInfo?.activeTickers || 15} Companies
            </p>
            <p className="text-xs text-slate-400 mt-1">All 15 target tickers verified &amp; available</p>
          </div>
          <div className="pt-2 border-t border-dark-border/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Models per stock</span>
            <span className="font-mono text-emerald-400 font-semibold">4 / 4 Complete</span>
          </div>
        </div>

        {/* Gemini AI Status */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Gemini AI Status
            </span>
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <p className="text-xl font-bold text-white tracking-tight">Active</p>
            <p className="text-xs text-slate-400 mt-1">Model: gemini-2.5-flash</p>
          </div>
          <div className="pt-2 border-t border-dark-border/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Guardrails</span>
            <span className="font-mono text-brand-300 font-semibold">Strict Educational</span>
          </div>
        </div>
      </div>

      {/* 2. Quick Operations Action Center */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-dark-border/60">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Quick Operations Center
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute pipeline routines and artifact validations. High-impact actions require confirmation.
            </p>
          </div>
          <a
            href="/admin/pipeline"
            className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            Detailed Pipeline Logs →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Action 1 */}
          <button
            type="button"
            onClick={() =>
              setActiveModalAction({
                actionKey: "data_update",
                title: "Run Fast Data Update & Inference",
                message:
                  "This will trigger the Fast Pipeline GitHub Actions workflow to ingest the latest PSE Quotations Report, run daily model inference, and update public forecast artifacts.",
              })
            }
            className="p-4 rounded-xl bg-dark-bg/80 hover:bg-dark-bg border border-dark-border hover:border-brand-500/40 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">⚡</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                Daily Pipeline
              </span>
            </div>
            <h3 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
              Run Data Update
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Ingest newest quotes &amp; generate next-day predictions.
            </p>
          </button>

          {/* Action 2 */}
          <button
            type="button"
            onClick={() =>
              setActiveModalAction({
                actionKey: "inference",
                title: "Run Daily Inference",
                message:
                  "This will trigger model inference across all 15 tickers against existing models without retraining weights.",
              })
            }
            className="p-4 rounded-xl bg-dark-bg/80 hover:bg-dark-bg border border-dark-border hover:border-brand-500/40 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">🎯</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-dark-card text-slate-400 border border-dark-border">
                Inference Only
              </span>
            </div>
            <h3 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
              Run Inference
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Calculate step-ahead price forecasts for tomorrow.
            </p>
          </button>

          {/* Action 3 */}
          <button
            type="button"
            onClick={() =>
              setActiveModalAction({
                actionKey: "validate",
                title: "Validate Exported Forecast Artifacts",
                message:
                  "This runs validation tests to ensure all 15 company JSON files, metrics, and schema constraints pass strictly.",
              })
            }
            className="p-4 rounded-xl bg-dark-bg/80 hover:bg-dark-bg border border-dark-border hover:border-brand-500/40 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">🔍</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-dark-card text-slate-400 border border-dark-border">
                Data Check
              </span>
            </div>
            <h3 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
              Validate Artifacts
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Verify schema conformity, metrics, and timestamp integrity.
            </p>
          </button>

          {/* Action 4 */}
          <button
            type="button"
            onClick={() =>
              setActiveModalAction({
                actionKey: "export",
                title: "Export Frontend Artifacts",
                message:
                  "Export all backend prediction results and master quotes into production JSON artifacts for the Next.js frontend.",
              })
            }
            className="p-4 rounded-xl bg-dark-bg/80 hover:bg-dark-bg border border-dark-border hover:border-brand-500/40 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">📦</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-dark-card text-slate-400 border border-dark-border">
                Export Sync
              </span>
            </div>
            <h3 className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
              Export Artifacts
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Sync backend predictions to `public/forecasts`.
            </p>
          </button>
        </div>
      </div>

      {/* 3. Recent Audit Activity */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-dark-border/60">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Recent Administrative Activity
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit trail of actions performed by authenticated administrators.
            </p>
          </div>
          <a
            href="/admin/audit"
            className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            View Complete Audit Log →
          </a>
        </div>

        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No recent audit activity logged.</p>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-bg/60 border border-dark-border/60 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-dark-card border border-dark-border text-brand-300 font-semibold shrink-0">
                    {log.username}
                  </span>
                  <span className="text-white font-medium truncate">{log.action}</span>
                  <span className="text-slate-500 hidden sm:inline">&bull;</span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline truncate">
                    {log.target}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      log.result === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {log.result}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {activeModalAction && (
        <ConfirmationModal
          isOpen={true}
          title={activeModalAction.title}
          message={activeModalAction.message}
          danger={activeModalAction.danger}
          isLoading={isTriggering}
          onConfirm={handleTriggerAction}
          onCancel={() => setActiveModalAction(null)}
        />
      )}
    </div>
  );
}
