import { AppShell } from "@/components/layout/app-shell";
import { AddButton } from "@/components/ui/add-button";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { demoMembers } from "@/lib/data/demo-ledger";
import { formatTaka } from "@/lib/utils";

export default function MembersPage() {
  return (
    <AppShell>
      <PageHeading eyebrow="People" title="Members" action={<AddButton>Add</AddButton>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {demoMembers.map((member, index) => (
          <SectionCard key={member.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-slate-700 text-lg font-black text-white">{member.name[0]}</div>
                <div>
                  <h3 className="font-black">{member.name}</h3>
                  <p className="text-xs font-semibold text-slate-400">Member #{index + 1}</p>
                </div>
              </div>
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-700">Active</span>
            </div>
            <div className="mt-5 rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Opening</p>
              <p className="mt-2 text-2xl font-black">{formatTaka(member.openingBalance)}</p>
            </div>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}
