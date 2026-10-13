import { BanglaAiSummary } from "./ai-summary";
import { loadExpenseInsights } from "@/lib/data/expense-insights";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const data = await loadExpenseInsights();
  const delta = data.totalCurrent - data.totalPrevious;
  const top = data.categories.filter((row) => row.current > 0).slice(0, 5);
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">AI Insights</h1>
        <span className="text-xs font-medium text-slate-500">{data.currentMonth}</span>
      </div>
      {data.expenseCount > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">এই মাস</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{formatTaka(data.totalCurrent)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">আগের মাস</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{formatTaka(data.totalPrevious)}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-1">
              <p className="text-xs text-slate-500">পার্থক্য</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{delta > 0 ? "+" : ""}{formatTaka(delta)}</p>
            </div>
          </div>
          {top.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="space-y-3">
                {top.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-semibold text-slate-900">{formatTaka(row.current)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
      <BanglaAiSummary />
    </div>
  );
}
