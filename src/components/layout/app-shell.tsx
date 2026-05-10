import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { signOut } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth/ensure-profile";
import { getActiveMembership } from "@/lib/auth/mess";

type MessRelation = {
  name?: string | null;
};

type MembershipWithMess = {
  role?: string | null;
  messes?: MessRelation | MessRelation[] | null;
};

function getMessName(membership: MembershipWithMess | null) {
  const messes = membership?.messes;

  if (Array.isArray(messes)) {
    return messes[0]?.name ?? null;
  }

  return messes?.name ?? null;
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const membership = (await getActiveMembership(user.id)) as MembershipWithMess | null;
  const role = membership?.role || "MEMBER";
  const messName = getMessName(membership);

  return (
    <div className="min-h-screen text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/70 bg-white/70 p-5 shadow-[20px_0_60px_rgba(15,23,42,0.04)] backdrop-blur-2xl md:block">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-[1.75rem] bg-gradient-to-br from-slate-950 to-slate-800 p-4 text-white shadow-xl shadow-slate-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-300 to-lime-300 text-lg font-black text-slate-950">M</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-200">Mess</p>
            <h1 className="text-lg font-black">Khata</h1>
          </div>
        </Link>

        <SidebarNav />

        <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{role}</p>
          <p className="mt-1 truncate text-sm font-black text-slate-900">{messName || "No mess"}</p>
          <form action={signOut}>
            <button className="mt-3 text-xs font-black text-rose-600">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-40 border-b border-white/70 bg-[#f6f7fb]/80 px-4 py-4 backdrop-blur-2xl md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/dashboard" className="md:hidden">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600">Mess Khata</p>
              <h1 className="text-lg font-black">{messName || "Dashboard"}</h1>
            </Link>
            <div className="hidden md:block">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-teal-600">{role}</p>
              <h1 className="text-xl font-black">{messName || "Dashboard"}</h1>
            </div>
            <div className="rounded-full border border-white bg-white/80 px-4 py-2 text-xs font-black text-slate-700 shadow-sm">
              May 2026
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-8 md:pb-12">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
