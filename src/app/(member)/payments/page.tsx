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

  return (
    <>
      <PageHeading eyebrow="Cash" title="Payments" action={canAdd ? <AddButton>Add</AddButton> : undefined} />
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <SectionCard>
          <h3 className="text-xl font-black">New payment</h3>
          {canAdd ? (
            <form action={addPayment} className="mt-5 space-y-3">
              <select name="member_id" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white" required>
                {members.filter((member) => member.status === "ACTIVE").map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
              </select>
              <input name="amount" type="number" step="0.01" min="0" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Amount" required />
              <input name="date" type="date" defaultValue={formatDateInput()} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" />
              <input name="note" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Note" />
              <SubmitButton className="w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950">Save</SubmitButton>
            </form>
          ) : (
            <p className="mt-4 text-sm font-semibold text-slate-500">Only owners and managers can add cash payments.</p>
          )}
        </SectionCard>

        <div className="space-y-3">
          <SectionCard className="p-4 md:p-4">
            <form className="grid gap-3 md:grid-cols-4">
              <select name="month" defaultValue={selectedMonth.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-black outline-none">
                {months.map((month) => <option key={month.id} value={month.id}>{month.label}</option>)}
              </select>
              <select name="member" defaultValue={selectedMember?.id || ""} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-black outline-none">
                <option value="">All members</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
              </select>
              <input name="from" type="date" defaultValue={filters.from || ""} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-black outline-none" />
              <input name="to" type="date" defaultValue={filters.to || ""} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-black outline-none" />
              <SubmitButton pendingText="Filtering..." className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white md:col-span-4">Filter</SubmitButton>
            </form>
          </SectionCard>

          {payments.map((payment) => (
            <SectionCard key={payment.id} className="p-4 md:p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-black">{payment.member.profile.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{payment.note || "Cash payment"} - {payment.date.toLocaleDateString()}</p>
                </div>
                <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-lg font-black text-emerald-700 ring-1 ring-emerald-100">{formatTaka(Number(payment.amount))}</p>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </>
  );
}
