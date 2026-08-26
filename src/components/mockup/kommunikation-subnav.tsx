"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Megaphone, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/kommunikation", label: "Kurser", icon: Megaphone, exact: true },
  { href: "/kommunikation/analyse", label: "Analyse", icon: BarChart3 },
  { href: "/kommunikation/maal", label: "Mål", icon: Target },
];

export function KommunikationSubnav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border border-purple-200 bg-purple-50/50 p-1">
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
                ? "bg-white text-purple-900 shadow-sm"
                : "text-purple-800 hover:bg-white/60",
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
