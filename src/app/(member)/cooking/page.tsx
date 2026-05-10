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
        <div className="mb-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard className="border-slate-800 bg-[linear-gradient(135deg,#07111f_0%,#123434_100%)] text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">Today</p>
              <h2 className="mt-2 text-3xl font-black">{todayDuty?.assignedTo?.profile.name || "No cook set"}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-300">{todayDuty ? prettyDate(todayDuty.date) : "Generate schedule to see today’s duty."}</p>
            </div>
            <ChefHat className="h-8 w-8 text-teal-200" />
          </div>
          {todayDuty?.comment ? <p className="mt-5 rounded-2xl bg-white/10 p-3 text-sm font-semibold text-white">{todayDuty.comment}</p> : null}
          {canManage ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <form action={syncCookingRoster}>
                <SubmitButton pendingText="Syncing..." className="w-full rounded-2xl bg-white px-4 py-3 text-xs font-black text-slate-950">Sync roster</SubmitButton>
              </form>
              <form action={generateCookingSchedule}>
                <input type="hidden" name="days_count" value="14" />
                <SubmitButton pendingText="Generating..." className="w-full rounded-2xl bg-teal-300 px-4 py-3 text-xs font-black text-slate-950">Generate 14 days</SubmitButton>
              </form>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Monthly count</p>
          <h3 className="mt-3 text-xl font-black">{monthKey(today)} cooking report</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {members.map((member) => (
              <div key={member.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="truncate text-sm font-black">{member.profile.name}</p>
                <p className="mt-1 text-2xl font-black text-teal-700">{countByMember.get(member.id) || 0}</p>
                <p className="text-xs font-bold text-slate-400">cooked</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <SectionCard>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Order</p>
            <h3 className="mt-3 text-xl font-black">Cooking sequence</h3>
            <div className="mt-4 space-y-2">
              {roster.length ? roster.map((item) => (
                <form key={item.id} action={updateRosterPosition} className="grid grid-cols-[1fr_82px_auto] items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                  <input type="hidden" name="roster_id" value={item.id} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{item.member.profile.name}</p>
                    <p className="text-xs font-bold text-slate-400">#{item.position}</p>
                  </div>
                  <input disabled={!canManage} name="position" type="number" min="1" defaultValue={item.position} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black outline-none disabled:text-slate-400" />
                  {canManage ? <SubmitButton pendingText="..." className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Save</SubmitButton> : null}
                </form>
              )) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm font-bold text-slate-500">No roster yet. Click Sync roster.</p>
              )}
            </div>
          </SectionCard>

          {canManage ? (
            <SectionCard>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Unavailable</p>
              <h3 className="mt-3 text-xl font-black">Mark off day</h3>
              <form action={addUnavailableDate} className="mt-4 grid gap-2">
                <select name="member_id" required className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500">
                  <option value="">Select member</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
                </select>
                <input name="date" type="date" defaultValue={formatDateInput()} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500" />
                <input name="reason" placeholder="Reason / comment" className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500" />
                <SubmitButton pendingText="Saving..." className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white">Save unavailable</SubmitButton>
              </form>

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
            </SectionCard>
          ) : null}
        </div>

        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Upcoming</p>
          <h3 className="mt-3 text-xl font-black">Daily schedule</h3>
          <div className="mt-4 space-y-3">
            {days.length ? days.map((day) => (
              <details key={day.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 open:bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{prettyDate(day.date)}</p>
                    <p className="text-xs font-bold text-slate-400">{day.assignedTo?.profile.name || "No available cook"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black ${day.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : day.status === "SWAPPED" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" : day.status === "SKIPPED" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" : "bg-slate-100 text-slate-600"}`}>{day.status}</span>
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
