export default function SkeletonCard() {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-5 w-16 bg-slate-800 rounded"></div>
          <div className="h-3.5 w-32 bg-slate-800/60 rounded"></div>
        </div>
        <div className="h-6 w-16 bg-slate-800 rounded-full"></div>
      </div>

      <div className="pt-3 border-t border-dark-border/50 grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-slate-800/60 rounded"></div>
          <div className="h-5 w-24 bg-slate-800 rounded"></div>
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-slate-800/60 rounded"></div>
          <div className="h-4 w-28 bg-slate-800 rounded"></div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="h-3 w-28 bg-slate-800/60 rounded"></div>
        <div className="h-4 w-16 bg-slate-800 rounded"></div>
      </div>
    </div>
  );
}
