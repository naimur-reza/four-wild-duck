"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { authClient } from "@/lib/auth/client";

type MemberSummary = {
  role?: string | null;
  messName?: string | null;
};

type SessionUser = {
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const session = authClient.useSession();
  const sessionUser = session.data?.user as SessionUser | undefined;
  const [memberSummary, setMemberSummary] = useState<MemberSummary | null>(null);
  const role = memberSummary?.role || "MEMBER";
  const messName = memberSummary?.messName || "Mess Khata";
  const displayName = sessionUser?.name || sessionUser?.email?.split("@")[0] || "Member";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    let ignore = false;

    fetch("/api/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { membership?: MemberSummary | null } | null) => {
        if (!ignore) setMemberSummary(data?.membership || null);
      })
      .catch(() => {
        if (!ignore) setMemberSummary(null);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
    window.location.assign("/login");
  }

  return (
    <div className="min-h-screen text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 bg-[linear-gradient(180deg,#07111f_0%,#0b1f26_54%,#0f2d2c_100%)] p-5 shadow-[22px_0_70px_rgba(15,23,42,0.18)] md:block">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.08] p-4 text-white shadow-xl shadow-slate-950/20 backdrop-blur">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-300 to-cyan-200 text-lg font-black text-slate-950 shadow-lg shadow-teal-950/20">M</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-200">Mess</p>
            <h1 className="text-lg font-black">Khata</h1>
          </div>
        </Link>

        <SidebarNav />

        <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-white/10 bg-white/[0.10] p-4 text-white shadow-xl shadow-slate-950/20 backdrop-blur">
          <div className="flex items-center gap-3">
            {sessionUser?.image ? (
              <Image src={sessionUser.image} alt="" width={44} height={44} unoptimized className="h-11 w-11 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-300 text-sm font-black text-slate-950">{avatarInitial}</div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">{displayName}</p>
              {sessionUser?.email ? <p className="truncate text-xs font-semibold text-slate-300">{sessionUser.email}</p> : null}
            </div>
          </div>
          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">{role}</p>
            <p className="mt-1 truncate text-sm font-black text-white">{messName}</p>
          </div>
          <button type="button" onClick={handleSignOut} className="mt-3 text-xs font-black text-rose-200 transition hover:text-white">Sign out</button>
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-40 border-b border-white/80 bg-[#f7fbfa]/[0.78] px-4 py-4 shadow-sm shadow-slate-200/40 backdrop-blur-2xl md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/dashboard" className="md:hidden">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-700">Mess Khata</p>
              <h1 className="text-lg font-black">{messName}</h1>
            </Link>
            <div className="hidden md:block">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-teal-700">{role}</p>
              <h1 className="text-xl font-black">{messName}</h1>
            </div>
            <div className="rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-black text-slate-700 shadow-sm">May 2026</div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-7 pb-28 md:px-8 md:pb-12">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
