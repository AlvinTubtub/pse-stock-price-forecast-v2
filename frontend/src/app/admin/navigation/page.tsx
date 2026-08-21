"use client";

import React, { useState, useEffect } from "react";
import type { SiteConfig, NavigationItem } from "@/lib/admin/types";

export default function NavigationAdminPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.config) {
          setConfig(data.config);
          setNavItems(data.config.navigation || []);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleVisible = (id: string) => {
    const updated = navItems.map((item) => {
      if (item.id === id) {
        if (item.isImmutable) return item; // Home cannot be hidden
        return { ...item, visible: !item.visible };
      }
      return item;
    });
    setNavItems(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 1) return; // Cannot move above Home (index 0)
    const updated = [...navItems];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setNavItems(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === 0 || index >= navItems.length - 1) return;
    const updated = [...navItems];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setNavItems(updated);
  };

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    setFeedback(null);

    const updatedConfig: SiteConfig = {
      ...config,
      navigation: navItems,
    };

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: updatedConfig,
          changesSummary: "Updated public navigation ordering and link visibility.",
        }),
      });

      if (!res.ok) throw new Error("Failed to save navigation.");
      setConfig(updatedConfig);
      setFeedback({ type: "success", text: "Navigation settings saved and published." });
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
            Site Navigation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Navigation Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure display order and visibility of links in the public header and mobile navbar.
          </p>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
        >
          {isSaving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          <span>Save &amp; Publish Navigation</span>
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

      {/* Reorder List */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="pb-3 border-b border-dark-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Public Navigation Item Sequence
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Home is locked as the primary anchor. Use arrow controls to reorder subsequent links.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {navItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-dark-bg/80 border border-dark-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-dark-card border border-dark-border text-slate-400 font-mono text-xs flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{item.label}</span>
                    <span className="text-slate-500 font-mono text-[11px]">({item.href})</span>
                    {item.isImmutable && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20 font-mono">
                        Locked First
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Visibility Button */}
                <button
                  type="button"
                  disabled={item.isImmutable}
                  onClick={() => handleToggleVisible(item.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    item.visible
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-slate-500/10 text-slate-500 border-slate-600"
                  } ${item.isImmutable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {item.visible ? "Visible" : "Hidden"}
                </button>

                {/* Move Up */}
                <button
                  type="button"
                  disabled={index <= 1}
                  onClick={() => handleMoveUp(index)}
                  className="p-1.5 rounded-lg bg-dark-card border border-dark-border text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  title="Move Up"
                >
                  ▲
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  disabled={index === 0 || index >= navItems.length - 1}
                  onClick={() => handleMoveDown(index)}
                  className="p-1.5 rounded-lg bg-dark-card border border-dark-border text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                  title="Move Down"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
