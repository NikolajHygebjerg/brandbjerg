"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Coins,
  Home,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  Network,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseChecklistPanel } from "@/components/mockup/course-checklist";
import { useCourseDetailSession } from "@/context/course-detail-session";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planlaegning/arshjul", label: "Årshjul", icon: CalendarDays },
  { href: "/planlaegning/statusark", label: "Statusark", icon: ClipboardCheck },
  { href: "/planlaegning/kurser", label: "Kurser", icon: ClipboardList },
  { href: "/skabeloner", label: "Skabeloner", icon: LayoutTemplate },
  { href: "/koekken", label: "Køkken", icon: UtensilsCrossed },
  { href: "/kommunikation", label: "Kommunikation", icon: Megaphone },
  { href: "/tilmeldinger", label: "Tilmeldinger", icon: Users },
  { href: "/afvikling", label: "Afvikling", icon: BarChart3 },
  { href: "/oekonomi", label: "Økonomi / KOMiT", icon: Coins },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session } = useCourseDetailSession();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-200 px-5 py-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">
              KP
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Kursusplatform
              </p>
              <p className="text-xs text-slate-500">Admin mockup</p>
            </div>
          </Link>
        </div>

        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {session ? (
          <div className="flex min-h-0 flex-1 flex-col border-t-2 border-slate-300">
            <div className="flex-1 overflow-y-auto p-3">
              <CourseChecklistPanel
                variant="sidebar"
                course={session.course}
                onUpdateChecklist={session.updateChecklist}
                onMarkProgramDone={session.onMarkProgramDone}
                onGoToModulplan={session.onGoToModulplan}
                mockAccountantView={session.mockAccountantView}
              />
            </div>
            <div className="border-t border-slate-200 px-3 py-2">
              <label className="flex items-center gap-2 text-[11px] text-slate-500">
                <input
                  type="checkbox"
                  checked={session.mockAccountantView}
                  onChange={(e) =>
                    session.setMockAccountantView(e.target.checked)
                  }
                />
                Vis bogholder-knap (mock)
              </label>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="border-t border-slate-200 p-4">
          <Link
            href="/overblik"
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
          >
            <Network className="h-4 w-4" />
            Ledelsesoverblik
          </Link>
          <Link
            href="/katalog"
            className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <Home className="h-4 w-4" />
            Offentligt katalog
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="lg:hidden">
              <p className="text-sm font-semibold text-slate-900">
                Kursusplatform
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 sm:inline">
                Mockup — ikke produktion
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                LH
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
