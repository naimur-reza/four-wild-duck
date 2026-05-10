import { AddButton } from "@/components/ui/add-button";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { addExpense } from "@/app/(member)/actions";
import { canManageMoney, formatDateInput, getDashboardData } from "@/lib/data/ledger";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

const categories = ["RENT", "BAZAR", "ELECTRICITY", "GAS", "INTERNET", "OTHER"];

export default async function ExpensesPage() {
  const { membership, ledger } = await getDashboardData();
  const canPickMember = canManageMoney(membership.role);

  return (
    <>
      <PageHeading eyebrow="Spend" title="Expenses" action={<AddButton>Add</AddButton>} />
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <SectionCard>
          <h3 className="text-xl font-black">New expense</h3>
          <form action={addExpense} className="mt-5 space-y-3">
            <select name="category" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white">
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <input name="amount" type="number" step="0.01" min="0" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Amount" required />
            <select name="member_id" defaultValue={membership.id} disabled={!canPickMember} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white">
              {ledger.members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
            </select>
            {!canPickMember ? <input type="hidden" name="member_id" value={membership.id} /> : null}
            <input name="date" type="date" defaultValue={formatDateInput()} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" />
            <input name="note" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Note" />
            <button className="w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950">Save</button>
          </form>
        </SectionCard>

        <div className="space-y-3">
          {ledger.expenses.map((expense) => (
            <SectionCard key={expense.id} className="p-4 md:p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-700">{expense.category}</p>
                  <h3 className="mt-1 font-black">{expense.note || "Shared expense"}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{expense.member?.profile.name || "Removed member"} - {expense.date.toLocaleDateString()}</p>
                </div>
                <p className="text-lg font-black">{formatTaka(Number(expense.amount))}</p>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </>
  );
}
