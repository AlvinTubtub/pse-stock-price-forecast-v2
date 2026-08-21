export default function Footer() {
  return (
    <footer className="mt-auto border-t border-dark-border bg-dark-card/50 text-xs text-slate-400 py-8 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight">
              Forecast<span className="text-brand-400">PH</span>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-[11px]">
              Educational Next-Day Stock Forecasting for PSE
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
            <a href="/" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="/companies" className="hover:text-white transition-colors">
              Companies
            </a>
            <a href="/compare-companies" className="hover:text-white transition-colors">
              Compare Stocks
            </a>
            <a href="/sectors" className="hover:text-white transition-colors">
              Sectors
            </a>
            <a href="/forecast-history" className="hover:text-white transition-colors">
              History
            </a>
            <a href="/compare" className="hover:text-white transition-colors">
              Models
            </a>
            <a href="/learn" className="hover:text-white transition-colors">
              Learn
            </a>
            <a href="/about" className="hover:text-white transition-colors">
              About
            </a>
            <a
              href="/admin/login"
              className="text-slate-500 hover:text-brand-400 transition-colors flex items-center gap-1 font-mono text-[11px]"
              title="Protected Admin Console"
            >
              <span>🔒</span>
              <span>Admin</span>
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-dark-border/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>
            Academic Capstone Research Project &copy; 2026 BSIT Data Analytics. All rights reserved.
          </p>
          <p>
            Historical data sourced from PSE Daily Quotation Reports. Not intended for trading or investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
