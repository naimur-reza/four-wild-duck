import { ChefHat, Trash2 } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/db/prisma";
import { canManageMoney, formatDateInput, requireMembership } from "@/lib/data/ledger";
import {
  addUnavailableDate,
  deleteUnavailableDate,
  generateCookingSchedule,
  syncCookingRoster,
  updateCookingDay,
  updateRosterPosition
} from "./actions";

export const dynamic = "force-dynamic";

const statusMessages: Record<string, string> = {
  "roster-synced": "Cooking roster synced with active members.",
  "schedule-generated": "Upcoming cooking schedule generated.",
  "unavailable-added": "Unavailable date saved and schedule refreshed for that date.",
  "empty-roster": "Set up the cooking roster first.",
  "not-allowed": "Only owners and managers can manage cooking schedule.",
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

export default async function CookingPage({ searchParams }: { searchParams?: Promise<{ cookingStatus?: string }> }) {
  const params = await searchParams;
  const message = params?.cookingStatus ? statusMessages[params.cookingStatus] : undefined;
  const membership = await requireMembership();
  const canManage = canManageMoney(membership.role);
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [members, roster, days, unavailable, monthlyCompleted] = await Promise.all([
    prisma.messMember.findMany({
      where: { messId: membership.messId, status: "ACTIVE" },
      include: { profile: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.cookingRoster.findMany({
      where: { messId: membership.messId, isActive: true },
      include: { member: { include: { profile: true } } },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }]
    }),
    prisma.cookingDay.findMany({
      where: { messId: membership.messId, date: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } },
      include: {
        assignedTo: { include: { profile: true } },
        cookedBy: { include: { profile: true } }
      },
      orderBy: { date: "asc" },
      take: 14
    }),
    prisma.cookingUnavailable.findMany({
      where: { messId: membership.messId, date: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } },
      include: { member: { include: { profile: true } } },
      orderBy: { date: "asc" },
      take: 12
    }),
    prisma.cookingDay.findMany({
      where: {
        messId: membership.messId,
        date: { gte: monthStart, lte: monthEnd },
        status: { in: ["COMPLETED", "SWAPPED"] },
        cookedById: { not: null }
      },
      select: { cookedById: true }
    })
  ]);

  const countByMember = new Map<string, number>();
  for (const item of monthlyCompleted) {
    if (!item.cookedById) continue;
    countByMember.set(item.cookedById, (countByMember.get(item.cookedById) || 0) + 1);
  }

  const todayDuty = days[0];

  return (
    <>
      <PageHeading eyebrow="Roster" title="Cooking" />

      {message ? (
        <div className="mb-3 rounded-2xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 sm:mb-4 sm:px-4 sm:py-3 sm:text-sm">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr] lg:gap-4">
        <SectionCard className="border-slate-800 bg-[linear-gradient(135deg,#07111f_0%,#123434_100%)] p-4 text-white sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-200 sm:text-xs sm:tracking-[0.22em]">Today</p>
              <h2 className="mt-1 truncate text-2xl font-black sm:mt-2 sm:text-3xl">{todayDuty?.assignedTo?.profile.name || "No cook set"}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-300 sm:text-sm">{todayDuty ? prettyDate(todayDuty.date) : "Generate schedule to see today’s duty."}</p>
            </div>
            <ChefHat className="h-7 w-7 shrink-0 text-teal-200 sm:h-8 sm:w-8" />
          </div>
          {todayDuty?.comment ? <p className="mt-4 rounded-2xl bg-white/10 p-3 text-xs font-semibold text-white sm:mt-5 sm:text-sm">{todayDuty.comment}</p> : null}
          {canManage ? (
            <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:mt-5">
              <form action={syncCookingRoster} className="min-w-0">
                <SubmitButton pendingText="Syncing..." className="w-full rounded-2xl bg-white px-3 py-3 text-[11px] font-black text-slate-950 sm:px-4 sm:text-xs">Sync roster</SubmitButton>
              </form>
              <form action={generateCookingSchedule} className="min-w-0">
                <input type="hidden" name="days_count" value="14" />
                <SubmitButton pendingText="Generating..." className="w-full rounded-2xl bg-teal-300 px-3 py-3 text-[11px] font-black text-slate-950 sm:px-4 sm:text-xs">Generate</SubmitButton>
              </form>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Monthly</p>
              <h3 className="text-lg font-black sm:mt-1 sm:text-xl">{monthKey(today)} report</h3>
            </div>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black text-teal-700 ring-1 ring-teal-100">{monthlyCompleted.length} done</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-4">
            {members.map((member) => (
              <div key={member.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="truncate text-xs font-black sm:text-sm">{member.profile.name}</p>
                <p className="mt-1 text-xl font-black text-teal-700 sm:text-2xl">{countByMember.get(member.id) || 0}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[0.85fr_1.15fr] lg:gap-4">
        <div className="space-y-3 lg:space-y-4">
          <SectionCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Order</p>
                <h3 className="text-lg font-black sm:mt-1 sm:text-xl">Sequence</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">{roster.length} active</span>
            </div>
            <div className="mt-3 space-y-2 sm:mt-4">
              {roster.length ? roster.map((item) => (
                <form key={item.id} action={updateRosterPosition} className="grid grid-cols-[1fr_72px_auto] items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 sm:grid-cols-[1fr_82px_auto] sm:p-3">
                  <input type="hidden" name="roster_id" value={item.id} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{item.member.profile.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 sm:text-xs">#{item.position}</p>
                  </div>
                  <input disabled={!canManage} name="position" type="number" min="1" defaultValue={item.position} className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-black outline-none disabled:text-slate-400 sm:px-3" />
                  {canManage ? <SubmitButton pendingText="..." className="rounded-xl bg-slate-950 px-2.5 py-2 text-[10px] font-black text-white sm:px-3 sm:text-xs">Save</SubmitButton> : null}
                </form>
              )) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm font-bold text-slate-500">No roster yet. Tap Sync roster.</p>
              )}
            </div>
          </SectionCard>

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
                  <SubmitButton pendingText="Saving..." className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white">Save off day</SubmitButton>
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:text-xs">Upcoming</p>
              <h3 className="text-lg font-black sm:mt-1 sm:text-xl">Daily schedule</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">{days.length} days</span>
          </div>
          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
            {days.length ? days.map((day) => (
              <details key={day.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 open:bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{prettyDate(day.date)}</p>
                    <p className="text-xs font-bold text-slate-400">{day.assignedTo?.profile.name || "No available cook"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black sm:px-3 sm:text-[10px] ${day.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : day.status === "SWAPPED" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" : day.status === "SKIPPED" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" : "bg-slate-100 text-slate-600"}`}>{day.status}</span>
                </summary>

                {canManage ? (
                  <form action={updateCookingDay} className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
                    <input type="hidden" name="day_id" value={day.id} />
                    <select name="assigned_to_id" defaultValue={day.assignedToId || ""} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-teal-500">
                      <option value="">No cook</option>
                      {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
                    </select>
                    <select name="cooked_by_id" defaultValue={day.cookedById || day.assignedToId || ""} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-teal-500">
                      <option value="">Not cooked yet</option>
                      {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
                    </select>
                    <select name="status" defaultValue={day.status} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-teal-500">
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="SKIPPED">Skipped</option>
                      <option value="SWAPPED">Swapped</option>
                    </select>
                    <input name="comment" defaultValue={day.comment || ""} placeholder="Comment" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-teal-500" />
                    <SubmitButton pendingText="Saving..." className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white sm:col-span-2">Save day</SubmitButton>
                  </form>
                ) : day.comment ? (
                  <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-semibold text-slate-600">{day.comment}</p>
                ) : null}
              </details>
            )) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm font-bold text-slate-500">No schedule yet. Generate upcoming days.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
