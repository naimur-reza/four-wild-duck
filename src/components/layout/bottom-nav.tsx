"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "@/lib/constants/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const items = dashboardNavItems.slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/80 bg-white/[0.92] px-2 pb-2 pt-2 shadow-[0_-18px_40px_rgba(15,23,42,0.12)] backdrop-blur-2xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-bold transition ${
                active ? "bg-slate-950 text-white shadow-lg shadow-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Icon className={`mb-1 h-4 w-4 ${active ? "text-teal-300" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
