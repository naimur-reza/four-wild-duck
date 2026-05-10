export function PageHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <section className="mb-6">
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h2>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
    </section>
  );
}
