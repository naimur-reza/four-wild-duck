import { SectionCard } from "@/components/ui/section-card";

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`loading-shimmer rounded-full bg-slate-200/80 ${className}`} />;
}

function SkeletonCard() {
  return (
    <SectionCard>
      <SkeletonLine className="h-3 w-20" />
      <SkeletonLine className="mt-4 h-8 w-32" />
      <SkeletonLine className="mt-3 h-3 w-44" />
    </SectionCard>
  );
}

export default function MemberLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="mt-3 h-10 w-48" />
        </div>
        <div className="hidden h-11 w-28 rounded-2xl bg-teal-700/20 md:block" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard className="min-h-48 overflow-hidden bg-[linear-gradient(135deg,#07111f_0%,#123434_62%,#0f766e_100%)]">
          <SkeletonLine className="h-3 w-28 bg-white/20" />
          <SkeletonLine className="mt-5 h-10 w-56 bg-white/25" />
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="loading-shimmer h-16 rounded-2xl bg-white/25" />
            <div className="loading-shimmer h-16 rounded-2xl bg-teal-200/30" />
          </div>
        </SectionCard>
        <SkeletonCard />
      </div>
    </div>
  );
}
