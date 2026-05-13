import { ChefHat, Trash2 } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/db/prisma";
import { canManageMoney, formatDateInput, requireMembership } from "@/lib/data/ledger";
import {
  addCookingEntry,
  addUnavailableDate,
  deleteCookingEntry,
  deleteUnavailableDate,
  updateCookingDay
} from "./actions";

export const dynamic = "force-dynamic";

const statusMessages: Record<string, string> = {
  "entry-saved": "Cooking entry saved.",
  "unavailable-added": "Off day saved.",
  "not-allowed": "Only owners and managers can manage cooking entries.",
  "invalid-member": "Selected member is not active in this mess."
};

function prettyDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfToday(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default async function CookingPage({ searchParams }: { searchParams?: Promise<{ cookingStatus?: string }> }) {
  const params = await searchParams;
  const message = params?.cookingStatus ? statusMessages[params.cookingStatus] : undefined;
  const membership = await requireMembership();
  const canManage = canManageMoney(membership.role);
  const today = new Date();
  const todayStart = startOfToday(today);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [members, entries, unavailable, monthlyCompleted, todayEntry] = await Promise.all([
    prisma.messMember.findMany({
      where: { messId: membership.messId, status: "ACTIVE" },
      include: { profile: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.cookingDay.findMany({
      where: { messId: membership.messId, date: { gte: monthStart, lte: monthEnd } },
      include: {
        assignedTo: { include: { profile: true } },
        cookedBy: { include: { profile: true } }
      },
      orderBy: { date: "desc" }
    }),
    prisma.cookingUnavailable.findMany({
      where: { messId: membership.messId, date: { gte: todayStart } },
      include: { member: { include: { profile: true } } },
      orderBy: { date: "asc" },
      take: 8
    }),
    prisma.cookingDay.findMany({
      where: {
        messId: membership.messId,
        date: { gte: monthStart, lte: monthEnd },
        status: { in: ["COMPLETED", "SWAPPED"] },
        cookedById: { not: null }
      },
      select: { cookedById: true }
    }),
    prisma.cookingDay.findUnique({
      where: { messId_date: { messId: membership.messId, date: todayStart } },
      include: {
        assignedTo: { include: { profile: true } },
        cookedBy: { include: { profile: true } }
      }
    })
  ]);

  const countByMember = new Map<string, number>();
  for (const item of monthlyCompleted) {
    if (!item.cookedById) continue;
    countByMember.set(item.cookedById, (countByMember.get(item.cookedById) || 0) + 1);
  }

  return (
    <>
      <PageHeading eyebrow="Cooking" title="Daily cooking" />

      {message ? (
        <div className="mb-3 rounded-2xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 sm:mb-4 sm:px-4 sm:py-3 sm:text-sm">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr] lg:gap-4">
        <SectionCard className="border-slate-800 bg-[linear-gradient(135deg,#07111f_0%,#123434_100%)] p-4 text-white sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-200 sm:text-xs sm:tracking-[0.22em]">Today cooked</p>
              <h2 className="mt-1 truncate text-2xl font-black sm:mt-2 sm:text-3xl">{todayEntry?.cookedBy?.profile.name || "Not added"}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-300 sm:text-sm">{prettyDate(todayStart)}</p>
            </div>
            <ChefHat className="h-7 w-7 shrink-0 text-teal-200 sm:h-8 sm:w-8" />
          </div>
          {todayEntry?.comment ? <p className="mt-4 rounded-2xl bg-white/10 p-3 text-xs font-semibold text-white sm:mt-5 sm:text-sm">{todayEntry.comment}</p> : null}
          <div className="mt-4 rounded-2xl bg-white/10 p-3 text-xs font-semibold text-teal-100">
            Add who actually cooked each day. Month close will freeze these cooking counts in history.
          </div>
        </SectionCard>

        <SectionCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:text-xs">This month</p>
              <h3 className="text-lg font-black sm:mt-1 sm:text-xl">{monthKey(today)} count</h3>
            </div>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black text-teal-700 ring-1 ring-teal-100">{monthlyCompleted.length} cooked</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-4">
            {members.map((member) => (
              <div key={member.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="truncate text-xs font-black sm:text-sm">{member.profile.name}</p>
                <p className="mt-1 text-xl font-black text-teal-700 sm:text-2xl">{countByMember.get(member.id) || 0}</p>
                <p className="text-[10px] font-bold text-slate-400">cooked</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[0.85fr_1.15fr] lg:gap-4">
        <div className="space-y-3 lg:space-y-4">
          {canManage ? (
            <SectionCard className="p-4 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700 sm:text-xs">New</p>
              <h3 className="mt-1 text-xl font-black">Add cooking entry</h3>
              <form action={addCookingEntry} className="mt-4 grid grid-cols-2 gap-2">
                <select name="cooked_by_id" required className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500">
                  <option value="">Who cooked?</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
                </select>
                <select name="assigned_to_id" className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500">
                  <option value="">Assigned person, optional</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
                </select>
                <input name="date" type="date" defaultValue={formatDateInput()} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500" />
                <select name="status" defaultValue="COMPLETED" className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500">
                  <option value="COMPLETED">Completed</option>
                  <option value="SWAPPED">Swapped</option>
                  <option value="SKIPPED">Skipped</option>
                </select>
                <input name="comment" placeholder="Comment" className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500" />
                <SubmitButton pendingText="Saving..." className="col-span-2 rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white">Save cooking</SubmitButton>
              </form>
            </SectionCard>
          ) : null}

          {canManage ? (
            <SectionCard className="p-4 sm:p-6">
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Off day</p>
                    <h3 className="text-lg font-black sm:mt-1 sm:text-xl">Mark unavailable</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">Open</span>
                </summary>
                <form action={addUnavailableDate} className="mt-4 grid gap-2">
                  <select name="member_id" required className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500">
                    <option value="">Select member</option>
                    {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
                  </select>
                  <input name="date" type="date" defaultValue={formatDateInput()} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500" />
                  <input name="reason" placeholder="Reason / comment" className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500" />
                  <SubmitButton pendingText="Saving..." className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Save off day</SubmitButton>
                </form>
              </details>

              {unavailable.length ? (
                <div className="mt-4 space-y-2">
                  {unavailable.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{item.member.profile.name}</p>
                        <p className="text-xs font-bold text-slate-400">{prettyDate(item.date)}{item.reason ? ` • ${item.reason}` : ""}</p>
                      </div>
                      <form action={deleteUnavailableDate}>
                        <input type="hidden" name="unavailable_id" value={item.id} />
                        <SubmitButton pendingText="..." className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"><Trash2 className="h-3 w-3" /></SubmitButton>
                      </form>
                    </div>
                  ))}
                </div>
              ) : null}
            </SectionCard>
          ) : null}
        </div>

        <SectionCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Entries</p>
              <h3 className="text-lg font-black sm:mt-1 sm:text-xl">This month</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">{entries.length} days</span>
          </div>
          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
            {entries.length ? entries.map((day) => (
              <details key={day.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 open:bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{prettyDate(day.date)}</p>
                    <p className="text-xs font-bold text-slate-400">Cooked by {day.cookedBy?.profile.name || "Not set"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black sm:px-3 sm:text-[10px] ${day.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : day.status === "SWAPPED" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" : day.status === "SKIPPED" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" : "bg-slate-100 text-slate-600"}`}>{day.status}</span>
                </summary>

                {canManage ? (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <form action={updateCookingDay} className="grid gap-2 sm:grid-cols-2">
                      <input type="hidden" name="day_id" value={day.id} />
                      <select name="cooked_by_id" defaultValue={day.cookedById || ""} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-teal-500">
                        <option value="">Not cooked yet</option>
                        {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
                      </select>
                      <select name="assigned_to_id" defaultValue={day.assignedToId || ""} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-teal-500">
                        <option value="">No assigned person</option>
                        {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
                      </select>
                      <select name="status" defaultValue={day.status} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-teal-500">
                        <option value="COMPLETED">Completed</option>
                        <option value="SKIPPED">Skipped</option>
                        <option value="SWAPPED">Swapped</option>
                      </select>
                      <input name="comment" defaultValue={day.comment || ""} placeholder="Comment" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-teal-500" />
                      <SubmitButton pendingText="Saving..." className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white sm:col-span-2">Save entry</SubmitButton>
                    </form>
                    <form action={deleteCookingEntry} className="mt-2 flex justify-end">
                      <input type="hidden" name="day_id" value={day.id} />
                      <SubmitButton pendingText="..." className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"><Trash2 className="mr-1 inline h-3 w-3" />Delete</SubmitButton>
                    </form>
                  </div>
                ) : day.comment ? (
                  <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-semibold text-slate-600">{day.comment}</p>
                ) : null}
              </details>
            )) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm font-bold text-slate-500">No cooking entries yet.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
