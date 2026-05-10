import Image from "next/image";
import { AddButton } from "@/components/ui/add-button";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { addMember, updateMember } from "@/app/(member)/actions";
import { canManageMoney, getMessMembers, requireMembership, toNumber } from "@/lib/data/ledger";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

type MembersPageProps = {
  searchParams?: Promise<{ memberStatus?: string }>;
};

const memberMessages: Record<string, { tone: "success" | "warning" | "error"; text: string }> = {
  "member-added": { tone: "success", text: "Member joined this mess." },
  "profile-not-found": { tone: "warning", text: "Ask this member to sign in once first." },
  "already-member": { tone: "warning", text: "This member is already in this mess." },
  "missing-query": { tone: "error", text: "Add an email, username, or user id." }
};

function AddMemberForm({ isOwner, compact = false }: { isOwner: boolean; compact?: boolean }) {
  return (
    <form action={addMember} className={compact ? "mt-3 grid gap-2" : "mt-5 grid gap-3 md:grid-cols-[1.3fr_0.8fr_0.8fr_auto]"}>
      <input name="profile" className={compact ? "h-10 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs outline-none transition focus:border-teal-500 focus:bg-white" : "rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white"} placeholder={compact ? "Email / username" : "Email, username, or user id"} required />
      <select name="role" disabled={!isOwner} className={compact ? "h-10 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-semibold outline-none transition focus:border-teal-500 focus:bg-white" : "rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white"}>
        <option value="MEMBER">Member</option>
        <option value="MANAGER">Manager</option>
      </select>
      <input name="opening_balance" type="number" step="0.01" className={compact ? "h-10 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs outline-none transition focus:border-teal-500 focus:bg-white" : "rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white"} placeholder={compact ? "Opening" : "Opening balance"} />
      <SubmitButton className={compact ? "h-10 rounded-xl bg-teal-700 px-4 text-xs font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950" : "rounded-2xl bg-teal-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950"}>Save</SubmitButton>
    </form>
  );
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const message = params?.memberStatus ? memberMessages[params.memberStatus] : undefined;
  const membership = await requireMembership();
  const members = await getMessMembers(membership.messId);
  const canManage = canManageMoney(membership.role);
  const isOwner = membership.role === "OWNER";

  return (
    <>
      <div className="hidden sm:block">
        <PageHeading eyebrow="People" title="Members" action={canManage ? <AddButton>Add</AddButton> : undefined} />
      </div>

      {message ? (
        <div
          className={`mb-3 rounded-2xl border px-3 py-2 text-xs font-bold sm:mb-4 sm:px-4 sm:py-3 sm:text-sm ${
            message.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : message.tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {canManage ? (
        <>
          <details className="mb-3 rounded-[1.15rem] border border-white/80 bg-white/[0.9] p-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.03] sm:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black">Join member</h3>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Add email after Google sign-in.</p>
              </div>
              <span className="rounded-xl bg-teal-700 px-3 py-2 text-[10px] font-black text-white">Add</span>
            </summary>
            <AddMemberForm isOwner={isOwner} compact />
          </details>

          <SectionCard className="mb-4 hidden sm:block">
            <h3 className="text-xl font-black">Join a member</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">Ask them to sign in once with Google, then add their email, username, or user id here.</p>
            <AddMemberForm isOwner={isOwner} />
          </SectionCard>
        </>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-3">
        {members.map((member, index) => (
          <SectionCard key={member.id} className="p-3 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                {member.profile.avatarUrl ? (
                  <Image src={member.profile.avatarUrl} alt="" width={48} height={48} unoptimized className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-slate-100 sm:h-12 sm:w-12 sm:rounded-2xl" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-slate-700 text-sm font-black text-white sm:h-12 sm:w-12 sm:rounded-2xl sm:text-lg">{member.profile.name[0]}</div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-black sm:text-base">{member.profile.name}</h3>
                  <p className="truncate text-[10px] font-semibold text-slate-400 sm:text-xs">{member.role} #{index + 1}</p>
                </div>
              </div>
              <span className={`w-fit rounded-full px-2 py-0.5 text-[9px] font-black ring-1 sm:px-3 sm:py-1 sm:text-xs ${member.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>{member.status}</span>
            </div>
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:mt-5 sm:rounded-[1.35rem] sm:p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.18em]">Opening</p>
              <p className="mt-1 truncate text-base font-black sm:mt-2 sm:text-2xl">{formatTaka(toNumber(member.openingBalance))}</p>
            </div>
            {canManage ? (
              <form action={updateMember} className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-2">
                <input type="hidden" name="member_id" value={member.id} />
                <select name="role" defaultValue={member.role} disabled={!isOwner || member.role === "OWNER"} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black outline-none sm:rounded-2xl sm:px-3 sm:text-xs">
                  <option value="MEMBER">Member</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
                <select name="status" defaultValue={member.status} disabled={member.role === "OWNER"} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-black outline-none sm:rounded-2xl sm:px-3 sm:text-xs">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <SubmitButton pendingText="..." className="col-span-2 h-9 rounded-xl bg-slate-950 px-3 text-[10px] font-black text-white sm:rounded-2xl sm:px-4 sm:py-2 sm:text-xs">Update</SubmitButton>
              </form>
            ) : null}
          </SectionCard>
        ))}
      </div>
    </>
  );
}
