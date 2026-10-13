import { BanglaAiSummary } from "./ai-summary";
import { loadExpenseInsights } from "@/lib/data/expense-insights";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const data = await loadExpenseInsights();
  const delta = data.totalCurrent - data.totalPrevious;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">AI Insights</h1>
        <span className="text-xs text-slate-500">{data.currentMonth} · {data.previousMonth}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { title: "এই মাস", amount: data.totalCurrent },
          { title: "আগের মাস", amount: data.totalPrevious },
          { title: "পার্থক্য", amount: delta },
        ].map((item) => (
          <div key={item.title} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs text-slate-500">{item.title}</p>
            <p className="mt-1 break-words text-sm font-bold sm:text-xl">{formatTaka(item.amount)}</p>
          </div>
        ))}
      </div>
      <BanglaAiSummary />
      {data.categories.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-3 text-sm font-bold">খরচের হিসাব</h2>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.categories.slice(0, 6).map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{row.label}</span>
                <span className="font-semibold">{formatTaka(row.current)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
