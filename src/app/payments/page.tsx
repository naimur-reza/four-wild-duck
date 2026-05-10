import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/ui/page-heading";
import { demoCashPayments, demoMembers } from "@/lib/data/demo-ledger";
import { formatTaka } from "@/lib/utils";

export default function PaymentsPage() {
  return (
    <AppShell>
      <PageHeading eyebrow="Cash in" title="Payments" description="Track money given by members. Extra payment will reduce their previous due." />
      <div className="space-y-3">
        {demoCashPayments.map((payment) => {
          const member = demoMembers.find((item) => item.id === payment.memberId);
          return (
            <article key={payment.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black">{member?.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{payment.note} · {payment.date}</p>
                </div>
                <p className="rounded-2xl bg-emerald-100 px-3 py-2 text-lg font-black text-emerald-700">{formatTaka(payment.amount)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
