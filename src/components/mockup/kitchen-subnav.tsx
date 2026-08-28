"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/koekken", label: "Dagsplan", icon: CalendarDays, exact: true },
  { href: "/koekken/madplaner", label: "Madplaner", icon: BookOpen },
];

export function KitchenSubnav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border border-amber-200 bg-amber-50/50 p-1">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-white text-amber-950 shadow-sm"
                : "text-amber-900 hover:bg-white/60",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
