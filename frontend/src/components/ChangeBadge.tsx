import { formatPct } from "@/lib/format";

export default function ChangeBadge({
  pctChange,
  className = "",
}: {
  pctChange: number;
  className?: string;
}) {
  const positive = pctChange > 0;
  const negative = pctChange < 0;

  const colorClasses = positive
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : negative
    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
    : "bg-slate-500/10 text-slate-400 border-slate-500/20";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${colorClasses} ${className}`}
      aria-label={`Expected change: ${positive ? "increase of" : negative ? "decrease of" : "unchanged at"} ${formatPct(pctChange)}`}
    >
      <span className="font-bold leading-none">{positive ? "↑" : negative ? "↓" : "→"}</span>
      <span>{formatPct(pctChange)}</span>
    </span>
  );
}
