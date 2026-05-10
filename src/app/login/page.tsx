import { redirect } from "next/navigation";
import { SignIn } from "@stackframe/stack";
import { stackServerApp } from "@/lib/auth/stack";

export default async function LoginPage() {
  const user = await stackServerApp.getUser();
  if (user) redirect("/onboarding");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-[2rem] border border-white bg-white/85 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 text-2xl font-black text-teal-300">M</div>
        <div className="mt-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-600">Mess Khata</p>
          <h1 className="mt-2 text-3xl font-black">Sign in</h1>
        </div>
        <div className="mt-8">
          <SignIn />
        </div>
      </section>
    </main>
  );
}
