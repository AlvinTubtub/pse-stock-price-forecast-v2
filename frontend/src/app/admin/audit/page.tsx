"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { AuditLogEntry } from "@/lib/admin/types";
import { formatDate } from "@/lib/format";

export default function AuditAdminPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = () => {
    setIsLoading(true);
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((data) => {
        if (data?.logs) {
          setLogs(data.logs);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const users = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.username));
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchUser = selectedUser === "all" || log.username === selectedUser;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q));

      return matchUser && matchQuery;
    });
  }, [logs, selectedUser, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Governance &amp; Traceability
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administrative Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable, chronological audit trail recording administrative logins, configuration modifications, and pipeline dispatches.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-3.5 py-1.5 rounded-xl bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          {isLoading ? "Refreshing..." : "Refresh Trail ⟳"}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="Search audit actions, targets, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 px-3.5 rounded-xl bg-dark-bg border border-dark-border text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="user-filter" className="text-xs text-slate-400 shrink-0">
            Admin User:
          </label>
          <select
            id="user-filter"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="py-2 px-3 rounded-xl bg-dark-bg border border-dark-border text-xs text-white focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Administrators</option>
            {users.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm overflow-x-auto space-y-4">
        <div className="pb-3 border-b border-dark-border/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Recorded Activity Records
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredLogs.length} of {logs.length} Total Records
          </span>
        </div>

        <table className="w-full text-xs sm:text-sm">
          <thead className="text-xs text-slate-400 uppercase bg-dark-bg/80 border-b border-dark-border">
            <tr>
              <th className="text-left py-3 px-3.5">Timestamp (PHT)</th>
              <th className="text-left py-3 px-3.5">Admin</th>
              <th className="text-left py-3 px-3.5">Action &amp; Target</th>
              <th className="text-center py-3 px-3.5">Result</th>
              <th className="text-left py-3 px-3.5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/50">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                  No matching audit records found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-bg/40 transition-colors">
                  <td className="py-3 px-3.5 font-mono text-slate-400 text-xs shrink-0">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20 font-bold">
                      {log.username}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="font-semibold text-white">{log.action}</span>
                    <span className="text-slate-500 text-xs block truncate max-w-[200px]">
                      Target: {log.target}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase border font-mono ${
                        log.result === "success"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {log.result}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-xs text-slate-400 max-w-sm truncate">
                    {log.details || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
