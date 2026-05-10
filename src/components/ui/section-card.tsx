export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.15rem] border border-white/80 bg-white/[0.9] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.03] backdrop-blur sm:rounded-[1.5rem] md:p-6 md:shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${className}`}>{children}</section>;
}
