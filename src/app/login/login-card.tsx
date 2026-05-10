"use client";

import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginCard() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/onboarding";

  async function handleGoogleLogin() {
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` } });
  }

  return (
    <section className="w-full max-w-md rounded-[2rem] border border-white bg-white/85 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 text-2xl font-black text-teal-300">M</div>
      <div className="mt-6 text-center"><p className="text-xs font-black uppercase tracking-[0.24em] text-teal-600">Mess Khata</p><h1 className="mt-2 text-3xl font-black">Welcome back</h1></div>
      <button onClick={handleGoogleLogin} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-teal-600"><span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-950">G</span>Continue with Google</button>
    </section>
  );
}
