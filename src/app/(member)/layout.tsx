import { AppShell } from "@/components/layout/app-shell";
import { requireMembership } from "@/lib/data/ledger";
import { currentMonthLabel } from "@/lib/utils";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const membership = await requireMembership();

  return (
    <AppShell initialMessName={membership.mess.name} initialRole={membership.role} currentLabel={currentMonthLabel()}>
      {children}
    </AppShell>
  );
}
