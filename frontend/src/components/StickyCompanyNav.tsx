"use client";

import { useEffect, useState } from "react";

interface StickyCompanyNavProps {
  symbol: string;
  name: string;
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "ohlcv", label: "History" },
  { id: "prediction", label: "Prediction" },
  { id: "backtest", label: "Backtest" },
  { id: "errors", label: "Errors" },
  { id: "models", label: "Models" },
];

export default function StickyCompanyNav({ symbol, name }: StickyCompanyNavProps) {
  const [activeId, setActiveId] = useState<string>("overview");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140; // Offset for top nav + sticky subnav
      let current = "overview";

      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            current = section.id;
          }
        }
      }
      setActiveId(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border shadow-sm mb-6 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Symbol badge */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-white text-sm tracking-tight">{symbol}</span>
          <span className="text-xs text-slate-400 truncate hidden md:inline">&mdash; {name}</span>
        </div>

        {/* Anchor Links */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5" aria-label="Company section navigation">
          {SECTIONS.map((sec) => {
            const isActive = activeId === sec.id;
            return (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-dark-card"
                }`}
              >
                {sec.label}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
