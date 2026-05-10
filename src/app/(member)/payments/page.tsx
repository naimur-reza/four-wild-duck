import { AddButton } from "@/components/ui/add-button";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { addPayment } from "@/app/(member)/actions";
import { canManageMoney, formatDateInput, getDashboardData } from "@/lib/data/ledger";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const { membership, ledger } = await getDashboardData();
  const canAdd = canManageMoney(membership.role);

  return (
    <>
      <PageHeading eyebrow="Cash" title="Payments" action={canAdd ? <AddButton>Add</AddButton> : undefined} />
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <SectionCard>
          <h3 className="text-xl font-black">New payment</h3>
          {canAdd ? (
            <form action={addPayment} className="mt-5 space-y-3">
              <select name="member_id" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white" required>
                {ledger.members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
              </select>
              <input name="amount" type="number" step="0.01" min="0" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Amount" required />
              <input name="date" type="date" defaultValue={formatDateInput()} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" />
              <input name="note" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Note" />
              <button className="w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950">Save</button>
            </form>
          ) : (
            <p className="mt-4 text-sm font-semibold text-slate-500">Only owners and managers can add cash payments.</p>
          )}
        </SectionCard>

        <div className="space-y-3">
          {ledger.cashPayments.map((payment) => (
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
