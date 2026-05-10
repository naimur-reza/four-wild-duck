"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ExpenseCategory } from "@/generated/prisma/client";

type Option = {
  id: string;
  label: string;
};

type ExpenseFiltersProps = {
  months: Option[];
  members: Option[];
  categories: ExpenseCategory[];
  defaultValues: {
    month: string;
    member?: string;
    category?: string;
    from?: string;
    to?: string;
  };
};

export function ExpenseFilters({ months, members, categories, defaultValues }: ExpenseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function applyFilter(formData: FormData) {
    const params = new URLSearchParams();

    for (const key of ["month", "member", "category", "from", "to"]) {
      const value = String(formData.get(key) || "").trim();
      if (value) params.set(key, value);
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <form action={applyFilter} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      <select name="month" defaultValue={defaultValues.month} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-teal-500">
        {months.map((month) => <option key={month.id} value={month.id}>{month.label}</option>)}
      </select>
      <select name="member" defaultValue={defaultValues.member || ""} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-teal-500">
        <option value="">All members</option>
        {members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
      </select>
      <select name="category" defaultValue={defaultValues.category || ""} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-teal-500">
        <option value="">All types</option>
        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
      </select>
      <input name="from" type="date" defaultValue={defaultValues.from || ""} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-teal-500" />
      <div className="grid grid-cols-[1fr_auto] gap-2 sm:col-span-2 xl:col-span-2">
        <input name="to" type="date" defaultValue={defaultValues.to || ""} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-black outline-none transition focus:border-teal-500" />
        <button className="h-11 rounded-2xl bg-slate-950 px-5 text-xs font-black text-white shadow-lg shadow-slate-200 transition hover:bg-teal-700 disabled:opacity-60" disabled={isPending}>
          {isPending ? "Filtering..." : "Filter"}
        </button>
      </div>
    </form>
  );
}
