export function MetricCard({ label, value, helper, tone = "default" }: { label: string; value: string; helper?: string; tone?: "default" | "dark" | "green" | "red" }) {
  const styles = {
    default: "border-slate-200 bg-white text-slate-950",
    dark: "border-slate-900 bg-slate-950 text-white",
    green: "border-emerald-200 bg-emerald-50 text-emerald-950",
    red: "border-red-200 bg-red-50 text-red-950"
  }[tone];

  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-sm ${styles}`}>
      <p className={`text-sm ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
      <p className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{value}</p>
      {helper ? <p className={`mt-2 text-xs ${tone === "dark" ? "text-slate-300" : "text-slate-500"}`}>{helper}</p> : null}
    </div>
  );
}
