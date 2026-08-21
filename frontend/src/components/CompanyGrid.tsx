"use client";

import { useMemo, useState } from "react";
import CompanyCard from "./CompanyCard";
import type { CompanySummary } from "@/lib/types";

export default function CompanyGrid({ companies }: { companies: CompanySummary[] }) {
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const sectors = useMemo(() => {
    const unique = Array.from(new Set(companies.map((c) => c.sector))).sort();
    return ["All", ...unique];
  }, [companies]);

  // Sector counts mapping
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = { All: companies.length };
    for (const c of companies) {
      counts[c.sector] = (counts[c.sector] || 0) + 1;
    }
    return counts;
  }, [companies]);

  const filtered = useMemo(() => {
    let result = companies;

    if (selectedSector !== "All") {
      result = result.filter((c) => c.sector === selectedSector);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.symbol.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.bestModel.toLowerCase().includes(q)
      );
    }

    return result;
  }, [companies, selectedSector, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search and Sector Filter Controls */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by symbol, company name, or model..."
              aria-label="Search companies"
              className="block w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Result Count and Clear Filters */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-400">
            <span>
              Showing <strong className="text-white font-mono">{filtered.length}</strong> of{" "}
              <span className="font-mono">{companies.length}</span> companies
            </span>
            {(selectedSector !== "All" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSector("All");
                  setSearchQuery("");
                }}
                className="text-brand-400 hover:text-brand-300 font-medium underline transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Visual Sector Filter Pills */}
        <div className="pt-3 border-t border-dark-border/60">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {sectors.map((s) => {
              const isSelected = selectedSector === s;
              const count = sectorCounts[s] ?? 0;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSector(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-brand-600 text-white shadow-sm font-semibold"
                      : "bg-dark-bg/80 hover:bg-dark-bg text-slate-300 border border-dark-border hover:border-slate-600"
                  }`}
                >
                  <span>{s === "All" ? "All Sectors" : s}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? "bg-brand-700 text-white" : "bg-dark-card text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid of Cards or Empty State */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CompanyCard key={c.symbol} company={c} />
          ))}
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center space-y-3">
          <p className="text-4xl">🔍</p>
          <h3 className="text-lg font-bold text-white">No companies match your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            No tracked PSE companies matched your search for &quot;{searchQuery || selectedSector}&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedSector("All");
              setSearchQuery("");
            }}
            className="mt-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
