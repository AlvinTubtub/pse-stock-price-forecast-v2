"use client";

import React, { useState, useEffect } from "react";
import ConfirmationModal from "@/components/admin/ConfirmationModal";
import type { SiteConfig, CalendarHoliday } from "@/lib/admin/types";
import { formatDate } from "@/lib/format";

// Default PSE 2026 holidays
const DEFAULT_HOLIDAYS_2026: CalendarHoliday[] = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-02-17", name: "Chinese New Year" },
  { date: "2026-03-20", name: "Eid'l Fitr" },
  { date: "2026-04-02", name: "Maundy Thursday" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-04", name: "Black Saturday" },
  { date: "2026-04-09", name: "Araw ng Kagitingan" },
  { date: "2026-05-01", name: "Labor Day" },
  { date: "2026-05-27", name: "Eid'l Adha" },
  { date: "2026-06-12", name: "Independence Day" },
  { date: "2026-08-21", name: "Ninoy Aquino Day" },
  { date: "2026-08-31", name: "National Heroes Day" },
  { date: "2026-11-01", name: "All Saints' Day" },
  { date: "2026-11-30", name: "Bonifacio Day" },
  { date: "2026-12-24", name: "Christmas Eve" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-30", name: "Rizal Day" },
  { date: "2026-12-31", name: "New Year's Eve" },
];

export default function PSECalendarAdminPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [customHolidays, setCustomHolidays] = useState<CalendarHoliday[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.config) {
          setConfig(data.config);
          setCustomHolidays(data.config.customHolidays || []);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddHoliday = () => {
    if (!newDate || !newName.trim()) {
      setFeedback({ type: "error", text: "Please enter both date and holiday name." });
      return;
    }

    setConfirmModal({
      title: "Add Calendar Non-Trading Exception",
      message: `Are you sure you want to declare ${newDate} (${newName.trim()}) as a Non-Trading Date? The forecast pipeline will recognize this day as closed.`,
      action: async () => {
        const item: CalendarHoliday = {
          date: newDate,
          name: newName.trim(),
          isCustom: true,
        };
        const updated = [...customHolidays, item];
        setCustomHolidays(updated);
        setNewDate("");
        setNewName("");

        await saveHolidays(updated, `Added special non-trading date ${newDate} (${item.name}).`);
      },
    });
  };

  const handleRemoveHoliday = (dateToRemove: string) => {
    setConfirmModal({
      title: "Remove Calendar Exception",
      message: `Remove exception for ${dateToRemove}? Trading rules will revert to regular schedule.`,
      action: async () => {
        const updated = customHolidays.filter((h) => h.date !== dateToRemove);
        setCustomHolidays(updated);
        await saveHolidays(updated, `Removed custom non-trading date ${dateToRemove}.`);
      },
    });
  };

  const saveHolidays = async (holidays: CalendarHoliday[], auditMessage: string) => {
    if (!config) return;
    setIsSaving(true);
    const updatedConfig: SiteConfig = {
      ...config,
      customHolidays: holidays,
    };

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: updatedConfig,
          changesSummary: auditMessage,
        }),
      });

      if (!res.ok) throw new Error("Failed to save calendar updates.");
      setConfig(updatedConfig);
      setFeedback({ type: "success", text: "Trading calendar updated successfully." });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update calendar." });
    } finally {
      setIsSaving(false);
    }
  };

  const allHolidays = [
    ...DEFAULT_HOLIDAYS_2026.map((h) => ({ ...h, isCustom: false })),
    ...customHolidays.map((h) => ({ ...h, isCustom: true })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Market Schedule
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            PSE Trading Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Inspect official regular market holidays and configure special emergency non-trading suspensions.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono bg-dark-card border border-dark-border px-3 py-1.5 rounded-lg self-start sm:self-auto">
          Trading Hours: 9:30 AM – 3:30 PM PHT
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

      {/* 1. Add Custom Exception Form */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Add Exceptional Non-Trading Date
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Declare an emergency market suspension, special bank holiday, or typhoon market closure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label htmlFor="holiday-date" className="text-xs text-slate-400 block mb-1">
              Date (YYYY-MM-DD)
            </label>
            <input
              id="holiday-date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-dark-bg border border-dark-border text-xs text-white focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="holiday-name" className="text-xs text-slate-400 block mb-1">
              Suspension Reason / Holiday Name
            </label>
            <div className="flex gap-2">
              <input
                id="holiday-name"
                type="text"
                placeholder="e.g. Special Market Closure (Typhoon Warning)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 py-2 px-3 rounded-xl bg-dark-bg border border-dark-border text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddHoliday}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
              >
                + Add Date
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Calendar Holidays List */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm overflow-x-auto space-y-4">
        <div className="pb-3 border-b border-dark-border/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Recognized PSE Non-Trading Days (2026)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {allHolidays.length} Non-Trading Dates Recorded
          </span>
        </div>

        <table className="w-full text-xs sm:text-sm">
          <thead className="text-xs text-slate-400 uppercase bg-dark-bg/80 border-b border-dark-border">
            <tr>
              <th className="text-left py-3 px-3.5">Date</th>
              <th className="text-left py-3 px-3.5">Holiday / Suspension Name</th>
              <th className="text-left py-3 px-3.5">Classification</th>
              <th className="text-right py-3 px-3.5">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/50 font-mono">
            {allHolidays.map((h, i) => (
              <tr key={i} className="hover:bg-dark-bg/40 transition-colors">
                <td className="py-2.5 px-3.5 font-bold text-white">
                  {formatDate(h.date)}
                </td>
                <td className="py-2.5 px-3.5 font-sans text-slate-200">
                  {h.name}
                </td>
                <td className="py-2.5 px-3.5 font-sans">
                  {h.isCustom ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Custom Exception
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-dark-bg text-slate-400 border border-dark-border">
                      Official Regular Holiday
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3.5 text-right font-sans">
                  {h.isCustom ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleRemoveHoliday(h.date)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-xs text-slate-600 font-mono">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      {confirmModal && (
        <ConfirmationModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          isLoading={isSaving}
          onConfirm={async () => {
            await confirmModal.action();
            setConfirmModal(null);
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
