import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth/server";
import { LoginCard } from "./login-card";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = params?.next && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/onboarding";
  const { data } = await auth.getSession();
  if (data?.user) redirect(next);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-950">
      <Suspense>
        <LoginCard />
      </Suspense>
    </main>
  );
}
