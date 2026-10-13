export function PageHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <section className="mb-4 flex items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div className="min-w-0">
        {eyebrow ? <p className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-700 sm:text-[11px] sm:tracking-[0.24em]">{eyebrow}</p> : null}
        <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950 sm:mt-2 sm:text-5xl">{title}</h2>
      </div>
      <div className="shrink-0">{action}</div>
    </section>
  );
}
