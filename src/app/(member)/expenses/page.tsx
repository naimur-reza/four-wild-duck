import type { ExpenseCategory, Prisma } from "@/generated/prisma/client";
import { AddButton } from "@/components/ui/add-button";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { addExpense } from "@/app/(member)/actions";
import { canManageMoney, endOfDay, formatDateInput, getCurrentOpenMonth, getMessMembers, getMessMonths, requireMembership, startOfDay } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

const categories: ExpenseCategory[] = ["RENT", "BAZAR", "ELECTRICITY", "GAS", "INTERNET", "OTHER"];

type ExpenseFilters = {
  month?: string;
  member?: string;
  category?: string;
  from?: string;
  to?: string;
};

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<ExpenseFilters> }) {
  const filters = await searchParams;
  const membership = await requireMembership();
  const openMonth = await getCurrentOpenMonth(membership.messId);
  const [months, members] = await Promise.all([getMessMonths(membership.messId), getMessMembers(membership.messId)]);
  const selectedMonth = months.find((month) => month.id === filters.month) || openMonth;
  const canPickMember = canManageMoney(membership.role);
  const from = filters.from ? startOfDay(filters.from) : undefined;
  const to = filters.to ? endOfDay(filters.to) : undefined;
  const date: Prisma.DateTimeFilter | undefined = from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;
  const selectedCategory = categories.includes(filters.category as ExpenseCategory) ? (filters.category as ExpenseCategory) : undefined;
  const selectedMember = members.find((member) => member.id === filters.member);

  const expenses = await prisma.expense.findMany({
    where: {
      messId: membership.messId,
      monthId: selectedMonth.id,
      ...(selectedMember ? { memberId: selectedMember.id } : {}),
      ...(selectedCategory ? { category: selectedCategory } : {}),
      ...(date ? { date } : {})
    },
    include: { member: { include: { profile: true } } },
    orderBy: { date: "desc" }
  });

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
              {members.filter((member) => member.status === "ACTIVE").map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
            </select>
            {!canPickMember ? <input type="hidden" name="member_id" value={membership.id} /> : null}
            <input name="date" type="date" defaultValue={formatDateInput()} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" />
            <input name="note" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Note" />
            <SubmitButton className="w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950">Save</SubmitButton>
          </form>
        </SectionCard>

        <div className="space-y-3">
          <SectionCard className="p-4 md:p-4">
            <form className="grid gap-3 md:grid-cols-5">
              <select name="month" defaultValue={selectedMonth.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-black outline-none">
                {months.map((month) => <option key={month.id} value={month.id}>{month.label}</option>)}
              </select>
              <select name="member" defaultValue={selectedMember?.id || ""} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-black outline-none">
                <option value="">All members</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
              </select>
              <select name="category" defaultValue={selectedCategory || ""} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-black outline-none">
                <option value="">All types</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <input name="from" type="date" defaultValue={filters.from || ""} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-black outline-none" />
              <SubmitButton pendingText="Filtering..." className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Filter</SubmitButton>
              <input name="to" type="date" defaultValue={filters.to || ""} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-black outline-none md:col-span-2" />
            </form>
          </SectionCard>

          {expenses.map((expense) => (
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
