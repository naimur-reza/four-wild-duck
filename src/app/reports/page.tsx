import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/ui/page-heading";
import { demoLedger } from "@/lib/data/demo-ledger";
import { formatTaka } from "@/lib/utils";

export default function ReportsPage() {
  return (
    <AppShell>
      <PageHeading eyebrow="Final calculation" title="Monthly report" description="This is the core monthly sheet. Later this page will be frozen when manager closes the month." />
      <div className="space-y-4 md:hidden">
        {demoLedger.summaries.map((row) => (
          <article key={row.member.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-black">{row.member.name}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.closingBalance > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{row.closingBalance > 0 ? "Due" : "Advance"}</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-slate-500">Previous</dt><dd className="font-black">{formatTaka(row.previousBalance)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-slate-500">Share</dt><dd className="font-black">{formatTaka(row.monthlyShare)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-slate-500">Spent</dt><dd className="font-black">{formatTaka(row.expensePaid)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-slate-500">Cash</dt><dd className="font-black">{formatTaka(row.cashPaid)}</dd></div>
            </dl>
            <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-xs text-slate-300">Closing balance</p>
              <p className="mt-1 text-2xl font-black">{formatTaka(Math.abs(row.closingBalance))}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="p-4">Member</th><th>Previous</th><th>Share</th><th>Spent</th><th>Cash</th><th>Closing</th></tr>
          </thead>
          <tbody>
            {demoLedger.summaries.map((row) => (
              <tr key={row.member.id} className="border-t border-slate-100">
                <td className="p-4 font-bold">{row.member.name}</td>
                <td>{formatTaka(row.previousBalance)}</td>
                <td>{formatTaka(row.monthlyShare)}</td>
                <td>{formatTaka(row.expensePaid)}</td>
                <td>{formatTaka(row.cashPaid)}</td>
                <td className={row.closingBalance > 0 ? "font-black text-red-600" : "font-black text-emerald-600"}>{row.closingBalance > 0 ? "Due " : "Advance "}{formatTaka(Math.abs(row.closingBalance))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
