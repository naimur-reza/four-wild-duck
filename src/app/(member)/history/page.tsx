import Link from "next/link";
import { reopenMonth } from "@/app/(member)/actions";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { canManageMoney, requireMembership, toNumber } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

const reopenMessages: Record<string, { tone: "success" | "warning" | "error"; text: string }> = {
  reopened: { tone: "success", text: "Month reopened. You can now edit entries and close it again." },
  "not-latest": { tone: "warning", text: "Only the latest closed month can be reopened." },
  "open-has-activity": { tone: "warning", text: "Cannot reopen because the current open month already has expenses or payments." },
  "not-found": { tone: "error", text: "Closed month was not found." },
  "missing-month": { tone: "error", text: "Select a closed month first." }
};

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ month?: string; reopenStatus?: string }> }) {
  const membership = await requireMembership();
  const { month: selectedMonthId, reopenStatus } = await searchParams;
  const canReopen = canManageMoney(membership.role);
  const message = reopenStatus ? reopenMessages[reopenStatus] : undefined;
  const months = await prisma.month.findMany({
    where: { messId: membership.messId, status: "CLOSED" },
    orderBy: { closedAt: "desc" },
    include: {
      summaries: {
        include: { member: { include: { profile: true } } },
        orderBy: { createdAt: "asc" }
      }
    }
  });
  const selected = months.find((month) => month.id === selectedMonthId) || months[0];
  const latestClosedId = months[0]?.id;

  return (
    <>
      <div className="hidden sm:block">
        <PageHeading eyebrow="Archive" title="History" />
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

      <div className="grid gap-3 lg:grid-cols-[0.72fr_1.28fr] lg:gap-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-1">
          {months.map((month) => {
            const netDue = month.summaries.reduce((sum, summary) => {
              const closing = toNumber(summary.closingBalance);
              return closing > 0 ? sum + closing : sum;
            }, 0);

            return (
              <Link key={month.id} href={`/history?month=${month.id}`} className="block">
                <SectionCard className={`p-3 sm:p-5 ${selected?.id === month.id ? "ring-2 ring-teal-500" : ""}`}>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 sm:text-xs sm:tracking-[0.2em]">Closed</p>
                  <h3 className="mt-1 truncate text-base font-black sm:mt-3 sm:text-2xl">{month.label}</h3>
                  <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:mt-5 sm:rounded-[1.35rem] sm:p-4">
                    <p className="text-[10px] font-bold text-slate-400 sm:text-xs">Net due</p>
                    <p className="mt-0.5 truncate text-sm font-black sm:mt-1 sm:text-xl">{formatTaka(netDue)}</p>
                  </div>
                </SectionCard>
              </Link>
            );
          })}
        </div>

        <SectionCard className="p-3 sm:p-5 md:p-6">
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-5">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-700 sm:text-xs sm:tracking-[0.2em]">Snapshot</p>
              <h3 className="truncate text-lg font-black sm:text-xl">{selected ? selected.label : "No closed months"}</h3>
            </div>
            {selected ? <span className="rounded-xl bg-slate-950 px-3 py-1.5 text-[10px] font-black text-white sm:text-xs">{selected.summaries.length} rows</span> : null}
          </div>

          {selected && canReopen && selected.id === latestClosedId ? (
            <form action={reopenMonth} className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
              <input type="hidden" name="month_id" value={selected.id} />
              <p className="text-sm font-black text-amber-800">Need to fix this month?</p>
              <p className="mt-1 text-xs font-semibold text-amber-700">Reopen deletes the saved snapshot and makes this month editable again. Close it again after fixing entries.</p>
              <SubmitButton pendingText="Reopening..." className="mt-3 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white hover:bg-slate-950">Reopen latest month</SubmitButton>
            </form>
          ) : null}

          {selected ? (
            <div className="space-y-2 sm:space-y-3">
              {selected.summaries.map((summary) => {
                const closing = toNumber(summary.closingBalance);
                return (
                  <div key={summary.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 shadow-sm sm:rounded-[1.35rem] sm:p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black sm:text-base">{summary.member.profile.name}</p>
                      <p className="text-[10px] font-medium text-slate-500 sm:text-xs">Paid {formatTaka(toNumber(summary.totalContribution))}</p>
                    </div>
                    <div className={`shrink-0 rounded-xl px-2.5 py-1.5 text-right text-xs font-black sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm ${closing > 0 ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}`}>
                      {closing > 0 ? "Due" : "Advance"}<br />{formatTaka(Math.abs(closing))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
              <p className="text-3xl">🗓️</p>
              <h3 className="mt-2 text-base font-black">No history yet</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">Close a month to see snapshots here.</p>
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
