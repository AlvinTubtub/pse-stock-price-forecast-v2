"use client";

import React, { useState, useEffect } from "react";

export type ChartType = "ohlcv" | "prediction" | "backtest" | "error";

interface ChartHelpModalProps {
  type: ChartType;
  title?: string;
}

const HELP_CONTENT: Record<
  ChartType,
  {
    title: string;
    subtitle: string;
    sections: { heading: string; text: string }[];
    tip: string;
  }
> = {
  ohlcv: {
    title: "How to Read the Historical OHLCV Chart",
    subtitle: "Understanding historical price levels and volume dynamics",
    sections: [
      {
        heading: "What does this line represent?",
        text: "The main line plots daily official closing prices recorded from PSE Daily Quotation Reports over time.",
      },
      {
        heading: "What does the shaded/volume area show?",
        text: "The lower area represents trading volume (total shares exchanged). Higher volume spikes often confirm significant price shifts or market interest.",
      },
      {
        heading: "How do I interact with the chart?",
        text: "Use the 1M, 3M, 6M, and 1Y quick range buttons, or specify exact start and end dates to zoom in on specific market cycles.",
      },
    ],
    tip: "Tip: Compare recent price action against multi-month support (floor) and resistance (ceiling) price levels.",
  },
  prediction: {
    title: "How to Read the Next-Day Prediction Chart",
    subtitle: "Understanding upcoming session closing price forecasts",
    sections: [
      {
        heading: "Solid Line vs. Dashed Endpoints",
        text: "The solid line shows recent actual closing prices up to the latest trading session. The final dashed point extends forward to illustrate tomorrow's forecast.",
      },
      {
        heading: "Candidate Model Spread",
        text: "You can see predictions from ARIMA, Lag-Informed Regression, and LSTM. When multiple models project similar prices, forecast agreement is higher.",
      },
      {
        heading: "Selected Model",
        text: "The primary highlighted prediction is from the model that achieved the lowest test-set RMSE for this specific company.",
      },
    ],
    tip: "Tip: Look at the difference between the latest actual close and the forecasted close to understand the expected shift (₱ and %).",
  },
  backtest: {
    title: "How to Read the Backtest (Predicted vs. Actual) Chart",
    subtitle: "Evaluating how models performed on historical test sessions",
    sections: [
      {
        heading: "What is a Backtest?",
        text: "A backtest simulates how the model would have performed in the past by generating 1-step-ahead forecasts chronologically across a held-out test period.",
      },
      {
        heading: "Predicted (Dashed) vs. Actual (Green)",
        text: "The green line represents actual settlement prices. The dashed lines represent what each model forecasted before the session occurred.",
      },
      {
        heading: "What is good agreement?",
        text: "When the dashed predicted line closely tracks peaks and valleys of the actual green line without large lag or divergence, the model demonstrates high fidelity.",
      },
    ],
    tip: "Tip: Look for periods of high volatility to see whether the model responded smoothly or overreacted.",
  },
  error: {
    title: "How to Read the Forecast Error Over Time Chart",
    subtitle: "Understanding model residuals (Predicted Close − Actual Close)",
    sections: [
      {
        heading: "What are Residuals?",
        text: "Forecast error is calculated for every session as: Error = Predicted Close − Actual Close (in Pesos).",
      },
      {
        heading: "Zero Baseline (The Neutral Line)",
        text: "A point at exactly 0.00 means a perfect prediction with zero error.",
      },
      {
        heading: "Positive vs. Negative Errors",
        text: "Positive values (> 0) indicate the model overestimated the price. Negative values (< 0) indicate the model underestimated the price.",
      },
    ],
    tip: "Tip: An unbiased, stable forecasting model has errors that oscillate tightly around the zero line without persistent bias.",
  },
};

export default function ChartHelpModal({ type, title }: ChartHelpModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const info = HELP_CONTENT[type];

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

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-dark-bg/80 hover:bg-dark-bg text-slate-400 hover:text-brand-300 border border-dark-border text-[11px] font-medium transition-colors cursor-pointer"
        aria-label={`How to read ${title || info.title}`}
      >
        <span>❓</span>
        <span>How to read this chart</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={info.title}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-dark-border/70">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">{info.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{info.subtitle}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-dark-bg transition-colors text-xs"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Sections */}
            <div className="space-y-3">
              {info.sections.map((sec, idx) => (
                <div key={idx} className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-3 space-y-1">
                  <h4 className="text-xs font-semibold text-brand-300">{sec.heading}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{sec.text}</p>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-brand-200">
              {info.tip}
            </div>

            {/* Close action */}
            <div className="text-right pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
