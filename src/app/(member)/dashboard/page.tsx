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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard tone="dark" label="Expense" value={formatTaka(ledger.totalExpense)} helper="Shared" />
        <MetricCard tone="blue" label="Share" value={formatTaka(ledger.monthlyShare)} helper={`${ledger.memberCount} active`} />
        <MetricCard tone="red" label="Due" value={formatTaka(ledger.totalDue)} helper="Collect" />
        <MetricCard tone="green" label="Advance" value={formatTaka(ledger.totalAdvance)} helper="Overpaid" />
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard className="border-slate-800 bg-[linear-gradient(135deg,#07111f_0%,#123434_62%,#0f766e_100%)] text-white shadow-teal-950/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-200 sm:text-xs sm:tracking-[0.22em]">Quick action</p>
              <h3 className="mt-2 text-2xl font-black sm:mt-3 sm:text-3xl">Add entry</h3>
            </div>
            <ArrowUpRight className="h-5 w-5 text-teal-200 sm:h-6 sm:w-6" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
            <Link href="/expenses" className="rounded-2xl bg-white px-4 py-3 text-center text-xs font-black text-slate-950 shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 sm:py-4 sm:text-sm">Expense</Link>
            <Link href="/payments" className="rounded-2xl bg-teal-300 px-4 py-3 text-center text-xs font-black text-slate-950 shadow-lg shadow-teal-950/10 transition hover:-translate-y-0.5 sm:py-4 sm:text-sm">Payment</Link>
          </div>
        </SectionCard>

        <SectionCard className="hidden sm:block">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-700 sm:text-xs sm:tracking-[0.2em]">Formula</p>
          <h3 className="mt-2 text-xl font-black sm:mt-3 sm:text-2xl">Share - Paid = Due</h3>
          <p className="mt-2 text-xs font-medium text-slate-500 sm:mt-3 sm:text-sm">Previous balance is included automatically.</p>
        </SectionCard>
      </div>

      <SectionCard className="mt-4 sm:mt-6">
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h3 className="text-lg font-black sm:text-xl">Balances</h3>
          <Link href="/reports" className="text-xs font-black text-teal-700 transition hover:text-slate-950 sm:text-sm">Report</Link>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {ledger.summaries.map((row) => (
            <div key={row.member.id} className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-100 bg-slate-50/80 p-3 shadow-sm sm:rounded-[1.35rem] sm:p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-black sm:text-base">{row.member.profile.name}</p>
                <p className="text-[11px] font-medium text-slate-500 sm:text-xs">Paid {formatTaka(row.totalContribution)}</p>
              </div>
              <div className={`shrink-0 rounded-xl px-2.5 py-1.5 text-right text-xs font-black sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm ${row.closingBalance > 0 ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}`}>
                {row.closingBalance > 0 ? "Due" : "Advance"}<br />{formatTaka(Math.abs(row.closingBalance))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
