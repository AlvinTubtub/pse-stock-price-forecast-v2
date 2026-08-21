import { formatNum } from "@/lib/format";

interface ModelVerdictCardProps {
  symbol: string;
  selectedModel: string;
  selectedModelRmse: string | number;
  selectedModelMase: string | number;
  beatsNaive: boolean;
}

export default function ModelVerdictCard({
  symbol,
  selectedModel,
  selectedModelRmse,
  selectedModelMase,
  beatsNaive,
}: ModelVerdictCardProps) {
  const formattedRmse = formatNum(selectedModelRmse, 4);
  const formattedMase = formatNum(selectedModelMase, 4);

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-dark-border/60 mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Model Verdict
        </h3>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            beatsNaive
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
          }`}
        >
          {beatsNaive ? "✓ Beats Naive Baseline (MASE < 1.0)" : "⚠ Baseline Equivalent / Slower"}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-2.5">
          <span className="text-emerald-400 font-bold text-base leading-none mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-white">
              {selectedModel} performed best for {symbol} on the held-out test period.
            </p>
          </div>
        </div>

        <div className="bg-dark-bg/70 border border-dark-border/80 rounded-xl p-4 text-xs text-slate-300 space-y-2">
          <p className="font-medium text-slate-200">
            <strong>Why was {selectedModel} selected?</strong>
          </p>
          <p className="text-slate-300 leading-relaxed">
            During chronological out-of-sample backtesting, {selectedModel} achieved the lowest Root Mean Squared Error (RMSE: ₱{formattedRmse}) among the candidate models (ARIMA, Lag-Informed Regression, and LSTM).
          </p>
          <p className="text-slate-400 leading-relaxed">
            {beatsNaive
              ? `With a MASE of ${formattedMase} (< 1.0), this model demonstrated statistically superior predictive accuracy compared to naive persistence (tomorrow = today).`
              : `With a MASE of ${formattedMase}, predictions are close to the naive baseline persistence, reflecting high market efficiency for this ticker.`}
          </p>
        </div>
      </div>
    </div>
  );
}
