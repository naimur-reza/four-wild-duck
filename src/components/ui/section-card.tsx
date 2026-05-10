export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.5rem] border border-white/80 bg-white/[0.88] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] backdrop-blur md:p-6 ${className}`}>{children}</section>;
}
