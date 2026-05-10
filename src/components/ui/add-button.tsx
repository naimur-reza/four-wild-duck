export function AddButton({ children = "Add" }: { children?: React.ReactNode }) {
  return <button className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-xl shadow-teal-100 transition hover:-translate-y-0.5 hover:bg-slate-950">{children}</button>;
}
