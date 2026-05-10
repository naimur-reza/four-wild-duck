import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { demoLedger } from "@/lib/data/demo-ledger";
import { formatTaka } from "@/lib/utils";

export default function ReportsPage() {
  return (
    <AppShell>
      <PageHeading eyebrow="Sheet" title="Report" action={<button className="rounded-2xl bg-teal-500 px-4 py-3 text-sm font-black text-white shadow-xl shadow-teal-100">Close month</button>} />

      <div className="space-y-4 md:hidden">
        {demoLedger.summaries.map((row) => (
          <SectionCard key={row.member.id}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-black">{row.member.name}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${row.closingBalance > 0 ? "bg-rose-100 text-rose-700" : "bg-teal-100 text-teal-700"}`}>{row.closingBalance > 0 ? "Due" : "Advance"}</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs font-bold text-slate-400">Previous</dt><dd className="font-black">{formatTaka(row.previousBalance)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs font-bold text-slate-400">Share</dt><dd className="font-black">{formatTaka(row.monthlyShare)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs font-bold text-slate-400">Spent</dt><dd className="font-black">{formatTaka(row.expensePaid)}</dd></div>
              <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs font-bold text-slate-400">Cash</dt><dd className="font-black">{formatTaka(row.cashPaid)}</dd></div>
            </dl>
            <div className="mt-4 rounded-3xl bg-slate-950 p-4 text-white">
              <p className="text-xs font-bold text-slate-400">Closing</p>
              <p className="mt-1 text-2xl font-black">{formatTaka(Math.abs(row.closingBalance))}</p>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard className="hidden overflow-hidden p-0 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-white">
            <tr><th className="p-4">Member</th><th>Previous</th><th>Share</th><th>Spent</th><th>Cash</th><th>Closing</th></tr>
          </thead>
          <tbody>
            {demoLedger.summaries.map((row) => (
              <tr key={row.member.id} className="border-t border-slate-100">
                <td className="p-4 font-black">{row.member.name}</td>
                <td>{formatTaka(row.previousBalance)}</td>
                <td>{formatTaka(row.monthlyShare)}</td>
                <td>{formatTaka(row.expensePaid)}</td>
                <td>{formatTaka(row.cashPaid)}</td>
                <td className={row.closingBalance > 0 ? "font-black text-rose-600" : "font-black text-teal-600"}>{row.closingBalance > 0 ? "Due " : "Advance "}{formatTaka(Math.abs(row.closingBalance))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </AppShell>
  );
}
