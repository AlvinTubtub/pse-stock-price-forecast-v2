export default function LivePredictionPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="pb-3 border-b border-dark-border/60">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Automated Pipeline vs Live Inference
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Why ForecastPH pre-computes forecasts via scheduled pipelines.
        </p>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-7 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed shadow-sm">
        <p>
          The original research prototype allowed uploading a CSV and running arbitrary prediction in real-time. That workflow required an active Python runtime (statsmodels ARIMA, PyTorch LSTM, and scikit-learn), whereas this production dashboard is 100% static and performs zero server-side Python execution for optimal reliability, security, and response latency.
        </p>
        <p>
          Every forecast on this site is produced ahead of time by the scheduled automated pipeline and published as immutable JSON artifacts. This ensures all backtest metrics, residual calculations, and next-day price estimates are consistent, reproducible, and academically verifiable.
        </p>
        <p>
          You can inspect all covered PSE companies or check when the pipeline was last refreshed on the{" "}
          <a href="/" className="text-brand-400 hover:text-brand-300 underline font-medium">
            Home Dashboard
          </a>
          .
        </p>
      </div>

      <a
        href="/companies"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
      >
        Explore Companies →
      </a>
    </div>
  );
}
