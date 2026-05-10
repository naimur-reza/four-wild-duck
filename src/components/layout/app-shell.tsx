import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { dashboardNavItems } from "@/lib/constants/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white/80 p-5 backdrop-blur-xl md:block">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-3xl bg-slate-950 p-4 text-white shadow-xl shadow-slate-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-lg font-black text-slate-950">M</div>
          <div>
            <p className="text-sm text-slate-300">Mess Khata</p>
            <h1 className="font-semibold">Family Ledger</h1>
          </div>
        </Link>

        <div className="mt-8 space-y-1">
          {dashboardNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-slate-50/80 px-4 py-4 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/dashboard" className="md:hidden">
              <p className="text-xs font-medium text-emerald-600">Mess Khata</p>
              <h1 className="text-lg font-bold">Dashboard</h1>
            </Link>
            <div className="hidden md:block">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-600">Shared expense tracker</p>
              <h1 className="text-xl font-bold">Mess Khata Dashboard</h1>
            </div>
            <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
              May 2026
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-8 md:pb-10">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
