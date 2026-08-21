"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import type { CompanySummary } from "@/lib/types";
import type { NavigationItem, FeatureFlags } from "@/lib/admin/types";

const DEFAULT_LINKS: NavigationItem[] = [
  { id: "home", href: "/", label: "Home", visible: true },
  { id: "companies", href: "/companies", label: "Companies", visible: true },
  { id: "compare-companies", href: "/compare-companies", label: "Compare", visible: true },
  { id: "sectors", href: "/sectors", label: "Sectors", visible: true },
  { id: "forecast-history", href: "/forecast-history", label: "History", visible: true },
  { id: "compare", href: "/compare", label: "Models", visible: true },
  { id: "learn", href: "/learn", label: "Learn", visible: true },
  { id: "about", href: "/about", label: "About", visible: true },
];

export default function Navbar({
  companies,
}: {
  companies: CompanySummary[];
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [navLinks, setNavLinks] = useState<NavigationItem[]>(DEFAULT_LINKS);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    fetch("/forecasts/config/site_config.json")
      .then((r) => r.json())
      .then((data) => {
        if (data?.navigation) setNavLinks(data.navigation);
        if (data?.features) setFeatures(data.features);
      })
      .catch(() => {});
  }, []);

  const matches = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();

    return companies
      .filter(
        (c) =>
          c.symbol.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [query, companies]);

  function goTo(url: string) {
    setQuery("");
    window.location.assign(url);
  }

  // Filter visible links according to admin configuration and feature flags
  const visibleLinks = useMemo(() => {
    return navLinks.filter((link) => {
      if (link.visible === false) return false;

      // Feature flag dependencies
      if (link.href === "/compare-companies" && features?.compareCompanies === false) return false;
      if (link.href === "/sectors" && features?.sectorOverview === false) return false;
      if (link.href === "/forecast-history" && features?.forecastHistory === false) return false;
      if (link.href === "/compare" && features?.modelPerformance === false) return false;
      if (link.href === "/learn" && features?.learnStocks === false) return false;

      return true;
    });
  }, [navLinks, features]);

  return (
    <nav className="fixed top-0 w-full glass z-50 border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-2 transition-transform hover:scale-105"
          >
            <span className="bg-brand-600 text-white p-1.5 rounded-lg text-sm leading-none">
              📈
            </span>

            <span className="font-bold text-xl text-white tracking-tight">
              Forecast<span className="text-brand-400">PH</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <a
                  key={link.id || link.href}
                  href={link.href}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                    active
                      ? "text-brand-400 bg-brand-500/10 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-dark-card"
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Search Bar & Theme */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search symbol..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-32 sm:w-44 text-xs py-1.5 px-3 rounded-lg bg-dark-card border border-dark-border focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-200 placeholder-slate-500 font-mono"
              />

              {matches.length > 0 && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-dark-card border border-dark-border rounded-xl shadow-2xl py-1 z-50">
                  {matches.map((c) => (
                    <button
                      key={c.symbol}
                      onClick={() => goTo(`/companies/${c.symbol}`)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-dark-bg transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-bold text-white font-mono">{c.symbol}</span>
                      <span className="text-slate-400 text-[11px] truncate max-w-[120px]">
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}