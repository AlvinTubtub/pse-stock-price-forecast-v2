export default function NotFound() {
  return (
    <div className="max-w-md mx-auto my-16 text-center bg-dark-card border border-dark-border rounded-2xl p-8 sm:p-10 shadow-sm space-y-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-3xl">
        📉
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight">
        Company / Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
        The requested ticker symbol or page doesn&apos;t exist in the current PSE forecast dataset.
      </p>

      <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href="/companies"
          className="w-full sm:w-auto px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          View Company List
        </a>
        <a
          href="/"
          className="w-full sm:w-auto px-4 py-2.5 bg-dark-bg hover:bg-white/5 border border-dark-border text-slate-300 rounded-xl text-xs font-medium transition-colors"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
