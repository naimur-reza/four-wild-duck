import { AddButton } from "@/components/ui/add-button";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { demoCashPayments, demoMembers } from "@/lib/data/demo-ledger";
import { formatTaka } from "@/lib/utils";

export default function PaymentsPage() {
  return (
    <>
      <PageHeading eyebrow="Cash" title="Payments" action={<AddButton>Add</AddButton>} />
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <SectionCard>
          <h3 className="text-xl font-black">New payment</h3>
          <div className="mt-5 space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Amount" />
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Note" />
            <button className="w-full rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950">Save</button>
          </div>
        </SectionCard>

        <div className="space-y-3">
          {demoCashPayments.map((payment) => {
            const member = demoMembers.find((item) => item.id === payment.memberId);
            return (
              <SectionCard key={payment.id} className="p-4 md:p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-black">{member?.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{payment.note} · {payment.date}</p>
                  </div>
                  <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-lg font-black text-emerald-700 ring-1 ring-emerald-100">{formatTaka(payment.amount)}</p>
                </div>
              </SectionCard>
            );
          })}
        </div>
      </div>
    </>
  );
}
