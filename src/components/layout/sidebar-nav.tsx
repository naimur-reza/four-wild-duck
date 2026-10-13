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
                ? "bg-white text-slate-950 shadow-lg shadow-slate-950/20"
                : "text-slate-400 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${active ? "bg-teal-500 text-white" : "bg-white/[0.08] text-slate-400 group-hover:bg-teal-400/[0.15] group-hover:text-teal-200"}`}>
              <Icon className="h-4 w-4" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
