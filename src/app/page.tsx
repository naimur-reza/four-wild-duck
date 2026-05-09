import Link from "next/link";
import { demoLedger } from "@/lib/data/demo-ledger";
import { formatTaka } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-8">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-10">
          <p className="text-sm font-medium text-emerald-300">Mess Khata MVP</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Shared expense, monthly split, and due history tracker.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            No meal system. Everyone spends like family, the app divides total monthly cost by active members and carries due to the next month.
          </p>
          <Link href="/reports" className="mt-8 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950">
            View monthly report
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total expense" value={formatTaka(demoLedger.totalExpense)} helper="Rent + bazar + bills" />
          <StatCard label="Active members" value={String(demoLedger.memberCount)} helper="Split equally" />
          <StatCard label="Per person share" value={formatTaka(demoLedger.monthlyShare)} helper="Auto calculated" />
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Live due preview</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-slate-500">
                <tr><th className="py-3">Member</th><th>Previous</th><th>Share</th><th>Spent</th><th>Cash</th><th>Closing</th></tr>
              </thead>
              <tbody>
                {demoLedger.summaries.map((row) => (
                  <tr key={row.member.id} className="border-t">
                    <td className="py-4 font-medium">{row.member.name}</td>
                    <td>{formatTaka(row.previousBalance)}</td>
                    <td>{formatTaka(row.monthlyShare)}</td>
                    <td>{formatTaka(row.expensePaid)}</td>
                    <td>{formatTaka(row.cashPaid)}</td>
                    <td className={row.closingBalance > 0 ? "font-semibold text-red-600" : "font-semibold text-emerald-600"}>
                      {row.closingBalance > 0 ? "Due " : "Advance "}{formatTaka(Math.abs(row.closingBalance))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
