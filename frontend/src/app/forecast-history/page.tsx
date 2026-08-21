import { getAllSymbols, getCompanyDetail } from "@/lib/data";
import { getSiteConfig } from "@/lib/admin/config";
import ForecastHistoryClient from "@/components/ForecastHistoryClient";

export default async function ForecastHistoryPage() {
  const [symbols, siteConfig] = await Promise.all([
    getAllSymbols(),
    getSiteConfig(),
  ]);

  if (siteConfig.features.forecastHistory === false) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
        <p className="text-4xl">📜</p>
        <h1 className="text-xl font-bold text-white">Forecast History Temporarily Disabled</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          The historical accuracy and backtest tracking module has been temporarily disabled by administrators.
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

  const details = await Promise.all(symbols.map((sym) => getCompanyDetail(sym)));

  const validCompanies = details
    .filter(Boolean)
    .filter((c) => {
      const pubStatus = siteConfig.forecastPublication?.[c!.symbol] || "published";
      const compConfig = siteConfig.companies?.[c!.symbol];
      const isVisible = compConfig ? compConfig.visible !== false : true;
      return pubStatus === "published" && isVisible;
    })
    .map((c) => ({
      symbol: c!.symbol,
      name: c!.name,
      sector: c!.sector,
      model: c!.model,
      metrics: c!.metrics,
      backtestDates: c!.backtestDates || [],
      backtestActual: c!.backtestActual || [],
      backtestByModel: c!.backtestByModel || {},
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-dark-border/60">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Historical Accuracy &amp; Track Record
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Forecast History &amp; Backtests
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Session-by-session chronological forecast logs, realized settlement prices, and residual accuracy scores.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono self-start sm:self-auto bg-dark-card border border-dark-border px-3 py-1.5 rounded-lg">
          Held-Out Test Split
        </div>
      </div>

      <ForecastHistoryClient data={validCompanies} />
    </div>
  );
}
