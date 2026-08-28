"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Home,
  LayoutTemplate,
  Megaphone,
  Network,
  FileSignature,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseChecklistPanel } from "@/components/mockup/course-checklist";
import { useCourseDetailSession } from "@/context/course-detail-session";
import { UserMenu } from "@/components/auth/user-menu";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavEntry =
  | ({ type: "link" } & NavLink)
  | {
      type: "group";
      label: string;
      icon: LucideIcon;
      children: NavLink[];
    };

const nav: NavEntry[] = [
  {
    type: "link",
    href: "/planlaegning/statusark",
    label: "Årsoversigt",
    icon: ClipboardCheck,
  },
  {
    type: "group",
    label: "KK afdelingen",
    icon: Briefcase,
    children: [
      { href: "/planlaegning/arshjul", label: "Årshjul", icon: CalendarDays },
      { href: "/planlaegning/kurser", label: "Kurser", icon: ClipboardList },
      { href: "/skabeloner", label: "Skabeloner", icon: LayoutTemplate },
    ],
  },
  { type: "link", href: "/kursusleder", label: "Kursusleder", icon: GraduationCap },
  {
    type: "link",
    href: "/kursusleder/evaluering",
    label: "Evaluering",
    icon: ClipboardList,
  },
  {
    type: "link",
    href: "/kursusleder/kontrakter",
    label: "Kontrakter",
    icon: FileSignature,
  },
  { type: "link", href: "/koekken", label: "Køkken", icon: UtensilsCrossed },
  { type: "link", href: "/pedel", label: "Pedel og rengøring", icon: Sparkles },
  { type: "link", href: "/kontor", label: "Kontor", icon: Building2 },
  { type: "link", href: "/kommunikation", label: "Kommunikation", icon: Megaphone },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const KK_GROUP_LABEL = "KK afdelingen";

function isKkGroupActive(pathname: string, item: Extract<NavEntry, { type: "group" }>) {
  return item.children.some((child) => isActive(pathname, child.href));
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session } = useCourseDetailSession();
  const kkGroup = nav.find(
    (item): item is Extract<NavEntry, { type: "group" }> =>
      item.type === "group" && item.label === KK_GROUP_LABEL,
  );
  const [kkExpanded, setKkExpanded] = useState(false);

  useEffect(() => {
    if (kkGroup && !isKkGroupActive(pathname, kkGroup)) {
      setKkExpanded(false);
    }
  }, [pathname, kkGroup]);

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
              <p className="text-xs text-slate-500">Brandbjerg</p>
            </div>
          </Link>
        </div>

        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            if (item.type === "link") {
              const active = isActive(pathname, item.href);
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
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            }

            const groupActive = isKkGroupActive(pathname, item);
            const GroupIcon = item.icon;
            const expanded = item.label === KK_GROUP_LABEL ? kkExpanded : true;

            return (
              <div key={item.label} className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (item.label === KK_GROUP_LABEL) {
                      setKkExpanded((open) => !open);
                    }
                  }}
                  aria-expanded={item.label === KK_GROUP_LABEL ? kkExpanded : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
                    groupActive
                      ? "bg-emerald-50 text-emerald-900"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <GroupIcon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.label === KK_GROUP_LABEL && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                        expanded && "rotate-180",
                      )}
                    />
                  )}
                </button>
                {expanded && (
                  <div className="ml-3 space-y-0.5 border-l border-slate-200 pl-3">
                    {item.children.map((child) => {
                      const active = isActive(pathname, child.href);
                      const Icon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-emerald-50 text-emerald-900"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
