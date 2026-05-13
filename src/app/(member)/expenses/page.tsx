import type { ExpenseCategory, Prisma } from "@/generated/prisma/client";
import { Pencil, Trash2 } from "lucide-react";
import { AddButton } from "@/components/ui/add-button";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  addExpense,
  deleteExpense,
  updateExpense,
} from "@/app/(member)/actions";
import { ExpenseFilters } from "@/app/(member)/expenses/expense-filters";
import {
  canAddExpenseForMember,
  canManageMoney,
  endOfDay,
  formatDateInput,
  getCurrentOpenMonth,
  getMessMembers,
  getMessMonths,
  requireMembership,
  startOfDay,
} from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

const categories: ExpenseCategory[] = [
  "BAZAR",
  "RENT",
  "ELECTRICITY",
  "GAS",
  "INTERNET",
  "OTHER",
];

type ExpenseFilters = {
  month?: string;
  member?: string;
  category?: string;
  from?: string;
  to?: string;
};

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function prettyDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<ExpenseFilters>;
}) {
  const filters = await searchParams;
  const membership = await requireMembership();
  const openMonth = await getCurrentOpenMonth(membership.messId);
  const [months, members] = await Promise.all([
    getMessMonths(membership.messId),
    getMessMembers(membership.messId),
  ]);
  const selectedMonth =
    months.find((month) => month.id === filters.month) || openMonth;
  const canPickMember = canManageMoney(membership.role);
  const from = filters.from ? startOfDay(filters.from) : undefined;
  const to = filters.to ? endOfDay(filters.to) : undefined;
  const date: Prisma.DateTimeFilter | undefined =
    from || to
      ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
      : undefined;
  const selectedCategory = categories.includes(
    filters.category as ExpenseCategory,
  )
    ? (filters.category as ExpenseCategory)
    : undefined;
  const selectedMember = members.find((member) => member.id === filters.member);
  const activeMembers = members.filter((member) => member.status === "ACTIVE");

  const expenses = await prisma.expense.findMany({
    where: {
      messId: membership.messId,
      monthId: selectedMonth.id,
      ...(selectedMember ? { memberId: selectedMember.id } : {}),
      ...(selectedCategory ? { category: selectedCategory } : {}),
      ...(date ? { date } : {}),
    },
    include: { member: { include: { profile: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  return (
    <>
      <div className="hidden sm:block">
        <PageHeading
          eyebrow="Spend"
          title="Expenses"
          action={<AddButton>Add</AddButton>}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[0.72fr_1.28fr] xl:gap-5">
        <SectionCard className="h-fit p-3 sm:p-5 xl:sticky xl:top-24">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-700 sm:text-xs sm:tracking-[0.2em]">
                New
              </p>
              <h3 className="mt-0.5 text-lg font-black sm:mt-1 sm:text-2xl">
                Add expense
              </h3>
            </div>
            <div className="rounded-xl bg-teal-50 px-2.5 py-1.5 text-[10px] font-black text-teal-700 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xs">
              {selectedMonth.label}
            </div>
          </div>

          <form
            action={addExpense}
            className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:block sm:space-y-3"
          >
            <select
              name="category"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none transition focus:border-teal-500 sm:h-12 sm:w-full sm:rounded-2xl sm:px-4 sm:text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-teal-500 sm:h-12 sm:w-full sm:rounded-2xl sm:px-4 sm:text-sm"
              placeholder="Amount"
              required
            />
            <select
              name="member_id"
              defaultValue={membership.id}
              disabled={!canPickMember}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none transition focus:border-teal-500 disabled:opacity-70 sm:h-12 sm:w-full sm:rounded-2xl sm:px-4 sm:text-sm"
            >
              {activeMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.profile.name}
                </option>
              ))}
            </select>
            {!canPickMember ? (
              <input type="hidden" name="member_id" value={membership.id} />
            ) : null}
            <input
              name="date"
              type="date"
              defaultValue={formatDateInput()}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-teal-500 sm:h-12 sm:w-full sm:rounded-2xl sm:px-4 sm:text-sm"
            />
            <input
              name="note"
              className="col-span-2 h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-teal-500 sm:h-12 sm:w-full sm:rounded-2xl sm:px-4 sm:text-sm"
              placeholder="Note"
            />
            <SubmitButton className="col-span-2 h-10 rounded-xl bg-teal-700 px-4 text-xs font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950 sm:h-12 sm:w-full sm:rounded-2xl sm:text-sm">
              Save
            </SubmitButton>
          </form>
        </SectionCard>

        <div className="space-y-3 sm:space-y-4">
          <SectionCard className="p-3 sm:p-4 md:p-5">
            <div className="mb-2 flex items-center justify-between gap-3 sm:mb-4 sm:flex-row sm:items-end">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 sm:text-xs sm:tracking-[0.2em]">
                  List
                </p>
                <h3 className="truncate text-base font-black sm:text-xl">
                  {expenses.length} entries
                </h3>
              </div>
              <p className="shrink-0 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm">
                {formatTaka(total)}
              </p>
            </div>
            <ExpenseFilters
              months={months.map((month) => ({
                id: month.id,
                label: month.label,
              }))}
              members={members.map((member) => ({
                id: member.id,
                label: member.profile.name,
              }))}
              categories={categories}
              defaultValues={{
                month: selectedMonth.id,
                member: selectedMember?.id,
                category: selectedCategory,
                from: filters.from,
                to: filters.to,
              }}
            />
          </SectionCard>

          {expenses.length === 0 ? (
            <SectionCard className="p-6 text-center sm:p-8">
              <p className="text-3xl sm:text-4xl">🧾</p>
              <h3 className="mt-2 text-lg font-black sm:mt-3 sm:text-xl">
                No expenses
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-400 sm:text-sm">
                Try changing filters.
              </p>
            </SectionCard>
          ) : null}

          <div className="space-y-2 sm:space-y-3">
            {expenses.map((expense) => {
              const canEdit = canAddExpenseForMember(
                membership.role,
                membership.id,
                expense.memberId || "",
              );

              return (
                <SectionCard key={expense.id} className="p-3 sm:p-4 md:p-4">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-teal-700 ring-1 ring-teal-100 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.18em]">
                            {expense.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 sm:text-xs">
                            {prettyDate(expense.date)}
                          </span>
                        </div>
                        <h3 className="mt-2 truncate text-sm font-black text-slate-950 sm:mt-3 sm:text-lg">
                          {expense.note || "Shared expense"}
                        </h3>
                        <p className="mt-0.5 text-[10px] font-bold text-slate-400 sm:mt-1 sm:text-xs">
                          {expense.member?.profile.name || "Removed member"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-black text-slate-950 sm:text-lg">
                          {formatTaka(Number(expense.amount))}
                        </p>
                        {canEdit ? (
                          <p className="mt-0.5 text-[10px] font-bold text-teal-700 group-open:hidden sm:mt-1 sm:text-xs">
                            Edit
                          </p>
                        ) : null}
                      </div>
                    </summary>

                    {canEdit ? (
                      <div className="mt-3 border-t border-slate-100 pt-3 sm:mt-4 sm:pt-4">
                        <form
                          action={updateExpense}
                          className="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-5"
                        >
                          <input
                            type="hidden"
                            name="expense_id"
                            value={expense.id}
                          />
                          <select
                            name="category"
                            defaultValue={expense.category}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-teal-500 sm:h-11 sm:rounded-2xl"
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                          <input
                            name="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={Number(expense.amount)}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-teal-500 sm:h-11 sm:rounded-2xl"
                          />
                          <select
                            name="member_id"
                            defaultValue={expense.memberId || membership.id}
                            disabled={!canPickMember}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-teal-500 disabled:opacity-70 sm:h-11 sm:rounded-2xl"
                          >
                            {activeMembers.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.profile.name}
                              </option>
                            ))}
                          </select>
                          {!canPickMember ? (
                            <input
                              type="hidden"
                              name="member_id"
                              value={membership.id}
                            />
                          ) : null}
                          <input
                            name="date"
                            type="date"
                            defaultValue={dateInputValue(expense.date)}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-teal-500 sm:h-11 sm:rounded-2xl"
                          />
                          <input
                            name="note"
                            defaultValue={expense.note || ""}
                            className="col-span-2 h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-teal-500 sm:h-11 sm:rounded-2xl xl:col-span-2"
                            placeholder="Note"
                          />
                          <SubmitButton
                            pendingText="..."
                            className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-black text-white sm:h-11 sm:rounded-2xl"
                          >
                            <Pencil className="mr-1 inline h-3 w-3" />
                            Save
                          </SubmitButton>
                        </form>
                        <form
                          action={deleteExpense}
                          className="mt-2 flex justify-end"
                        >
                          <input
                            type="hidden"
                            name="expense_id"
                            value={expense.id}
                          />
                          <SubmitButton
                            pendingText="..."
                            className="rounded-xl bg-rose-50 px-3 py-2 text-[10px] font-black text-rose-700 ring-1 ring-rose-100 hover:bg-rose-100 sm:rounded-2xl sm:px-4 sm:text-xs"
                          >
                            <Trash2 className="mr-1 inline h-3 w-3" />
                            Delete
                          </SubmitButton>
                        </form>
                      </div>
                    ) : null}
                  </details>
                </SectionCard>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
