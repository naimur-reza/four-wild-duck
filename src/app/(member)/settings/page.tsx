import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { renameMess } from "@/app/(member)/actions";
import { requireMembership } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const membership = await requireMembership();
  const activeCount = await prisma.messMember.count({
    where: { messId: membership.messId, status: "ACTIVE" }
  });
  const isOwner = membership.role === "OWNER";

  return (
    <>
      <PageHeading eyebrow="Setup" title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Mess name</p>
          <form action={renameMess} className="mt-4 flex gap-2">
            <input name="name" disabled={!isOwner} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white disabled:text-slate-400" defaultValue={membership.mess.name} />
            {isOwner ? <SubmitButton className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white">Save</SubmitButton> : null}
          </form>
        </SectionCard>
        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Your role</p>
          <p className="mt-4 text-3xl font-black">{membership.role}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">{activeCount} active members</p>
        </SectionCard>
      </div>
    </>
  );
}
