import { headers } from "next/headers";
import {
  ensureInviteLink,
  leaveMess,
  regenerateInviteLink,
  renameMess,
  transferOwnership,
  updateOpeningBalance,
  updateProfileName,
} from "@/app/(member)/actions";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireMembership, toNumber } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

const leaveMessages: Record<
  string,
  { tone: "warning" | "error"; text: string }
> = {
  "owner-needs-transfer": {
    tone: "warning",
    text: "You are the only owner. Transfer ownership to another active member first, or leave only when you are the only member.",
  },
};

const profileMessages: Record<
  string,
  { tone: "warning" | "success"; text: string }
> = {
  "name-too-short": {
    tone: "warning",
    text: "Name must be at least 2 characters.",
  },
  "name-too-long": {
    tone: "warning",
    text: "Name must be 60 characters or less.",
  },
};

const ownershipMessages: Record<string, { tone: "warning" | "success"; text: string }> = {
  transferred: {
    tone: "success",
    text: "Ownership transferred successfully. You are now a manager.",
  },
  "owner-only": {
    tone: "warning",
    text: "Only the current owner can transfer ownership.",
  },
  "invalid-target": {
    tone: "warning",
    text: "Select another active member to transfer ownership.",
  },
};

function getBaseUrl(host: string | null, protocol: string | null) {
  if (process.env.NEXT_PUBLIC_APP_URL)
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (!host) return "";
  return `${protocol || "https"}://${host}`;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ leaveStatus?: string; profileStatus?: string; ownershipStatus?: string }>;
}) {
  const params = await searchParams;
  const message = params?.leaveStatus
    ? leaveMessages[params.leaveStatus]
    : undefined;
  const profileMessage = params?.profileStatus
    ? profileMessages[params.profileStatus]
    : undefined;
  const ownershipMessage = params?.ownershipStatus
    ? ownershipMessages[params.ownershipStatus]
    : undefined;
  const membership = await requireMembership();
  const [activeCount, messInvite, members] = await Promise.all([
    prisma.messMember.count({
      where: { messId: membership.messId, status: "ACTIVE" },
    }),
    prisma.mess.findUnique({
      where: { id: membership.messId },
      select: { inviteCode: true },
    }),
    prisma.messMember.findMany({
      where: { messId: membership.messId, status: "ACTIVE" },
      include: { profile: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const isOwner = membership.role === "OWNER";
  const canEditBalances =
    membership.role === "OWNER" || membership.role === "MANAGER";
  const transferTargets = members.filter((member) => member.id !== membership.id);
  const headerList = await headers();
  const baseUrl = getBaseUrl(
    headerList.get("host"),
    headerList.get("x-forwarded-proto"),
  );
  const inviteLink = messInvite?.inviteCode
    ? `${baseUrl}/join/${messInvite.inviteCode}`
    : "";

  return (
    <>
      <PageHeading eyebrow="Setup" title="Settings" />

      {message ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
          {message.text}
        </div>
      ) : null}

      {profileMessage ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
          {profileMessage.text}
        </div>
      ) : null}

      {ownershipMessage ? (
        <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-bold ${ownershipMessage.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {ownershipMessage.text}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Your profile
          </p>
          <h3 className="mt-3 text-xl font-black">Update your display name</h3>

          <form action={updateProfileName} className="mt-4 flex gap-2">
            <input
              name="name"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white"
              defaultValue={membership.profile.name}
              minLength={2}
              maxLength={60}
              required
            />
            <SubmitButton className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white">
              Save
            </SubmitButton>
          </form>
        </SectionCard>

        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Mess name
          </p>
          <form action={renameMess} className="mt-4 flex gap-2">
            <input
              name="name"
              disabled={!isOwner}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white disabled:text-slate-400"
              defaultValue={membership.mess.name}
            />
            {isOwner ? (
              <SubmitButton className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white">
                Save
              </SubmitButton>
            ) : null}
          </form>
        </SectionCard>
        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Your role
          </p>
          <p className="mt-4 text-3xl font-black">{membership.role}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {activeCount} active members
          </p>
        </SectionCard>

        {isOwner ? (
          <SectionCard>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Ownership
            </p>
            <h3 className="mt-3 text-xl font-black">Transfer ownership</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Choose another active member as the new owner. You will become manager after transfer.
            </p>
            {transferTargets.length ? (
              <form action={transferOwnership} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                <select name="target_member_id" required className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white">
                  <option value="">Select new owner</option>
                  {transferTargets.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.profile.name} • {member.role}
                    </option>
                  ))}
                </select>
                <SubmitButton pendingText="Transferring..." className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-teal-700">
                  Transfer
                </SubmitButton>
              </form>
            ) : (
              <p className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-sm font-bold text-slate-500">
                Add another member before transferring ownership.
              </p>
            )}
          </SectionCard>
        ) : null}

        {canEditBalances ? (
          <SectionCard className="lg:col-span-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Opening balances
            </p>
            <h3 className="mt-3 text-xl font-black">
              Set previous due or advance
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Use positive amount for due, negative amount for advance. Example:
              due 1500 = 1500, advance 500 = -500.
            </p>
            <div className="mt-4 space-y-3">
              {members.map((member) => {
                const openingBalance = toNumber(member.openingBalance);
                return (
                  <form
                    key={member.id}
                    action={updateOpeningBalance}
                    className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-[1fr_180px_auto] sm:items-center"
                  >
                    <input type="hidden" name="member_id" value={member.id} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {member.profile.name}
                      </p>
                      <p
                        className={`text-xs font-bold ${openingBalance > 0 ? "text-rose-600" : openingBalance < 0 ? "text-emerald-600" : "text-slate-400"}`}
                      >
                        {openingBalance > 0
                          ? "Due"
                          : openingBalance < 0
                            ? "Advance"
                            : "No previous balance"}{" "}
                        {openingBalance !== 0
                          ? formatTaka(Math.abs(openingBalance))
                          : ""}
                      </p>
                    </div>
                    <input
                      name="opening_balance"
                      type="number"
                      step="0.01"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500"
                      defaultValue={openingBalance}
                    />
                    <SubmitButton
                      pendingText="Saving..."
                      className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                    >
                      Save
                    </SubmitButton>
                  </form>
                );
              })}
            </div>
          </SectionCard>
        ) : null}

        <SectionCard className="lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Invite link
          </p>
          <h3 className="mt-3 text-xl font-black">
            Let members join by Google login
          </h3>

          {inviteLink ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm font-bold text-slate-700 break-all">
              {inviteLink}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">
              No invite link generated yet.
            </p>
          )}

          {isOwner ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {!inviteLink ? (
                <form action={ensureInviteLink}>
                  <SubmitButton className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white">
                    Generate link
                  </SubmitButton>
                </form>
              ) : null}
              <form action={regenerateInviteLink}>
                <SubmitButton
                  pendingText="Resetting..."
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                >
                  Reset link
                </SubmitButton>
              </form>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard className="border-rose-100 bg-rose-50/60 lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">
            Danger zone
          </p>
          <h3 className="mt-3 text-xl font-black text-slate-950">
            Leave this mess
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Leaving will remove you from the active mess member list, but your
            old expenses, payments, and closed reports will stay for accounting
            history.
          </p>
          <form action={leaveMess} className="mt-4">
            <SubmitButton
              pendingText="Leaving..."
              className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white hover:bg-slate-950"
            >
              Leave mess
            </SubmitButton>
          </form>
        </SectionCard>
      </div>
    </>
  );
}
