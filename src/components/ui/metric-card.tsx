export function MetricCard({ label, value, helper, tone = "default" }: { label: string; value: string; helper?: string; tone?: "default" | "dark" | "green" | "red" | "blue" }) {
  const styles = {
    default: "border-white/80 bg-white/[0.88] text-slate-950 shadow-slate-200/70",
    dark: "border-slate-800 bg-[linear-gradient(135deg,#07111f_0%,#0f2d2c_58%,#0f766e_100%)] text-white shadow-teal-950/20",
    green: "border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#dffaf1_58%,#f7fee7_100%)] text-emerald-950 shadow-emerald-100/70",
    red: "border-rose-100 bg-[linear-gradient(135deg,#fff1f2_0%,#ffe4e6_54%,#fff7ed_100%)] text-rose-950 shadow-rose-100/70",
    blue: "border-cyan-100 bg-[linear-gradient(135deg,#ecfeff_0%,#e0f2fe_56%,#f0fdfa_100%)] text-cyan-950 shadow-cyan-100/70"
  }[tone];

  return (
    <div className={`rounded-[1.15rem] border p-3 shadow-[0_10px_26px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.03] sm:rounded-[1.5rem] sm:p-5 sm:shadow-[0_18px_42px_rgba(15,23,42,0.08)] ${styles}`}>
      <p className={`truncate text-[9px] font-black uppercase tracking-[0.14em] sm:text-[11px] sm:tracking-[0.18em] ${tone === "dark" ? "text-teal-100" : "text-slate-500"}`}>{label}</p>
      <p className="mt-2 truncate text-lg font-black tracking-tight sm:mt-3 sm:text-3xl">{value}</p>
      {helper ? <p className={`mt-1 truncate text-[10px] font-semibold sm:mt-2 sm:text-xs ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{helper}</p> : null}
    </div>
  );
}
