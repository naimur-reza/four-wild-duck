import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeading } from "@/components/ui/page-heading";
import { demoLedger } from "@/lib/data/demo-ledger";
import { formatTaka } from "@/lib/utils";

export default function DashboardPage() {
  const totalDue = demoLedger.summaries.filter((row) => row.closingBalance > 0).reduce((sum, row) => sum + row.closingBalance, 0);
  const totalAdvance = demoLedger.summaries.filter((row) => row.closingBalance < 0).reduce((sum, row) => sum + Math.abs(row.closingBalance), 0);

  return (
    <AppShell>
      <PageHeading
        eyebrow="Current month"
        title="May er hisab ek jaygay."
        description="Everyone spends freely. Mess Khata splits the full monthly cost, tracks contribution, and carries due forward. No Excel chaos."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard tone="dark" label="Total expense" value={formatTaka(demoLedger.totalExpense)} helper="Rent + bazar + bills" />
        <MetricCard label="Per person share" value={formatTaka(demoLedger.monthlyShare)} helper={`${demoLedger.memberCount} active members`} />
        <MetricCard tone="red" label="Total due" value={formatTaka(totalDue)} helper="Need to collect" />
        <MetricCard tone="green" label="Total advance" value={formatTaka(totalAdvance)} helper="Already overpaid" />
      </div>

      <section className="mt-6 rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-200 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Quick actions</p>
            <h3 className="mt-2 text-2xl font-black">Add today’s update</h3>
            <p className="mt-2 text-sm text-slate-300">Start with members, then add expenses and payments.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Link href="/expenses" className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-slate-950">Add expense</Link>
            <Link href="/payments" className="rounded-2xl bg-emerald-400 px-4 py-3 text-center text-sm font-bold text-slate-950">Add payment</Link>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black">Member balance</h3>
            <p className="text-sm text-slate-500">Positive means due, negative means advance.</p>
          </div>
          <Link href="/reports" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">Full report</Link>
        </div>

        <div className="mt-5 space-y-3">
          {demoLedger.summaries.map((row) => (
            <div key={row.member.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{row.member.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Paid: {formatTaka(row.totalContribution)} · Share: {formatTaka(row.monthlyShare)}</p>
                </div>
                <div className={`rounded-2xl px-3 py-2 text-right text-sm font-black ${row.closingBalance > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {row.closingBalance > 0 ? "Due" : "Advance"}<br />{formatTaka(Math.abs(row.closingBalance))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
