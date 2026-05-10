export function PageHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <section className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-[11px] font-black uppercase tracking-[0.24em] text-teal-600">{eyebrow}</p> : null}
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h2>
      </div>
      {action}
    </section>
  );
}
