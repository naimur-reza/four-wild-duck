import { Suspense } from "react";
import { NeonAuthCallback } from "./auth-callback";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-950">
      <Suspense>
        <NeonAuthCallback />
      </Suspense>
    </main>
  );
}
