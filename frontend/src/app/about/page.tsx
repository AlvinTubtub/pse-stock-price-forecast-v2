export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 pb-6 border-b border-dark-border/60">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30 uppercase tracking-wider">
          Capstone Overview
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          About the Research
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          BSIT Data Analytics Capstone: Cross-Sector Next-Day Stock Price Forecasting on the Philippine Stock Exchange.
        </p>
      </div>

      <div className="space-y-8">
        {/* Project Overview */}
        <section className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
          <h2 className="text-xl font-bold text-white tracking-tight pb-3 border-b border-dark-border/60">
            Project Motivation &amp; Problem Statement
          </h2>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div>
              <h3 className="text-sm font-semibold text-brand-400 mb-1.5">The Problem</h3>
              <p>
                Local research on Philippine equities often evaluates isolated models or restricts analysis solely to the benchmark PSEi composite index. Traditional outputs are frequently code-centric and inaccessible to beginner market participants. Furthermore, comparative validation across industry sectors remains sparse, obscuring how model families behave across diverse liquidity and volatility regimes.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-brand-400 mb-1.5">System Architecture</h3>
              <p>
                Historical OHLCV data spanning multiple years are sourced from official PSE Daily Quotation Reports. Datasets undergo automated cleaning, lag feature engineering, PACF signal extraction, and stationarity transformations. The data are chronologically partitioned into an 85% Development split and a 15% Hold-out Test split with rolling-origin temporal validation to strictly prevent data leakage. Three forecasting architectures (ARIMA, Lag-Informed Regression, and LSTM) are evaluated under identical conditions to select the optimal model per security.
              </p>
            </div>
          </div>
        </section>

        {/* Methodology & Rigor */}
        <section className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <h2 className="text-xl font-bold text-white tracking-tight pb-3 border-b border-dark-border/60">
            Methodological Rigor &amp; Target Stakeholders
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Target Stakeholders
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-brand-400 font-bold">✓</span>
                  <span>Budding Traders &amp; Retail Investors</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-400 font-bold">✓</span>
                  <span>Data Analytics &amp; Finance Students</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-400 font-bold">✓</span>
                  <span>Quantitative Researchers &amp; ML Practitioners</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-400 font-bold">✓</span>
                  <span>Academic &amp; Research Community</span>
                </li>
              </ul>
            </div>

            <div className="bg-dark-bg/80 border border-dark-border/80 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Statistical Significance
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                RMSE serves as the primary selection criterion for per-company model winners. To ensure observed differences are distinguishable from random chance, non-parametric Friedman omnibus tests and post-hoc Wilcoxon signed-rank tests with Holm-Bonferroni corrections are applied.
              </p>
            </div>
          </div>
        </section>

        {/* Responsible Use Disclaimer */}
        <section className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-sm">
          <h2 className="text-lg font-bold text-white tracking-tight">Responsible Use Policy</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mx-auto leading-relaxed">
            This application is purely an educational decision-support demonstration. It relies exclusively on historical technical price action and does not integrate real-time macroeconomic news, central bank policies, earnings releases, or corporate events. Forecasts do not represent trading recommendations or financial advice.
          </p>
        </section>
      </div>
    </div>
  );
}
