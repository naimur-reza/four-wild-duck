import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { getDashboardData } from "@/lib/data/ledger";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { ledger } = await getDashboardData();

  return (
    <>
      <PageHeading eyebrow="Overview" title={ledger.month.label} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard tone="dark" label="Expense" value={formatTaka(ledger.totalExpense)} helper="Total shared" />
        <MetricCard tone="blue" label="Share" value={formatTaka(ledger.monthlyShare)} helper={`${ledger.memberCount} active`} />
        <MetricCard tone="red" label="Due" value={formatTaka(ledger.totalDue)} helper="Collectable" />
        <MetricCard tone="green" label="Advance" value={formatTaka(ledger.totalAdvance)} helper="Overpaid" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard className="border-slate-800 bg-[linear-gradient(135deg,#07111f_0%,#123434_62%,#0f766e_100%)] text-white shadow-teal-950/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">Quick action</p>
              <h3 className="mt-3 text-3xl font-black">Add today&apos;s entry</h3>
            </div>
            <ArrowUpRight className="h-6 w-6 text-teal-200" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href="/expenses" className="rounded-2xl bg-white px-4 py-4 text-center text-sm font-black text-slate-950 shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5">Expense</Link>
            <Link href="/payments" className="rounded-2xl bg-teal-300 px-4 py-4 text-center text-sm font-black text-slate-950 shadow-lg shadow-teal-950/10 transition hover:-translate-y-0.5">Payment</Link>
          </div>
        </SectionCard>

        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Formula</p>
          <h3 className="mt-3 text-2xl font-black">Share - Paid = Due</h3>
          <p className="mt-3 text-sm font-medium text-slate-500">Previous balance is included automatically.</p>
        </SectionCard>
      </div>

      <SectionCard className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black">Balances</h3>
          <Link href="/reports" className="text-sm font-black text-teal-700 transition hover:text-slate-950">Report</Link>
        </div>
        <div className="space-y-3">
          {ledger.summaries.map((row) => (
            <div key={row.member.id} className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
              <div>
                <p className="font-black">{row.member.profile.name}</p>
                <p className="text-xs font-medium text-slate-500">Paid {formatTaka(row.totalContribution)}</p>
              </div>
              <div className={`rounded-2xl px-3 py-2 text-right text-sm font-black ${row.closingBalance > 0 ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}`}>
                {row.closingBalance > 0 ? "Due" : "Advance"}<br />{formatTaka(Math.abs(row.closingBalance))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
