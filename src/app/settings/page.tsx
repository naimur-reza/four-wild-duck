import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeading eyebrow="Setup" title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Mess name</p>
          <input className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-400" defaultValue="Mess Khata" />
        </SectionCard>
        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Default split</p>
          <input className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-400" defaultValue="4" />
        </SectionCard>
      </div>
    </AppShell>
  );
}
