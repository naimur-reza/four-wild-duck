"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

function getSafeNextPath(next: string | null) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function LoginCard() {
  const searchParams = useSearchParams();
  const next = getSafeNextPath(searchParams.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleGoogleLogin() {
    setError(null);
    setIsSigningIn(true);

    const { data, error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `/auth/callback?next=${encodeURIComponent(next)}`,
      errorCallbackURL: "/login"
    });

    if (error) {
      setError(error.message || "Google sign-in failed. Please try again.");
      setIsSigningIn(false);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    window.location.href = next;
  }

  return (
    <section className="w-full max-w-md rounded-[2rem] border border-white bg-white/85 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 text-2xl font-black text-teal-300">M</div>
      <div className="mt-6 text-center">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-600">Mess Khata</p>
        <h1 className="mt-2 text-3xl font-black">Welcome back</h1>
      </div>
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isSigningIn}
        className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-teal-600 disabled:cursor-wait disabled:opacity-70"
      >
        <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-950">G</span>
        {isSigningIn ? "Opening Google..." : "Continue with Google"}
      </button>
      {error ? <p className="mt-4 text-center text-sm font-bold text-rose-600">{error}</p> : null}
    </section>
  );
}
