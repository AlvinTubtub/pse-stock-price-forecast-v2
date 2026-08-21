import { getCompanies, getDashboard } from "@/lib/data";
import { getSiteConfig } from "@/lib/admin/config";
import SectorsClient from "@/components/SectorsClient";

export default async function SectorsPage() {
  const [allCompanies, dashboard, siteConfig] = await Promise.all([
    getCompanies(),
    getDashboard(),
    getSiteConfig(),
  ]);

  if (siteConfig.features.sectorOverview === false) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
        <p className="text-4xl">🌐</p>
        <h1 className="text-xl font-bold text-white">Sector Overview Temporarily Disabled</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          The sector overview module has been temporarily disabled by administrators.
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

  const companies = allCompanies.filter((c) => {
    const pubStatus = siteConfig.forecastPublication?.[c.symbol] || "published";
    const compConfig = siteConfig.companies?.[c.symbol];
    const isVisible = compConfig ? compConfig.visible !== false : true;
    return pubStatus === "published" && isVisible;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-dark-border/60">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 block mb-1">
            Industry Breakdown
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sector Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Aggregated next-session forecast dynamics, dominant forecasting models, and price directions across the 5 tracked PSE sectors.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono self-start sm:self-auto bg-dark-card border border-dark-border px-3 py-1.5 rounded-lg">
          5 Tracked Sectors
        </div>
      </div>

      <SectorsClient companies={companies} />
    </div>
  );
}
