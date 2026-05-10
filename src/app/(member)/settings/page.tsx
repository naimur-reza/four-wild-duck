import { headers } from "next/headers";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { ensureInviteLink, regenerateInviteLink, renameMess } from "@/app/(member)/actions";
import { requireMembership } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

function getBaseUrl(host: string | null, protocol: string | null) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (!host) return "";
  return `${protocol || "https"}://${host}`;
}

export default async function SettingsPage() {
  const membership = await requireMembership();
  const [activeCount, messInvite] = await Promise.all([
    prisma.messMember.count({
      where: { messId: membership.messId, status: "ACTIVE" }
    }),
    prisma.mess.findUnique({
      where: { id: membership.messId },
      select: { inviteCode: true }
    })
  ]);
  const isOwner = membership.role === "OWNER";
  const headerList = await headers();
  const baseUrl = getBaseUrl(headerList.get("host"), headerList.get("x-forwarded-proto"));
  const inviteLink = messInvite?.inviteCode ? `${baseUrl}/join/${messInvite.inviteCode}` : "";

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
        <SectionCard className="lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Invite link</p>
          <h3 className="mt-3 text-xl font-black">Let members join by Google login</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">Share this link with your mess members. After Google login, they will join this mess automatically with zero opening balance.</p>

          {inviteLink ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm font-bold text-slate-700 break-all">
              {inviteLink}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">No invite link generated yet.</p>
          )}

          {isOwner ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {!inviteLink ? (
                <form action={ensureInviteLink}>
                  <SubmitButton className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white">Generate link</SubmitButton>
                </form>
              ) : null}
              <form action={regenerateInviteLink}>
                <SubmitButton pendingText="Resetting..." className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Reset link</SubmitButton>
              </form>
            </div>
          ) : null}
        </SectionCard>
      </div>
    </>
  );
}
