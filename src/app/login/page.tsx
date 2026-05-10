import { Suspense } from "react";
import { LoginCard } from "./login-card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-950">
      <Suspense fallback={null}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
