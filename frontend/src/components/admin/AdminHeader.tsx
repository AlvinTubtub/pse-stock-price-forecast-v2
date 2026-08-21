"use client";

import React, { useState, useEffect } from "react";

interface AdminHeaderProps {
  onOpenMobileSidebar: () => void;
}

export default function AdminHeader({ onOpenMobileSidebar }: AdminHeaderProps) {
  const [username, setUsername] = useState<string>("admin");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.username) {
          setUsername(data.username);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    }
  };

  return (
    <header className="h-16 bg-dark-card/90 backdrop-blur-md border-b border-dark-border sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-bg transition-colors lg:hidden"
          aria-label="Open navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-white">Admin Control Suite</span>
          <span>&middot;</span>
          <span className="font-mono text-[11px] text-brand-300">Production Mode</span>
        </div>
      </div>

      {/* Right: User badge, Public site link, Logout */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-bg hover:bg-dark-bg/80 border border-dark-border text-xs text-slate-300 hover:text-white font-medium transition-colors"
        >
          <span>Public Site</span>
          <span className="text-[10px]">↗</span>
        </a>

        {/* User Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{username}</span>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="px-3 py-1.5 rounded-xl bg-dark-bg hover:bg-rose-500/10 hover:text-rose-400 border border-dark-border hover:border-rose-500/30 text-xs text-slate-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
          title="End administrator session"
        >
          {isLoggingOut ? "..." : "Logout"}
        </button>
      </div>
    </header>
  );
}
