import ChangeBadge from "./ChangeBadge";
import { formatDate, formatPeso } from "@/lib/format";
import type { CompanySummary } from "@/lib/types";

export default function CompanyCard({ company }: { company: CompanySummary }) {
  const isPositive = company.pctChange > 0;
  const isNegative = company.pctChange < 0;

  return (
    <a
      href={`/companies/${company.symbol}`}
      className="group block bg-dark-card border border-dark-border rounded-xl p-5 hover:border-brand-500/50 hover:shadow-md transition-all duration-150 space-y-3.5 relative overflow-hidden"
    >
      {/* Top Row: Symbol, Name, Sector, and Change */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-brand-400 transition-colors">
              {company.symbol}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-slate-400 font-medium truncate max-w-[120px]">
              {company.sector}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate max-w-[180px] sm:max-w-[220px] mt-0.5" title={company.name}>
            {company.name}
          </p>
        </div>

        <ChangeBadge pctChange={company.pctChange} />
      </div>

      {/* Main Forecast & Previous Price Grid */}
      <div className="pt-3 border-t border-dark-border/60 grid grid-cols-2 gap-3">
        <div className="bg-dark-bg/60 rounded-lg p-2.5 border border-dark-border/60">
          <p className="text-[11px] text-brand-600 dark:text-brand-300 font-semibold mb-0.5">Forecasted</p>
          <p className="text-lg font-bold text-white font-mono leading-tight">
            {formatPeso(company.predictedClose)}
          </p>
        </div>

        <div className="bg-dark-bg/60 rounded-lg p-2.5 border border-dark-border/60">
          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Previous</p>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100 font-mono leading-tight">
            {formatPeso(company.latestClose)}
          </p>
        </div>
      </div>

      {/* Selected Model & Date Meta */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="min-w-0 pr-2">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block">Selected Model</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate block" title={company.bestModel}>
            {company.bestModel}
          </span>
        </div>

        {company.forecastDate && (
          <div className="text-right shrink-0">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block">Forecast For</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block font-mono">
              {formatDate(company.forecastDate)}
            </span>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="pt-2 border-t border-dark-border/40 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">1-Day Horizon</span>
        <span className="text-brand-600 dark:text-brand-400 group-hover:text-brand-500 font-semibold inline-flex items-center gap-1 transition-colors">
          View Forecast <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </a>
  );
}
