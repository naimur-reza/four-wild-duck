import { ChefHat, Star, Trash2 } from "lucide-react";
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
  rateCookingEntry,
  updateCookingEntry
} from "./actions";

export const dynamic = "force-dynamic";

const statusMessages: Record<string, string> = {
  "entry-saved": "Cooking entry saved.",
  "duplicate-entry": "This member already has a cooking entry for that date.",
  "unavailable-added": "Off day saved.",
  "not-allowed": "You can only manage your own cooking entry.",
  "invalid-member": "Selected member is not active in this mess."
};

type MemberItem = Awaited<ReturnType<typeof prisma.messMember.findMany>>[number] & {
  profile: { name: string };
};

type CookingEntryItem = Awaited<ReturnType<typeof prisma.cookingEntry.findMany>>[number] & {
  member: { id: string; profile: { name: string } };
  ratings: { rating: number }[];
};

type UnavailableItem = Awaited<ReturnType<typeof prisma.cookingUnavailable.findMany>>[number] & {
  member: { profile: { name: string } };
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

function averageRating(ratings: { rating: number }[]) {
  if (!ratings.length) return 0;
  return ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length;
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

  const members = await prisma.messMember.findMany({
    where: { messId: membership.messId, status: "ACTIVE" },
    include: { profile: true },
    orderBy: { createdAt: "asc" }
  }) as MemberItem[];

  let entries: CookingEntryItem[] = [];
  let unavailable: UnavailableItem[] = [];
  let monthlyCompleted: { memberId: string }[] = [];
  let todayEntries: CookingEntryItem[] = [];
  let cookingTablesReady = true;

  try {
    const [entryRows, unavailableRows, completedRows, todayRows] = await Promise.all([
      prisma.cookingEntry.findMany({
        where: { messId: membership.messId, date: { gte: monthStart, lte: monthEnd } },
        include: {
          member: { include: { profile: true } },
          ratings: true
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }]
      }),
      prisma.cookingUnavailable.findMany({
        where: { messId: membership.messId, date: { gte: todayStart } },
        include: { member: { include: { profile: true } } },
        orderBy: { date: "asc" },
        take: 8
      }),
      prisma.cookingEntry.findMany({
        where: {
          messId: membership.messId,
          date: { gte: monthStart, lte: monthEnd },
          status: { in: ["COMPLETED", "SWAPPED"] }
        },
        select: { memberId: true }
      }),
      prisma.cookingEntry.findMany({
        where: { messId: membership.messId, date: todayStart, status: { in: ["COMPLETED", "SWAPPED"] } },
        include: { member: { include: { profile: true } }, ratings: true },
        orderBy: { createdAt: "desc" }
      })
    ]);

    entries = entryRows as CookingEntryItem[];
    unavailable = unavailableRows as UnavailableItem[];
    monthlyCompleted = completedRows;
    todayEntries = todayRows as CookingEntryItem[];
  } catch {
    cookingTablesReady = false;
  }

  const countByMember = new Map<string, number>();
  for (const item of monthlyCompleted) {
    countByMember.set(item.memberId, (countByMember.get(item.memberId) || 0) + 1);
  }

  const todayNames = todayEntries.map((entry) => entry.member.profile.name).join(", ");

  return (
    <>
      <PageHeading eyebrow="Cooking" title="Daily cooking" />

      {message ? (
        <div className="mb-3 rounded-2xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 sm:text-sm">
          {message}
        </div>
      ) : null}

      {!cookingTablesReady ? (
        <SectionCard className="mb-3 border-amber-200 bg-amber-50 p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">Setup needed</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">Cooking database tables are not ready</h3>
          <p className="mt-2 text-sm font-semibold text-amber-800">
            Run <code className="rounded bg-white px-1 py-0.5">pnpm db:push</code> once for the production Neon database, then redeploy/reload. No reset needed.
          </p>
        </SectionCard>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr] lg:gap-4">
        <SectionCard className="border-slate-800 bg-[linear-gradient(135deg,#07111f_0%,#123434_100%)] p-4 text-white sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-200 sm:text-xs">Today</p>
              <h2 className="mt-1 truncate text-2xl font-black sm:text-3xl">{todayNames || "Not added"}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-300">{prettyDate(todayStart)}</p>
            </div>
            <ChefHat className="h-7 w-7 shrink-0 text-teal-200" />
          </div>
          <p className="mt-4 rounded-2xl bg-white/10 p-3 text-xs font-semibold text-teal-100">
            Add your own cooking with menu. One entry per person per day.
          </p>
        </SectionCard>

        <SectionCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{monthKey(today)}</p>
              <h3 className="text-lg font-black sm:text-xl">Cooking count</h3>
            </div>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black text-teal-700 ring-1 ring-teal-100">{monthlyCompleted.length} total</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {members.map((member) => (
              <div key={member.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="truncate text-xs font-black sm:text-sm">{member.profile.name}</p>
                <p className="mt-1 text-xl font-black text-teal-700">{countByMember.get(member.id) || 0}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[0.8fr_1.2fr] lg:gap-4">
        <div className="space-y-3">
          <SectionCard className="p-4 sm:p-6">
            <details open className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">New</p>
                  <h3 className="text-xl font-black">Add cooking</h3>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black text-teal-700 ring-1 ring-teal-100">Open</span>
              </summary>
              <form action={addCookingEntry} className="mt-4 grid grid-cols-2 gap-2">
                {canManage ? (
                  <select name="member_id" defaultValue={membership.id} required disabled={!cookingTablesReady} className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500 disabled:opacity-60">
                    {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
                  </select>
                ) : (
                  <div className="col-span-2 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-black text-teal-700">
                    Adding as {membership.profile.name}
                  </div>
                )}
                <input name="date" type="date" defaultValue={formatDateInput()} disabled={!cookingTablesReady} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm font-semibold outline-none focus:border-teal-500 disabled:opacity-60" />
                <select name="status" defaultValue="COMPLETED" disabled={!cookingTablesReady} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm font-semibold outline-none focus:border-teal-500 disabled:opacity-60">
                  <option value="COMPLETED">Cooked</option>
                  <option value="SWAPPED">Swapped</option>
                  <option value="SKIPPED">Skipped</option>
                </select>
                <input name="comment" placeholder="mach, murgi, vat" disabled={!cookingTablesReady} className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500 disabled:opacity-60" />
                <SubmitButton pendingText="Saving..." className="col-span-2 rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white disabled:opacity-60">Save</SubmitButton>
              </form>
            </details>
          </SectionCard>

          {canManage ? (
            <SectionCard className="p-4 sm:p-6">
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Off day</p>
                    <h3 className="text-lg font-black">Unavailable</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">Open</span>
                </summary>
                <form action={addUnavailableDate} className="mt-4 grid gap-2">
                  <select name="member_id" required disabled={!cookingTablesReady} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500 disabled:opacity-60">
                    <option value="">Select member</option>
                    {members.map((member) => <option key={member.id} value={member.id}>{member.profile.name}</option>)}
                  </select>
                  <input name="date" type="date" defaultValue={formatDateInput()} disabled={!cookingTablesReady} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500 disabled:opacity-60" />
                  <input name="reason" placeholder="Reason" disabled={!cookingTablesReady} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500 disabled:opacity-60" />
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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Entries</p>
              <h3 className="text-lg font-black">This month</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">{entries.length}</span>
          </div>
          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
            {entries.length ? entries.map((entry) => {
              const canEditEntry = canManage || entry.memberId === membership.id;
              const avg = averageRating(entry.ratings);
              return (
                <details key={entry.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 open:bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{entry.member.profile.name}</p>
                      <p className="truncate text-xs font-bold text-slate-400">{prettyDate(entry.date)} • {entry.comment || "No menu"}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700 ring-1 ring-amber-100">
                      <Star className="h-3 w-3 fill-current" /> {avg ? avg.toFixed(1) : "—"}
                    </span>
                  </summary>

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <form key={star} action={rateCookingEntry}>
                          <input type="hidden" name="entry_id" value={entry.id} />
                          <input type="hidden" name="rating" value={star} />
                          <SubmitButton pendingText="..." className="rounded-full bg-amber-50 px-2.5 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100">
                            {star}★
                          </SubmitButton>
                        </form>
                      ))}
                      <span className="ml-1 text-[10px] font-bold text-slate-400">{entry.ratings.length} ratings</span>
                    </div>

                    {canEditEntry ? (
                      <>
                        <form action={updateCookingEntry} className="grid gap-2 sm:grid-cols-2">
                          <input type="hidden" name="entry_id" value={entry.id} />
                          <select name="status" defaultValue={entry.status} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-teal-500">
                            <option value="COMPLETED">Cooked</option>
                            <option value="SKIPPED">Skipped</option>
                            <option value="SWAPPED">Swapped</option>
                          </select>
                          <input name="comment" defaultValue={entry.comment || ""} placeholder="Menu" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-teal-500" />
                          <SubmitButton pendingText="Saving..." className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white sm:col-span-2">Save</SubmitButton>
                        </form>
                        <form action={deleteCookingEntry} className="mt-2 flex justify-end">
                          <input type="hidden" name="entry_id" value={entry.id} />
                          <SubmitButton pendingText="..." className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100"><Trash2 className="mr-1 inline h-3 w-3" />Delete</SubmitButton>
                        </form>
                      </>
                    ) : null}
                  </div>
                </details>
              );
            }) : (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm font-bold text-slate-500">No cooking entries yet.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
