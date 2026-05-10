import { AppShell } from "@/components/layout/app-shell";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
