"use client";

import React, { useState, useEffect } from "react";
import type { SiteConfig, AIConfig } from "@/lib/admin/types";

export default function AIAdminPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    enabled: true,
    primaryModel: "gemini-2.5-flash",
    fallbackModel: "gemini-2.5-flash-lite",
    customGuidelines:
      "Strictly adhere to educational explanations. Do not provide financial advice, buy/sell recommendations, or price guarantees.",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        if (data?.config) {
          setConfig(data.config);
          setAiConfig(data.config.ai || {
            enabled: true,
            primaryModel: "gemini-2.5-flash",
            fallbackModel: "gemini-2.5-flash-lite",
            customGuidelines:
              "Strictly adhere to educational explanations. Do not provide financial advice, buy/sell recommendations, or price guarantees.",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    setFeedback(null);

    const updatedConfig: SiteConfig = {
      ...config,
      ai: aiConfig,
      features: {
        ...config.features,
        aiAssistant: aiConfig.enabled,
      },
    };

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: updatedConfig,
          changesSummary: `Updated AI Assistant configuration (Status: ${aiConfig.enabled ? "ENABLED" : "DISABLED"}).`,
        }),
      });

      if (!res.ok) throw new Error("Failed to save AI configuration.");
      setConfig(updatedConfig);
      setFeedback({ type: "success", text: "AI Assistant settings saved and updated." });
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
            Generative Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Assistant Controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage global availability, primary and fallback models, educational guidelines, and guardrails for the Gemini assistant.
          </p>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
        >
          {isSaving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          <span>Save &amp; Publish Settings</span>
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

      {/* 1. Global Enable Switch & Models */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Global Switch */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assistant Status
            </span>
            <span className="text-lg">🤖</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-base font-bold text-white">
                {aiConfig.enabled ? "Active on Public Site" : "Disabled"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Toggle floating chatbot visibility</p>
            </div>

            <button
              type="button"
              onClick={() => setAiConfig({ ...aiConfig, enabled: !aiConfig.enabled })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                aiConfig.enabled ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  aiConfig.enabled ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Primary Model */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-400 block">
            Primary LLM Model
          </span>
          <p className="text-base font-bold text-white font-mono">{aiConfig.primaryModel}</p>
          <p className="text-xs text-slate-400">
            Google DeepMind official @google/genai SDK on Node.js 18+ runtime.
          </p>
        </div>

        {/* Fallback Model */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block">
            Fallback LLM Model
          </span>
          <p className="text-base font-bold text-white font-mono">{aiConfig.fallbackModel}</p>
          <p className="text-xs text-slate-400">
            High-efficiency secondary inference tier for rate-limit protection.
          </p>
        </div>
      </div>

      {/* 2. Educational System Prompt Guidelines */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Supplementary System Instructions &amp; Tone Guidelines
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Administer educational tone, explanation style, and custom context instructions injected into the system prompt.
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <textarea
            rows={5}
            value={aiConfig.customGuidelines || ""}
            onChange={(e) => setAiConfig({ ...aiConfig, customGuidelines: e.target.value })}
            className="w-full p-3.5 rounded-xl bg-dark-bg border border-dark-border text-white text-xs leading-relaxed focus:ring-1 focus:ring-brand-500 font-mono"
            placeholder="Enter custom educational rules or tone adjustments..."
          />
          <p className="text-[11px] text-slate-500">
            Note: Non-financial advice and anti-hallucination guardrails are hardcoded in the server runtime and cannot be overridden.
          </p>
        </div>
      </div>

      {/* 3. Guardrails Inspection */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight">
          Enforced AI Assistant Safety Guardrails
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-dark-bg border border-dark-border space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>✓</span> Zero Investment Advice
            </span>
            <p className="text-slate-400">
              Refuses to provide stock buy/sell/hold calls, price targets, or financial recommendations.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-bg border border-dark-border space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>✓</span> Grounded Context Ingestion
            </span>
            <p className="text-slate-400">
              Derives facts strictly from precomputed metrics, backtests, and settlement quotations.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-bg border border-dark-border space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>✓</span> Non-Deterministic Caution
            </span>
            <p className="text-slate-400">
              Never describes stock price estimates as guaranteed promises or certainties.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-bg border border-dark-border space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>✓</span> Server Secret Isolation
            </span>
            <p className="text-slate-400">
              API tokens and system keys remain on the server and are never exposed to browser clients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
