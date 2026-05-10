import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { demoLedger } from "@/lib/data/demo-ledger";
import { formatTaka } from "@/lib/utils";

export default function DashboardPage() {
  const totalDue = demoLedger.summaries.filter((row) => row.closingBalance > 0).reduce((sum, row) => sum + row.closingBalance, 0);
  const totalAdvance = demoLedger.summaries.filter((row) => row.closingBalance < 0).reduce((sum, row) => sum + Math.abs(row.closingBalance), 0);

  return (
    <AppShell>
      <PageHeading eyebrow="Overview" title="This month" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard tone="dark" label="Expense" value={formatTaka(demoLedger.totalExpense)} helper="Total shared" />
        <MetricCard tone="blue" label="Share" value={formatTaka(demoLedger.monthlyShare)} helper={`${demoLedger.memberCount} members`} />
        <MetricCard tone="red" label="Due" value={formatTaka(totalDue)} helper="Collectable" />
        <MetricCard tone="green" label="Advance" value={formatTaka(totalAdvance)} helper="Overpaid" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard className="bg-gradient-to-br from-slate-950 to-slate-800 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-300">Quick action</p>
              <h3 className="mt-3 text-3xl font-black">Add today’s entry</h3>
            </div>
            <ArrowUpRight className="h-6 w-6 text-teal-300" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href="/expenses" className="rounded-2xl bg-white px-4 py-4 text-center text-sm font-black text-slate-950">Expense</Link>
            <Link href="/payments" className="rounded-2xl bg-teal-300 px-4 py-4 text-center text-sm font-black text-slate-950">Payment</Link>
          </div>
        </SectionCard>

        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Formula</p>
          <h3 className="mt-3 text-2xl font-black">Share - Paid = Due</h3>
          <p className="mt-3 text-sm font-medium text-slate-500">Previous balance is included automatically.</p>
        </SectionCard>
      </div>

      <SectionCard className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black">Balances</h3>
          <Link href="/reports" className="text-sm font-black text-teal-700">Report</Link>
        </div>
        <div className="space-y-3">
          {demoLedger.summaries.map((row) => (
            <div key={row.member.id} className="flex items-center justify-between gap-3 rounded-3xl bg-slate-50 p-4">
              <div>
                <p className="font-black">{row.member.name}</p>
                <p className="text-xs font-medium text-slate-500">Paid {formatTaka(row.totalContribution)}</p>
              </div>
              <div className={`rounded-2xl px-3 py-2 text-right text-sm font-black ${row.closingBalance > 0 ? "bg-rose-100 text-rose-700" : "bg-teal-100 text-teal-700"}`}>
                {row.closingBalance > 0 ? "Due" : "Advance"}<br />{formatTaka(Math.abs(row.closingBalance))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
