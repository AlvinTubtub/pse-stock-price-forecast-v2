import Link from "next/link";
import CompanyCard from "@/components/CompanyCard";
import ChangeBadge from "@/components/ChangeBadge";
import HowItWorksFlow from "@/components/HowItWorksFlow";
import { getCompanies, getDashboard, getMetrics } from "@/lib/data";
import { getSiteConfig } from "@/lib/admin/config";
import { formatDate, formatDateTimePht, formatNum, formatPeso } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [dashboard, allCompanies, metrics, siteConfig] = await Promise.all([
    getDashboard(),
    getCompanies(),
    getMetrics(),
    getSiteConfig(),
  ]);

  // Filter companies according to admin publication & visibility configuration
  const companies = allCompanies.filter((c) => {
    const pubStatus = siteConfig.forecastPublication?.[c.symbol] || "published";
    const compConfig = siteConfig.companies?.[c.symbol];
    const isVisible = compConfig ? compConfig.visible !== false : true;
    return pubStatus === "published" && isVisible;
  });

  // Sort companies by percentage change for movers
  const sortedByChange = [...companies].sort((a, b) => b.pctChange - a.pctChange);
  const topGainers = sortedByChange.filter((c) => c.pctChange > 0).slice(0, 3);
  const topLosers = sortedByChange.filter((c) => c.pctChange < 0).slice(-3).reverse();

  // Curated highlights for today
  const highlightCompanies = companies.slice(0, 3);

  // Best aggregate model
  const bestAggregateModel = metrics?.bestModel ?? "ARIMA";
  const bestModelAggregateMetrics = metrics?.aggregate?.[bestAggregateModel];

  const content = siteConfig.content;
  const features = siteConfig.features;

  return (
    <div className="space-y-10">
      {/* 0. Optional Broadcast Announcement Banner */}
      {content.announcement?.enabled && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center gap-3 animate-in fade-in shadow-sm ${
            content.announcement.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : content.announcement.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-brand-500/10 border-brand-500/30 text-brand-300"
          }`}
        >
          <span className="text-lg shrink-0">📢</span>
          <span className="leading-relaxed">{content.announcement.text}</span>
        </div>
      )}

      {/* 1. Hero / Header */}
      <section className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30 uppercase tracking-wider">
                Educational Only
              </span>
              <span className="text-xs text-slate-400 font-mono">
                BSIT Capstone Research
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {content.heroTitle || "ForecastPH"}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              {content.heroDescription ||
                "Next-session closing price forecasts generated from historical Philippine Stock Exchange daily market data through machine learning and statistical time-series models."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <a
              href="/companies"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-sm transition-all text-center cursor-pointer"
            >
              Explore Companies →
            </a>
            {features.modelPerformance !== false && (
              <a
                href="/compare"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-dark-bg hover:bg-white/5 border border-dark-border text-slate-200 font-medium text-sm transition-all text-center cursor-pointer"
              >
                Compare Models
              </a>
            )}
          </div>
        </div>

        {/* Timestamp metadata */}
        {(dashboard?.forecastDate || dashboard?.lastRunAt) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 pt-4 border-t border-dark-border/60 text-xs">
            {dashboard?.forecastDate && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Forecast Horizon:</span>
                <strong className="text-brand-600 dark:text-brand-300 font-bold font-mono">
                  {formatDate(dashboard.forecastDate)} (1 Trading Day)
                </strong>
              </div>
            )}
            {dashboard?.forecastDate && dashboard?.lastRunAt && <span className="text-slate-400 dark:text-slate-500">&middot;</span>}
            {dashboard?.lastRunAt && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Pipeline Execution:</span>
                <span className="text-slate-800 dark:text-slate-100 font-semibold">{formatDateTimePht(dashboard.lastRunAt)}</span>
              </div>
            )}
            <span className="text-slate-400 dark:text-slate-500">&middot;</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Data Source:</span>
              <span className="text-slate-800 dark:text-slate-100 font-semibold">{content.dataSourceText}</span>
            </div>
          </div>
        )}
      </section>

      {/* 2. Market Snapshot */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Market Snapshot
          </h2>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 font-mono">PSE Historical Pipeline</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 mb-1">Pipeline Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-lg font-extrabold text-white uppercase font-mono">
                {dashboard?.status ?? "Operational"}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">Automated Daily Inference</p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 mb-1">Companies Tracked</p>
            <p className="text-2xl font-extrabold text-white font-mono">
              {companies.length}
            </p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">
              Active Published Equities
            </p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 mb-1">Forecast Direction</p>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-xl font-bold text-emerald-400">
                {dashboard?.marketSummary.gainers ?? 0} ↑
              </span>
              <span className="text-xl font-bold text-rose-400">
                {dashboard?.marketSummary.losers ?? 0} ↓
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                ({dashboard?.marketSummary.unchanged ?? 0} = )
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">Next-Session Bias</p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 mb-1">Forecast Horizon</p>
            <p className="text-xl font-extrabold text-white">1 Trading Day</p>
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-300 mt-1">Next Closing Session</p>
          </div>
        </div>
      </section>

      {/* 3. Today's Forecast Highlights */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Today&apos;s Forecast Highlights
            </h2>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
              Sample of model-selected closing price estimates for upcoming trading sessions.
            </p>
          </div>
          <a href="/companies" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline hidden sm:inline">
            View All {companies.length} Companies →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {highlightCompanies.map((c) => (
            <a
              key={c.symbol}
              href={`/companies/${c.symbol}`}
              className="group bg-dark-card border border-dark-border rounded-xl p-5 hover:border-brand-500/50 transition-all shadow-sm space-y-3.5 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-brand-400 transition-colors">
                    {c.symbol}
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-[180px]">{c.name}</p>
                </div>
                <ChangeBadge pctChange={c.pctChange} />
              </div>

              <div className="bg-dark-bg/80 border border-dark-border/80 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Price Shift</span>
                  <span className="text-sm font-semibold text-slate-300 font-mono">
                    {formatPeso(c.latestClose)} → <strong className="text-white">{formatPeso(c.predictedClose)}</strong>
                  </span>
                </div>
                <span className={`text-xs font-bold font-mono ${c.pctChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {c.pctChange >= 0 ? "+" : ""}{c.pctChange.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
                  Model: <strong className="text-slate-300 font-medium">{c.bestModel}</strong>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-slate-400">
                  {c.sector}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 4. Biggest Expected Movers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Biggest Expected Movers
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked by next-session percentage change calculated from historical models.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gainers */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-dark-border/60">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <span>↑</span> Top Expected Gainers
              </span>
              <span className="text-[11px] text-slate-500 font-mono">1-Session Horizon</span>
            </div>

            {topGainers.length > 0 ? (
              <div className="space-y-2">
                {topGainers.map((c) => (
                  <a
                    key={c.symbol}
                    href={`/companies/${c.symbol}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-dark-bg/60 hover:bg-dark-bg border border-dark-border/60 hover:border-brand-500/30 transition-all text-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white group-hover:text-brand-400 transition-colors">
                        {c.symbol}
                      </span>
                      <span className="text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                        {c.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-400">{formatPeso(c.predictedClose)}</span>
                      <span className="font-bold text-emerald-400">+{c.pctChange.toFixed(2)}%</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No positive forecasts in current cycle.</p>
            )}
          </div>

          {/* Losers */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-dark-border/60">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                <span>↓</span> Top Expected Decliners
              </span>
              <span className="text-[11px] text-slate-500 font-mono">1-Session Horizon</span>
            </div>

            {topLosers.length > 0 ? (
              <div className="space-y-2">
                {topLosers.map((c) => (
                  <a
                    key={c.symbol}
                    href={`/companies/${c.symbol}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-dark-bg/60 hover:bg-dark-bg border border-dark-border/60 hover:border-brand-500/30 transition-all text-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white group-hover:text-brand-400 transition-colors">
                        {c.symbol}
                      </span>
                      <span className="text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                        {c.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-400">{formatPeso(c.predictedClose)}</span>
                      <span className="font-bold text-rose-400">{c.pctChange.toFixed(2)}%</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No negative forecasts in current cycle.</p>
            )}
          </div>
        </div>
      </section>

      {/* 5. How It Works Flow */}
      <HowItWorksFlow />

      {/* 6. Responsible Research Notice */}
      <section className="p-4 sm:p-5 rounded-2xl bg-dark-card border border-dark-border text-xs text-slate-400 leading-relaxed space-y-1">
        <p className="font-semibold text-slate-300">Responsible Educational Analytics Disclaimer</p>
        <p>{content.disclaimerText}</p>
      </section>
    </div>
  );
}
