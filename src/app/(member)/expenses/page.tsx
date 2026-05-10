import { AddButton } from "@/components/ui/add-button";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { demoExpenses, demoMembers } from "@/lib/data/demo-ledger";
import { formatTaka } from "@/lib/utils";

export default function ExpensesPage() {
  return (
    <>
      <PageHeading eyebrow="Spend" title="Expenses" action={<AddButton>Add</AddButton>} />
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <SectionCard>
          <h3 className="text-xl font-black">New expense</h3>
          <div className="mt-5 space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Amount" />
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Note" />
            <button className="w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950">Save</button>
          </div>
        </SectionCard>

        <div className="space-y-3">
          {demoExpenses.map((expense) => {
            const member = demoMembers.find((item) => item.id === expense.memberId);
            return (
              <SectionCard key={expense.id} className="p-4 md:p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-700">{expense.category}</p>
                    <h3 className="mt-1 font-black">{expense.note}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{member?.name} · {expense.date}</p>
                  </div>
                  <p className="text-lg font-black">{formatTaka(expense.amount)}</p>
                </div>
              </SectionCard>
            );
          })}
        </div>
      </div>
    </>
  );
}
