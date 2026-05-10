import { redirect } from "next/navigation";
import { createMess } from "./actions";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { getActiveMembership } from "@/lib/auth/mess";

export default async function SetupMessPage() {
  const user = await ensureProfile();
  const membership = await getActiveMembership(user.id);
  if (membership) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-slate-950">
      <section className="w-full max-w-lg rounded-[2rem] border border-white bg-white/85 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-600">Setup</p>
        <h1 className="mt-2 text-3xl font-black">Create your mess</h1>
        <form action={createMess} className="mt-8 space-y-4">
          <div><label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Mess name</label><input name="name" defaultValue="Four Wild Duck" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-400 focus:bg-white" required /></div>
          <div><label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Your opening balance</label><input name="opening_balance" type="number" defaultValue="0" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-teal-400 focus:bg-white" /><p className="mt-2 text-xs font-medium text-slate-400">Positive = due, negative = advance.</p></div>
          <button className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-teal-600">Create mess</button>
        </form>
      </section>
    </main>
  );
}
