export function MetricCard({ label, value, helper, tone = "default" }: { label: string; value: string; helper?: string; tone?: "default" | "dark" | "green" | "red" | "blue" }) {
  const styles = {
    default: "border-white/80 bg-white/[0.88] text-slate-950 shadow-slate-200/70",
    dark: "border-slate-800 bg-[linear-gradient(135deg,#07111f_0%,#0f2d2c_58%,#0f766e_100%)] text-white shadow-teal-950/20",
    green: "border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#dffaf1_58%,#f7fee7_100%)] text-emerald-950 shadow-emerald-100/70",
    red: "border-rose-100 bg-[linear-gradient(135deg,#fff1f2_0%,#ffe4e6_54%,#fff7ed_100%)] text-rose-950 shadow-rose-100/70",
    blue: "border-cyan-100 bg-[linear-gradient(135deg,#ecfeff_0%,#e0f2fe_56%,#f0fdfa_100%)] text-cyan-950 shadow-cyan-100/70"
  }[tone];

  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] ${styles}`}>
      <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${tone === "dark" ? "text-teal-100" : "text-slate-500"}`}>{label}</p>
      <p className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{value}</p>
      {helper ? <p className={`mt-2 text-xs font-semibold ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{helper}</p> : null}
    </div>
  );
}
