import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";

const months = ["April 2026", "March 2026", "February 2026"];

export default function HistoryPage() {
  return (
    <AppShell>
      <PageHeading eyebrow="Archive" title="History" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {months.map((month, index) => (
          <SectionCard key={month}>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Closed</p>
            <h3 className="mt-3 text-2xl font-black">{month}</h3>
            <div className="mt-5 rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400">Net due</p>
              <p className="mt-1 text-xl font-black">৳{(index + 1) * 1200}</p>
            </div>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}
