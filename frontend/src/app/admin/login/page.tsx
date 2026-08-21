"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please check your credentials.");
      }

      // Hard redirect to load session cookies fresh
      window.location.href = from;
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-7 sm:p-9 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-2xl shadow-inner">
          🛡️
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Forecast<span className="text-brand-400">PH</span> Admin
        </h1>
        <p className="text-xs text-slate-400">
          Protected administrative console for capstone operations.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="admin-username" className="text-xs font-semibold text-slate-300">
            Admin Username
          </label>
          <input
            id="admin-username"
            type="text"
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. admin1, admin2..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-password" className="text-xs font-semibold text-slate-300">
            Admin Password
          </label>
          <input
            id="admin-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In to Console</span>
          )}
        </button>
      </form>

      {/* Footer Security Notice */}
      <div className="pt-4 border-t border-dark-border/60 text-center space-y-2 text-[11px] text-slate-500">
        <p>Authorized access only &bull; Sessions are cryptographically signed.</p>
        <a
          href="/"
          className="text-xs text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Public Dashboard
        </a>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 select-none">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading console...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
