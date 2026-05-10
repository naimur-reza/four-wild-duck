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

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const message = params?.memberStatus ? memberMessages[params.memberStatus] : undefined;
  const membership = await requireMembership();
  const members = await getMessMembers(membership.messId);
  const canManage = canManageMoney(membership.role);
  const isOwner = membership.role === "OWNER";

  return (
    <>
      <PageHeading eyebrow="People" title="Members" action={canManage ? <AddButton>Add</AddButton> : undefined} />

      {message ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
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
        <SectionCard className="mb-4">
          <h3 className="text-xl font-black">Join a member</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">Ask them to sign in once with Google, then add their email, username, or user id here.</p>
          <form action={addMember} className="mt-5 grid gap-3 md:grid-cols-[1.3fr_0.8fr_0.8fr_auto]">
            <input name="profile" className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Email, username, or user id" required />
            <select name="role" disabled={!isOwner} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white">
              <option value="MEMBER">Member</option>
              <option value="MANAGER">Manager</option>
            </select>
            <input name="opening_balance" type="number" step="0.01" className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Opening balance" />
            <SubmitButton className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950">Save</SubmitButton>
          </form>
        </SectionCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member, index) => (
          <SectionCard key={member.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-slate-700 text-lg font-black text-white">{member.profile.name[0]}</div>
                <div>
                  <h3 className="font-black">{member.profile.name}</h3>
                  <p className="text-xs font-semibold text-slate-400">{member.role} #{index + 1}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${member.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-100 text-slate-500 ring-slate-200"}`}>{member.status}</span>
            </div>
            <div className="mt-5 rounded-[1.35rem] border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Opening</p>
              <p className="mt-2 text-2xl font-black">{formatTaka(toNumber(member.openingBalance))}</p>
            </div>
            {canManage ? (
              <form action={updateMember} className="mt-4 grid grid-cols-2 gap-2">
                <input type="hidden" name="member_id" value={member.id} />
                <select name="role" defaultValue={member.role} disabled={!isOwner || member.role === "OWNER"} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black outline-none">
                  <option value="MEMBER">Member</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
                <select name="status" defaultValue={member.status} disabled={member.role === "OWNER"} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black outline-none">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <SubmitButton pendingText="Updating..." className="col-span-2 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Update</SubmitButton>
              </form>
            ) : null}
          </SectionCard>
        ))}
      </div>
    </>
  );
}
