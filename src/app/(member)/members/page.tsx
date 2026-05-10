import { AddButton } from "@/components/ui/add-button";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { addMember, updateMember } from "@/app/(member)/actions";
import { canManageMoney, getMessMembers, requireMembership, toNumber } from "@/lib/data/ledger";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const membership = await requireMembership();
  const members = await getMessMembers(membership.messId);
  const canManage = canManageMoney(membership.role);
  const isOwner = membership.role === "OWNER";

  return (
    <>
      <PageHeading eyebrow="People" title="Members" action={canManage ? <AddButton>Add</AddButton> : undefined} />

      {canManage ? (
        <SectionCard className="mb-4">
          <h3 className="text-xl font-black">Add existing profile</h3>
          <form action={addMember} className="mt-5 grid gap-3 md:grid-cols-[1.3fr_0.8fr_0.8fr_auto]">
            <input name="profile" className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Email, username, or user id" required />
            <select name="role" disabled={!isOwner} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white">
              <option value="MEMBER">Member</option>
              <option value="MANAGER">Manager</option>
            </select>
            <input name="opening_balance" type="number" step="0.01" className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white" placeholder="Opening balance" />
            <button className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-100 transition hover:bg-slate-950">Save</button>
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
                <button className="col-span-2 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Update</button>
              </form>
            ) : null}
          </SectionCard>
        ))}
      </div>
    </>
  );
}
