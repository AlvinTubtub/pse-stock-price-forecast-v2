import CompanyGrid from "@/components/CompanyGrid";
import { getCompanies } from "@/lib/data";
import { getSiteConfig } from "@/lib/admin/config";

export default async function CompaniesPage() {
  const [allCompanies, siteConfig] = await Promise.all([
    getCompanies(),
    getSiteConfig(),
  ]);

  const companies = allCompanies.filter((c) => {
    const pubStatus = siteConfig.forecastPublication?.[c.symbol] || "published";
    const compConfig = siteConfig.companies?.[c.symbol];
    const isVisible = compConfig ? compConfig.visible !== false : true;
    return pubStatus === "published" && isVisible;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-dark-border/60">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            PSE Ticker Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Tracked PSE Companies
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {companies.length} Philippine Stock Exchange listed securities with automated next-day price forecasts and backtest validations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {siteConfig.features.compareCompanies !== false && (
            <a
              href="/compare-companies"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>⚖️</span>
              <span>Compare Stocks</span>
            </a>
          )}
          <div className="text-xs text-slate-400 font-mono bg-dark-card border border-dark-border px-3 py-2 rounded-xl hidden md:block">
            1-Day Horizon
          </div>
        </div>
      </div>

      <CompanyGrid companies={companies} />
    </div>
  );
}
