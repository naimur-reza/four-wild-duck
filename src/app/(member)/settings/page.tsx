import { PageHeading } from "@/components/ui/page-heading";
import { SectionCard } from "@/components/ui/section-card";

export default function SettingsPage() {
  return (
    <>
      <PageHeading eyebrow="Setup" title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Mess name</p>
          <input className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white" defaultValue="Mess Khata" />
        </SectionCard>
        <SectionCard>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Default split</p>
          <input className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-500 focus:bg-white" defaultValue="4" />
        </SectionCard>
      </div>
    </>
  );
}
