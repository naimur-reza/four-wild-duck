import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";
import { requireMembership, toNumber } from "@/lib/data/ledger";
import { prisma } from "@/lib/db/prisma";
import { formatTaka } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const membership = await requireMembership();
  const { month: selectedMonthId } = await searchParams;
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

  return (
    <>
      <PageHeading eyebrow="Archive" title="History" />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {months.map((month) => {
            const netDue = month.summaries.reduce((sum, summary) => {
              const closing = toNumber(summary.closingBalance);
              return closing > 0 ? sum + closing : sum;
            }, 0);

            return (
              <Link key={month.id} href={`/history?month=${month.id}`} className="block">
                <SectionCard className={selected?.id === month.id ? "ring-2 ring-teal-500" : ""}>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Closed</p>
                  <h3 className="mt-3 text-2xl font-black">{month.label}</h3>
                  <div className="mt-5 rounded-[1.35rem] border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs font-bold text-slate-400">Net due</p>
                    <p className="mt-1 text-xl font-black">{formatTaka(netDue)}</p>
                  </div>
                </SectionCard>
              </Link>
            );
          })}
        </div>

        <SectionCard>
          <h3 className="text-xl font-black">{selected ? `${selected.label} snapshot` : "No closed months"}</h3>
          <div className="mt-5 space-y-3">
            {selected?.summaries.map((summary) => {
              const closing = toNumber(summary.closingBalance);
              return (
                <div key={summary.id} className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-slate-100 bg-slate-50/80 p-4 shadow-sm">
                  <div>
                    <p className="font-black">{summary.member.profile.name}</p>
                    <p className="text-xs font-medium text-slate-500">Paid {formatTaka(toNumber(summary.totalContribution))}</p>
                  </div>
                  <div className={`rounded-2xl px-3 py-2 text-right text-sm font-black ${closing > 0 ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}`}>
                    {closing > 0 ? "Due" : "Advance"}<br />{formatTaka(Math.abs(closing))}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
