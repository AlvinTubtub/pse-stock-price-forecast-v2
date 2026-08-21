"use client";

import React, { useState, useEffect } from "react";
import { formatDate } from "@/lib/format";

interface HealthCheck {
  name: string;
  status: "healthy" | "warning" | "error";
  message: string;
  details?: string;
}

interface HealthData {
  timestamp: string;
  overallStatus: "healthy" | "warning" | "error";
  checks: Record<string, HealthCheck>;
}

export default function HealthAdminPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = () => {
    setIsLoading(true);
    fetch("/api/admin/health")
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusBadge = (status: "healthy" | "warning" | "error") => {
    switch (status) {
      case "healthy":
        return {
          label: "Healthy",
          style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: "●",
        };
      case "warning":
        return {
          label: "Warning",
          style: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: "▲",
        };
      case "error":
        return {
          label: "Error",
          style: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: "✖",
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Diagnostics &amp; System Health
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            System Health Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated verification of database artifacts, external API status, pipeline integrity, and server runtime.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {health && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase border font-mono ${
                getStatusBadge(health.overallStatus).style
              }`}
            >
              <span>{getStatusBadge(health.overallStatus).icon}</span>
              <span>{health.overallStatus}</span>
            </span>
          )}

          <button
            type="button"
            onClick={fetchHealth}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? "Checking..." : "Re-Check ⟳"}
          </button>
        </div>
      </div>

      {/* Checks Grid */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(health.checks).map(([key, item]) => {
            const badge = getStatusBadge(item.status);

            return (
              <div
                key={key}
                className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-tight">{item.name}</h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase border font-mono ${badge.style}`}
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>

                {item.details && (
                  <div className="pt-2 border-t border-dark-border/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Diagnostic:</span>
                    <span className="text-slate-400">{item.details}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Timestamp footer */}
      {health && (
        <div className="p-4 rounded-xl bg-dark-card border border-dark-border text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Last automated health inspection:</span>
          <span className="font-mono text-slate-200 font-medium">
            {formatDate(health.timestamp)}
          </span>
        </div>
      )}
    </div>
  );
}
