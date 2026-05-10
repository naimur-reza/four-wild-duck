import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/ui/page-heading";
import { demoMembers } from "@/lib/data/demo-ledger";
import { formatTaka } from "@/lib/utils";

export default function MembersPage() {
  return (
    <AppShell>
      <PageHeading eyebrow="People" title="Members" description="Manage who is active in the current month. Inactive members should not be included in monthly split." />
      <div className="grid gap-4 sm:grid-cols-2">
        {demoMembers.map((member) => (
          <article key={member.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">{member.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{member.phone ?? "No phone added"}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{member.status}</span>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Opening balance</p>
              <p className="mt-1 text-2xl font-black">{formatTaka(member.openingBalance)}</p>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
