interface HowItWorksFlowProps {
  totalCompanies?: number;
  totalSectors?: number;
}

const STEPS = [
  {
    num: "1",
    title: "Collect PSE Data",
    desc: "Historical daily OHLCV records sourced directly from official PSE Daily Quotations Reports.",
    tag: "Data Ingestion",
  },
  {
    num: "2",
    title: "Engineer Features",
    desc: "Generate technical lag features, rolling statistics, PACF temporal signals, and data scaling.",
    tag: "Preprocessing",
  },
  {
    num: "3",
    title: "Train Forecast Models",
    desc: "Train ARIMA, Lag-Informed Regression (LASSO), and LSTM neural networks on chronological splits.",
    tag: "Model Training",
  },
  {
    num: "4",
    title: "Evaluate Models",
    desc: "Measure out-of-sample RMSE, MAE, MASE, and R² against the naive persistence benchmark.",
    tag: "Validation",
  },
  {
    num: "5",
    title: "Select Best Model",
    desc: "Autonomously select the model producing the lowest test-set RMSE for each individual company.",
    tag: "Model Selection",
  },
  {
    num: "6",
    title: "Generate Next-Day Forecast",
    desc: "Compute next-session closing price prediction with confidence boundaries and transparent metrics.",
    tag: "Inference",
  },
];

export default function HowItWorksFlow({
  totalCompanies = 15,
  totalSectors = 5,
}: HowItWorksFlowProps) {
  return (
    <section className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-4 border-b border-dark-border/70">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Research Architecture
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            How ForecastPH Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            An automated end-to-end forecasting pipeline that strictly enforces chronological data splitting to eliminate lookahead bias and evaluate predictive reliability.
          </p>
        </div>

        {/* Supporting Statistics Pill */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-dark-bg border border-dark-border px-3 py-1.5 rounded-lg text-slate-300 font-mono">
            <strong>{totalCompanies}</strong> Companies
          </span>
          <span className="bg-dark-bg border border-dark-border px-3 py-1.5 rounded-lg text-slate-300 font-mono">
            <strong>{totalSectors}</strong> Sectors
          </span>
          <span className="bg-dark-bg border border-dark-border px-3 py-1.5 rounded-lg text-slate-300 font-mono">
            <strong>3+1</strong> Models
          </span>
        </div>
      </div>

      {/* Six Step Grid Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STEPS.map((step) => (
          <div
            key={step.num}
            className="bg-dark-bg/80 border border-dark-border rounded-xl p-5 relative flex flex-col justify-between hover:border-brand-500/40 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 font-bold text-xs flex items-center justify-center font-mono">
                  {step.num}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono bg-dark-card px-2 py-0.5 rounded border border-dark-border">
                  {step.tag}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{step.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Research Methodology Footnote */}
      <div className="pt-2 text-xs text-slate-400 flex items-center justify-between border-t border-dark-border/50 flex-wrap gap-2">
        <span>Chronological 85% Development / 15% Hold-Out Test Split</span>
        <a href="/about" className="text-brand-400 hover:text-brand-300 font-medium">
          Read full research methodology →
        </a>
      </div>
    </section>
  );
}
