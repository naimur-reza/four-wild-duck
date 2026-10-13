"use client";

import { AuthCallback, NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";

function getSafeNextPath(next: string | null) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/onboarding";
}

export function NeonAuthCallback() {
  const searchParams = useSearchParams();
  const redirectTo = getSafeNextPath(searchParams.get("next"));

  return (
    <NeonAuthUIProvider authClient={authClient}>
      <AuthCallback redirectTo={redirectTo} />
    </NeonAuthUIProvider>
  );
}
