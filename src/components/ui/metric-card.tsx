export function MetricCard({ label, value, helper, tone = "default" }: { label: string; value: string; helper?: string; tone?: "default" | "dark" | "green" | "red" | "blue" }) {
  const styles = {
    default: "border-white bg-white/80 text-slate-950 shadow-slate-200/70",
    dark: "border-slate-900 bg-gradient-to-br from-slate-950 to-slate-800 text-white shadow-slate-300/70",
    green: "border-teal-100 bg-gradient-to-br from-teal-50 to-lime-50 text-teal-950 shadow-teal-100/70",
    red: "border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50 text-rose-950 shadow-rose-100/70",
    blue: "border-indigo-100 bg-gradient-to-br from-indigo-50 to-sky-50 text-indigo-950 shadow-indigo-100/70"
  }[tone];

  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-xl ${styles}`}>
      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${tone === "dark" ? "text-slate-300" : "text-slate-400"}`}>{label}</p>
      <p className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{value}</p>
      {helper ? <p className={`mt-2 text-xs font-medium ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{helper}</p> : null}
    </div>
  );
}
