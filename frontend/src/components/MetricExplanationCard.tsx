import { formatNum } from "@/lib/format";
import type { ModelMetric } from "@/lib/types";

interface MetricExplanationCardProps {
  metrics: ModelMetric;
  modelName: string;
  symbol: string;
}

export default function MetricExplanationCard({
  metrics,
  modelName,
  symbol,
}: MetricExplanationCardProps) {
  const rmse = formatNum(metrics.rmse, 4);
  const mae = formatNum(metrics.mae, 4);
  const mase = formatNum(metrics.mase, 4);
  const r2 = formatNum(metrics.r2, 4);

  const maseVal = parseFloat(String(metrics.mase));
  const beatsNaive = !isNaN(maseVal) && maseVal < 1.0;

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-dark-border/60">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Evaluation Metrics: {modelName}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Calculated on the chronological 15% held-out test split for {symbol}.
          </p>
        </div>
        <span className="text-[11px] text-slate-400 font-mono bg-dark-bg px-2.5 py-1 rounded-md border border-dark-border self-start sm:self-auto">
          Out-of-Sample Test
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* RMSE */}
        <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">
                RMSE
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Lower is better</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono my-1">₱{rmse}</p>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Measures the typical magnitude of prediction errors, heavily penalizing large outliers.
          </p>
        </div>

        {/* MAE */}
        <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                MAE
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Lower is better</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono my-1">₱{mae}</p>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Average absolute difference between the predicted and actual stock closing price.
          </p>
        </div>

        {/* MASE */}
        <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                MASE
              </span>
              <span
                className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                  beatsNaive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {beatsNaive ? "< 1.0 (Beats Naive)" : "≥ 1.0 (Baseline)"}
              </span>
            </div>
            <p
              className={`text-2xl font-bold font-mono my-1 ${
                beatsNaive ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {mase}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Compares model accuracy to the naive persistence baseline. A value below 1.0 indicates superior forecasting.
          </p>
        </div>

        {/* R² */}
        <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
                R² (Variance)
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Goodness of fit</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono my-1">{r2}</p>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Proportion of price variance explained in the test split. (Not a forecast probability or confidence).
          </p>
        </div>
      </div>
    </div>
  );
}
