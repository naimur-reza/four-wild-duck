import type { Prisma } from "@/generated/prisma/client";
import { AddButton } from "@/components/ui/add-button";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { addPayment } from "@/app/(member)/actions";
import { canManageMoney, endOfDay, formatDateInput, getCurrentOpenMonth, getMessMembers, getMessMonths, requireMembership, startOfDay } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PaymentFilters = {
  month?: string;
  member?: string;
  from?: string;
  to?: string;
};

function prettyDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<PaymentFilters> }) {
  const filters = await searchParams;
  const membership = await requireMembership();
  const openMonth = await getCurrentOpenMonth(membership.messId);
  const [months, members] = await Promise.all([getMessMonths(membership.messId), getMessMembers(membership.messId)]);
  const selectedMonth = months.find((month) => month.id === filters.month) || openMonth;
  const selectedMember = members.find((member) => member.id === filters.member);
  const from = filters.from ? startOfDay(filters.from) : undefined;
  const to = filters.to ? endOfDay(filters.to) : undefined;
  const date: Prisma.DateTimeFilter | undefined = from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;
  const canAdd = canManageMoney(membership.role);
  const activeMembers = members.filter((member) => member.status === "ACTIVE");

  const payments = await prisma.cashPayment.findMany({
    where: {
      messId: membership.messId,
      monthId: selectedMonth.id,
      ...(selectedMember ? { memberId: selectedMember.id } : {}),
      ...(date ? { date } : {})
    },
    include: { member: { include: { profile: true } } },
    orderBy: { date: "desc" }
  });

  const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <>
      <div className="hidden sm:block">
        <PageHeading eyebrow="Cash" title="Payments" action={canAdd ? <AddButton>Add</AddButton> : undefined} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.78fr_1.22fr] lg:gap-4">
        <SectionCard className="p-3 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-700 sm:text-xs sm:tracking-[0.2em]">Cash</p>
              <h3 className="mt-0.5 text-lg font-black sm:text-xl">New payment</h3>
            </div>
            <span className="rounded-xl bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100 sm:hidden">{selectedMonth.label}</span>
          </div>
          {canAdd ? (
            <form action={addPayment} className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:block sm:space-y-3">
              <select name="member_id" className="col-span-2 h-10 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-semibold outline-none transition focus:border-teal-500 focus:bg-white sm:h-auto sm:w-full sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" required>
                {activeMembers.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
              </select>
              <input name="amount" type="number" step="0.01" min="0" className="h-10 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs outline-none transition focus:border-teal-500 focus:bg-white sm:h-auto sm:w-full sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" placeholder="Amount" required />
              <input name="date" type="date" defaultValue={formatDateInput()} className="h-10 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs outline-none transition focus:border-teal-500 focus:bg-white sm:h-auto sm:w-full sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" />
              <input name="note" className="col-span-2 h-10 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs outline-none transition focus:border-teal-500 focus:bg-white sm:h-auto sm:w-full sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" placeholder="Note" />
              <SubmitButton className="col-span-2 h-10 rounded-xl bg-teal-700 px-4 text-xs font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950 sm:h-auto sm:w-full sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">Save</SubmitButton>
            </form>
          ) : (
            <p className="mt-3 text-xs font-semibold text-slate-500 sm:mt-4 sm:text-sm">Only owners and managers can add cash payments.</p>
          )}
        </SectionCard>

        <div className="space-y-3">
          <SectionCard className="p-3 sm:p-4 md:p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 sm:text-xs sm:tracking-[0.2em]">List</p>
                <h3 className="text-base font-black sm:text-xl">{payments.length} entries</h3>
              </div>
              <p className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm">{formatTaka(total)}</p>
            </div>

            <details className="rounded-2xl border border-slate-100 bg-slate-50/70 p-2 sm:border-0 sm:bg-transparent sm:p-0">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-2 py-1.5 text-xs font-black text-slate-700 sm:hidden">
                <span>Filters</span>
                <span className="text-[10px] text-slate-400">Tap</span>
              </summary>
              <form className="mt-2 grid gap-2 sm:mt-0 md:grid-cols-4">
                <select name="month" defaultValue={selectedMonth.id} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none sm:rounded-2xl">
                  {months.map((month) => <option key={month.id} value={month.id}>{month.label}</option>)}
                </select>
                <select name="member" defaultValue={selectedMember?.id || ""} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none sm:rounded-2xl">
                  <option value="">All members</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
                </select>
                <input name="from" type="date" defaultValue={filters.from || ""} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none sm:rounded-2xl" />
                <input name="to" type="date" defaultValue={filters.to || ""} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none sm:rounded-2xl" />
                <SubmitButton pendingText="..." className="h-10 rounded-xl bg-slate-950 px-4 text-xs font-black text-white md:col-span-4 sm:rounded-2xl">Filter</SubmitButton>
              </form>
            </details>
          </SectionCard>

          {payments.map((payment) => (
            <SectionCard key={payment.id} className="p-3 sm:p-4 md:p-4">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black sm:text-base">{payment.member.profile.name}</h3>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400 sm:mt-1 sm:text-xs">{payment.note || "Cash payment"} • {prettyDate(payment.date)}</p>
                </div>
                <p className="shrink-0 rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700 ring-1 ring-emerald-100 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-lg">{formatTaka(Number(payment.amount))}</p>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </>
  );
}
