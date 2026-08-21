"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavSection {
  title?: string;
  items: {
    label: string;
    href: string;
    icon: string;
    badge?: string;
  }[];
}

const SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin", icon: "📊" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Pipeline Control", href: "/admin/pipeline", icon: "⚡" },
      { label: "Forecast Publications", href: "/admin/forecasts", icon: "📢" },
    ],
  },
  {
    title: "Data Management",
    items: [
      { label: "Tracked Companies", href: "/admin/companies", icon: "🏢" },
      { label: "PSE Trading Calendar", href: "/admin/calendar", icon: "📅" },
    ],
  },
  {
    title: "Intelligence & Models",
    items: [
      { label: "Forecasting Models", href: "/admin/models", icon: "🧠" },
      { label: "AI Assistant", href: "/admin/ai", icon: "🤖" },
    ],
  },
  {
    title: "Frontend Controls",
    items: [
      { label: "Features & Layout", href: "/admin/frontend", icon: "🎛️" },
      { label: "Navigation Ordering", href: "/admin/navigation", icon: "🧭" },
      { label: "Content & Banners", href: "/admin/content", icon: "📝" },
    ],
  },
  {
    title: "System & Governance",
    items: [
      { label: "System Health", href: "/admin/health", icon: "🩺" },
      { label: "Audit Logs", href: "/admin/audit", icon: "📜" },
    ],
  },
];

export default function AdminSidebar({
  isOpenMobile,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-dark-border flex items-center justify-between">
          <a href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-base">
              🛡️
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight block">
                Forecast<span className="text-brand-400">PH</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-brand-300 font-semibold">
                Admin Console
              </span>
            </div>
          </a>

          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 select-none">
          {SECTIONS.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {sec.title && (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  {sec.title}
                </span>
              )}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-brand-600 text-white shadow-sm ring-1 ring-brand-400"
                          : "text-slate-300 hover:text-white hover:bg-dark-bg/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-dark-bg text-slate-400 border border-dark-border">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-dark-border/70 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Capstone Admin v2.0</span>
          <span className="font-mono text-emerald-400 text-[10px]">● Online</span>
        </div>
      </aside>
    </>
  );
}
