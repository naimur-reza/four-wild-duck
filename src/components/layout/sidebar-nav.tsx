"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "@/lib/constants/navigation";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="mt-8 space-y-1.5">
      {dashboardNavItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              active
                ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                : "text-slate-500 hover:bg-white hover:text-slate-950 hover:shadow-sm"
            }`}
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${active ? "bg-teal-400 text-slate-950" : "bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-700"}`}>
              <Icon className="h-4 w-4" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
