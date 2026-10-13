import { BanglaAiSummary } from "./ai-summary";
import { loadExpenseInsights } from "@/lib/data/expense-insights";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

function changeText(difference: number, percent: number | null) {
  if (difference === 0) return "আগের মাসের সমান";
  const label = difference > 0 ? "বেশি" : "কম";
  return `${formatTaka(Math.abs(difference))} ${label}${percent === null ? "" : ` (${Math.abs(percent)}%)`}`;
}

export default async function InsightsPage() {
  const data = await loadExpenseInsights();
  const difference = data.totalCurrent - data.totalPrevious;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">খরচের বিশ্লেষণ</h1>
        <p className="mt-1 text-sm text-slate-500">{data.currentMonth} / {data.previousMonth}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">এই মাসের খরচ</p>
          <p className="mt-2 text-2xl font-black">{formatTaka(data.totalCurrent)}</p>
          <p className="mt-1 text-xs text-slate-500">{data.expenseCount}টি এন্ট্রি</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">গত মাসের খরচ</p>
          <p className="mt-2 text-2xl font-black">{formatTaka(data.totalPrevious)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">খরচের পরিবর্তন</p>
          <p className="mt-2 text-xl font-black">{changeText(difference, data.totalPrevious > 0 ? Math.round(difference / data.totalPrevious * 100) : null)}</p>
          <p className="mt-1 text-xs text-slate-500">মোট খরচের তুলনা</p>
        </div>
      </div>
      <BanglaAiSummary />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">কোন খাতে বেশি খরচ?</h2>
          {data.categories.length === 0 ? <p className="text-sm text-slate-500">এখনো কোনো খরচ পাওয়া যায়নি।</p> : (
            <div className="space-y-3">
              {data.categories.map((row) => (
                <div key={row.label} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold">{row.label}</span>
                    <span className="text-sm font-black">{formatTaka(row.current)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${data.totalCurrent > 0 ? Math.min(100, row.current / data.totalCurrent * 100) : 0}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">গত মাস: {formatTaka(row.previous)} · {changeText(row.difference, row.percent)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">কোন জিনিসে খরচ হচ্ছে?</h2>
          {data.notes.length === 0 ? <p className="text-sm text-slate-500">নোটসহ খরচ যোগ করলে এখানে বিস্তারিত দেখা যাবে।</p> : (
            <div className="space-y-2">
              {data.notes.map((row) => (
                <div key={row.label} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold">{row.label}</p>
                    <p className="text-xs text-slate-500">গত মাস: {formatTaka(row.previous)} · {changeText(row.difference, row.percent)}</p>
                  </div>
                  <span className="text-sm font-black">{formatTaka(row.current)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <p className="rounded-xl border border-amber-300/40 bg-amber-50 p-4 text-sm leading-7 text-amber-900 dark:bg-amber-950 dark:text-amber-100">{data.caveat}</p>
    </div>
  );
}
