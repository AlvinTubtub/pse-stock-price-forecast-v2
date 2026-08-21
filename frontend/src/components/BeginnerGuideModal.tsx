"use client";

import React, { useState, useEffect } from "react";

export default function BeginnerGuideModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const steps = [
    {
      num: "1",
      title: "Check the Forecast",
      desc: "Look at the Forecast Summary at the top to see the predicted next-session closing price, expected change (₱ and %), and whether the model expects an increase (↑) or decrease (↓).",
      tag: "Price Estimate",
    },
    {
      num: "2",
      title: "Review Historical Context",
      desc: "Inspect the Historical OHLCV chart to understand the stock's recent price range, volume activity, and multi-month trends before evaluating the forecast in isolation.",
      tag: "Price History",
    },
    {
      num: "3",
      title: "Compare Actual vs. Predicted",
      desc: "Check the Backtest chart to observe how closely historical model predictions tracked actual settlement prices across recent trading sessions.",
      tag: "Historical Fidelity",
    },
    {
      num: "4",
      title: "Check if the Model Beats Naive",
      desc: "Check the MASE metric. A MASE below 1.0 proves the model generated more accurate forecasts than a simple naive benchmark (guessing tomorrow equals today).",
      tag: "Benchmark Rigor",
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold transition-colors cursor-pointer"
        aria-label="Show beginner guide on how to read this stock forecast page"
      >
        <span>💡</span>
        <span>Show me how to read this page</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="How to read this stock forecast page guide"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-dark-border/70">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📖</span>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    What should I look at?
                  </h3>
                  <p className="text-xs text-slate-400">
                    A beginner-friendly 4-step guide to interpreting this page.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-dark-bg transition-colors text-sm"
                aria-label="Close guide"
              >
                ✕
              </button>
            </div>

            {/* 4 Steps */}
            <div className="space-y-3.5">
              {steps.map((s) => (
                <div
                  key={s.num}
                  className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3.5 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                    {s.num}
                  </span>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white">{s.title}</h4>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-dark-card border border-dark-border text-slate-400">
                        {s.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Responsible Educational Note */}
            <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-brand-300">Important Reminders:</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                • Forecasts are statistical estimates for educational research, not financial advice.
                <br />
                • No model is 100% accurate; always consider broader market conditions and risk tolerance.
              </p>
            </div>

            {/* Close Button */}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Got it, let&apos;s explore
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
