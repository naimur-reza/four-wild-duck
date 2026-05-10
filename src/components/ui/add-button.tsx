export function AddButton({ children = "Add" }: { children?: React.ReactNode }) {
  return <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-teal-600">{children}</button>;
}
