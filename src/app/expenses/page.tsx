import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/ui/page-heading";
import { demoExpenses, demoMembers } from "@/lib/data/demo-ledger";
import { formatTaka } from "@/lib/utils";

export default function ExpensesPage() {
  return (
    <AppShell>
      <PageHeading eyebrow="Spendings" title="Expenses" description="Bazar, rent, electricity, internet, gas — every shared cost goes here." />
      <div className="space-y-3">
        {demoExpenses.map((expense) => {
          const member = demoMembers.find((item) => item.id === expense.memberId);
          return (
            <article key={expense.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{expense.category}</p>
                  <h3 className="mt-1 text-lg font-black">{expense.note}</h3>
                  <p className="mt-1 text-sm text-slate-500">Paid by {member?.name} · {expense.date}</p>
                </div>
                <p className="text-lg font-black">{formatTaka(expense.amount)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
