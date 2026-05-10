import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/ui/page-heading";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeading eyebrow="Control panel" title="Settings" description="Later: mess name, default member count, currency, month close permissions, and Supabase auth." />
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-slate-500">Default split</p>
        <p className="mt-2 text-3xl font-black">4 members</p>
        <p className="mt-2 text-sm text-slate-500">Current MVP assumes 4 active members. We’ll make this dynamic next.</p>
      </div>
    </AppShell>
  );
}
