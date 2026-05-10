export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[2rem] border border-white bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur md:p-6 ${className}`}>{children}</section>;
}
