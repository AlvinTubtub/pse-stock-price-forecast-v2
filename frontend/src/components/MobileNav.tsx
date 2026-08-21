"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import type { FeatureFlags } from "@/lib/admin/types";

const ALL_MOBILE_LINKS = [
  { href: "/", label: "Home", icon: "🏠", featureKey: null },
  { href: "/companies", label: "Companies", icon: "🏢", featureKey: null },
  { href: "/compare-companies", label: "Compare", icon: "⚖️", featureKey: "compareCompanies" },
  { href: "/sectors", label: "Sectors", icon: "🌐", featureKey: "sectorOverview" },
  { href: "/compare", label: "Models", icon: "📊", featureKey: "modelPerformance" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [features, setFeatures] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    fetch("/forecasts/config/site_config.json")
      .then((r) => r.json())
      .then((data) => {
        if (data?.features) setFeatures(data.features);
      })
      .catch(() => {});
  }, []);

  const visibleLinks = useMemo(() => {
    return ALL_MOBILE_LINKS.filter((l) => {
      if (l.featureKey && features && features[l.featureKey as keyof FeatureFlags] === false) {
        return false;
      }
      return true;
    }).slice(0, 5);
  }, [features]);

  return (
    <nav className="fixed bottom-0 w-full glass z-50 border-t border-dark-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {visibleLinks.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <a
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 text-[11px] px-2 py-1 rounded-md transition-colors ${
                active ? "text-brand-400 font-semibold" : "text-slate-400"
              }`}
            >
              <span className="text-lg leading-none">
                {link.icon}
              </span>

              {link.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}