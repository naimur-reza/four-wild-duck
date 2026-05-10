import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/ui/page-heading";

export default function HistoryPage() {
  return (
    <AppShell>
      <PageHeading eyebrow="Previous months" title="History" description="This will show closed month snapshots. The main purpose: never lose old due history again." />
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <p className="text-5xl">📒</p>
        <h3 className="mt-4 text-2xl font-black">No closed month yet</h3>
        <p className="mt-2 text-sm text-slate-500">Once the manager closes a month, the final report will appear here.</p>
      </div>
    </AppShell>
  );
}
