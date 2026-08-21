import { getSiteConfig } from "@/lib/admin/config";

export default async function LearnPage() {
  const siteConfig = await getSiteConfig();

  if (siteConfig.features.learnStocks === false) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
        <p className="text-4xl">📖</p>
        <h1 className="text-xl font-bold text-white">Educational Guide Temporarily Disabled</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          The educational guide has been temporarily disabled by administrators.
        </p>
        <a
          href="/companies"
          className="inline-block px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold"
        >
          ← Explore All Companies
        </a>
      </div>
    );
  }
  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-3 pb-6 border-b border-dark-border/60">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30 uppercase tracking-wider">
          Educational Guide
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Understanding the Forecasts
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          A beginner-friendly breakdown of market data fundamentals, forecasting model architectures, and statistical evaluation metrics.
        </p>
      </div>

      <div className="space-y-10">
        {/* 1. Data Fundamentals: OHLCV */}
        <section className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>📊</span> What is OHLCV Data?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
              Before algorithms can forecast future price movements, they analyze numerical historical time-series data. ForecastPH trains models exclusively on standardized daily market records sourced from official PSE Daily Quotation Reports without external news sentiment or rumors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 pt-2">
            <div className="bg-dark-bg/80 p-4 rounded-xl border border-dark-border text-center">
              <div className="text-brand-400 font-bold text-2xl font-mono mb-1">O</div>
              <div className="text-white text-xs font-semibold">Open</div>
              <div className="text-[11px] text-slate-400 mt-1">First executed trade price of the day.</div>
            </div>

            <div className="bg-dark-bg/80 p-4 rounded-xl border border-dark-border text-center">
              <div className="text-emerald-400 font-bold text-2xl font-mono mb-1">H</div>
              <div className="text-white text-xs font-semibold">High</div>
              <div className="text-[11px] text-slate-400 mt-1">Highest recorded price during the session.</div>
            </div>

            <div className="bg-dark-bg/80 p-4 rounded-xl border border-dark-border text-center">
              <div className="text-rose-400 font-bold text-2xl font-mono mb-1">L</div>
              <div className="text-white text-xs font-semibold">Low</div>
              <div className="text-[11px] text-slate-400 mt-1">Lowest recorded price during the session.</div>
            </div>

            <div className="bg-brand-500/10 p-4 rounded-xl border border-brand-500/40 text-center ring-1 ring-brand-500/20 relative">
              <div className="absolute -top-2.5 -right-2 bg-brand-600 text-[9px] font-bold text-white px-2 py-0.5 rounded uppercase font-mono">
                Target
              </div>
              <div className="text-brand-300 font-bold text-2xl font-mono mb-1">C</div>
              <div className="text-white text-xs font-semibold">Close</div>
              <div className="text-[11px] text-slate-300 mt-1">Official settlement price. What we forecast.</div>
            </div>

            <div className="bg-dark-bg/80 p-4 rounded-xl border border-dark-border text-center">
              <div className="text-purple-400 font-bold text-2xl font-mono mb-1">V</div>
              <div className="text-white text-xs font-semibold">Volume</div>
              <div className="text-[11px] text-slate-400 mt-1">Total number of shares traded.</div>
            </div>
          </div>
        </section>

        {/* 2. Models Section */}
        <section className="space-y-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              The Forecasting Models
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Three distinct analytical paradigms evaluated alongside a naive persistence benchmark.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {/* Lag Regression */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 hover:border-brand-500/40 transition-all flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 bg-dark-bg rounded-xl flex items-center justify-center text-slate-300 mb-4 border border-dark-border text-xl">
                  🧮
                </div>
                <h3 className="text-base font-bold text-white mb-1">Lag-Informed Regression</h3>
                <p className="text-xs font-medium text-brand-400 mb-3">Statistical Machine Learning</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  An interpretable model utilizing Partial Autocorrelation Functions (PACF) to discover multi-day lag dependencies and LASSO regularization to penalize redundant features and avoid overfitting.
                </p>
              </div>
            </div>

            {/* ARIMA */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 hover:border-brand-500/40 transition-all flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 bg-dark-bg rounded-xl flex items-center justify-center text-blue-400 mb-4 border border-dark-border text-xl">
                  📈
                </div>
                <h3 className="text-base font-bold text-white mb-1">ARIMA</h3>
                <p className="text-xs font-medium text-blue-400 mb-3">Classical Econometrics</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  AutoRegressive Integrated Moving Average decomposes time-series data into autoregressive trends, differenced stationarity, and moving average error terms to model sequential market dynamics.
                </p>
              </div>
            </div>

            {/* LSTM */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 hover:border-brand-500/40 transition-all flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 bg-dark-bg rounded-xl flex items-center justify-center text-purple-400 mb-4 border border-dark-border text-xl">
                  🧠
                </div>
                <h3 className="text-base font-bold text-white mb-1">LSTM Neural Network</h3>
                <p className="text-xs font-medium text-purple-400 mb-3">Deep Sequence Learning</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Long Short-Term Memory recurrent neural network capable of capturing non-linear temporal relationships across lookback windows through gated cell memory mechanisms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Metrics Section */}
        <section className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Evaluation Metrics Explained
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              How models are graded during out-of-sample chronological backtesting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* RMSE */}
            <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand-400 uppercase">RMSE</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Lower is better
                </span>
              </div>
              <p className="text-xs font-medium text-white">Root Mean Squared Error (₱)</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Measures typical error magnitude in raw Pesos, heavily penalizing large prediction misses. Serves as our primary model-selection criterion.
              </p>
            </div>

            {/* MAE */}
            <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-400 uppercase">MAE</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Lower is better
                </span>
              </div>
              <p className="text-xs font-medium text-white">Mean Absolute Error (₱)</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Linear average difference between predicted and actual price in Pesos. Directly reflects typical misestimation distance.
              </p>
            </div>

            {/* MASE */}
            <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-amber-400 uppercase">MASE</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  &lt; 1.0 beats naive
                </span>
              </div>
              <p className="text-xs font-medium text-white">Mean Absolute Scaled Error</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scales error relative to a one-step naive baseline (yesterday = today). MASE &lt; 1.0 proves the model generates superior forecasts over simple persistence.
              </p>
            </div>

            {/* R2 */}
            <div className="bg-dark-bg/80 border border-dark-border rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-cyan-400 uppercase">R²</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Supplementary
                </span>
              </div>
              <p className="text-xs font-medium text-white">Goodness-of-Fit (Variance Explained)</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Measures the proportion of variance in test-split price levels accounted for by the model. It is a supplementary fit metric and is not a forecast probability or confidence percentage.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Responsible Use Disclaimer */}
        <section className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4 shadow-sm">
          <div className="text-rose-400 text-2xl shrink-0">⚠️</div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-300">
              Educational &amp; Research Disclaimer
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              ForecastPH is strictly an academic decision-support and educational analytics project. Models rely purely on historical closing data and cannot account for unexpected economic shocks, corporate disclosures, or geopolitical volatility. Nothing displayed constitutes financial advice, buy/sell signals, or guaranteed outcomes.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
