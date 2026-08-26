export default function StatCard({
  label,
  value,
  sublabel,
  accent = "text-white",
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: string;
}) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 mb-2">{label}</p>
      <p className={`text-3xl font-extrabold mb-1 ${accent}`}>{value}</p>
      {sublabel && <p className="text-xs font-medium text-slate-500 dark:text-slate-300">{sublabel}</p>}
    </div>
  );
}
