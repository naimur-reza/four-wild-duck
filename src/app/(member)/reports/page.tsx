import { CloseMonthPreview } from "@/components/reports/close-month-preview";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { canManageMoney, getDashboardData } from "@/lib/data/ledger";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { membership, ledger } = await getDashboardData();
  const canClose = canManageMoney(membership.role);

  return (
    <>
      <PageHeading
        eyebrow="Sheet"
        title="Report"
        action={canClose ? (
          <CloseMonthPreview
            monthLabel={ledger.month.label}
            totalExpense={ledger.totalExpense}
            monthlyShare={ledger.monthlyShare}
            memberCount={ledger.memberCount}
            totalDue={ledger.totalDue}
            totalAdvance={ledger.totalAdvance}
            rows={ledger.summaries.map((row) => ({
              id: row.member.id,
              name: row.member.profile.name,
              previousBalance: row.previousBalance,
              monthlyShare: row.monthlyShare,
              expensePaid: row.expensePaid,
              cashPaid: row.cashPaid,
              totalContribution: row.totalContribution,
              closingBalance: row.closingBalance
            }))}
          />
        ) : undefined}
      />

      <div className="space-y-4 md:hidden">
        {ledger.summaries.map((row) => (
          <SectionCard key={row.member.id}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-black">{row.member.profile.name}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${row.closingBalance > 0 ? "bg-rose-50 text-rose-700 ring-rose-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100"}`}>{row.closingBalance > 0 ? "Due" : "Advance"}</span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3"><dt className="text-xs font-bold text-slate-400">Previous</dt><dd className="font-black">{formatTaka(row.previousBalance)}</dd></div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3"><dt className="text-xs font-bold text-slate-400">Share</dt><dd className="font-black">{formatTaka(row.monthlyShare)}</dd></div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3"><dt className="text-xs font-bold text-slate-400">Spent</dt><dd className="font-black">{formatTaka(row.expensePaid)}</dd></div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3"><dt className="text-xs font-bold text-slate-400">Cash</dt><dd className="font-black">{formatTaka(row.cashPaid)}</dd></div>
            </dl>
            <div className="mt-4 rounded-[1.35rem] bg-[linear-gradient(135deg,#07111f_0%,#123434_100%)] p-4 text-white shadow-lg shadow-slate-950/10">
              <p className="text-xs font-bold text-teal-200">Closing</p>
              <p className="mt-1 text-2xl font-black">{formatTaka(Math.abs(row.closingBalance))}</p>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard className="hidden overflow-hidden p-0 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[linear-gradient(135deg,#07111f_0%,#123434_100%)] text-white">
            <tr><th className="p-4">Member</th><th>Previous</th><th>Share</th><th>Spent</th><th>Cash</th><th>Contribution</th><th>Closing</th></tr>
          </thead>
          <tbody>
            {ledger.summaries.map((row) => (
              <tr key={row.member.id} className="border-t border-slate-100">
                <td className="p-4 font-black">{row.member.profile.name}</td>
                <td>{formatTaka(row.previousBalance)}</td>
                <td>{formatTaka(row.monthlyShare)}</td>
                <td>{formatTaka(row.expensePaid)}</td>
                <td>{formatTaka(row.cashPaid)}</td>
                <td>{formatTaka(row.totalContribution)}</td>
                <td className={row.closingBalance > 0 ? "font-black text-rose-700" : "font-black text-emerald-700"}>{row.closingBalance > 0 ? "Due " : "Advance "}{formatTaka(Math.abs(row.closingBalance))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </>
  );
}
