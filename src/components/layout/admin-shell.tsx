"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  CalendarClock,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Home,
  LayoutTemplate,
  Megaphone,
  Menu,
  Network,
  FileSignature,
  Sparkles,
  UtensilsCrossed,
  BedDouble,
  SprayCan,
  Users,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MessagingUnreadBadge } from "@/components/mockup/beskeder-page";
import { CourseChecklistPanel } from "@/components/mockup/course-checklist";
import { useCourseDetailSession } from "@/context/course-detail-session";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuth } from "@/context/auth-context";
import { navEntryVisible } from "@/lib/auth-permissions";
import { hasFullPlatformAccess, userRoleLabels, type UserRole } from "@/lib/auth-types";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[] | "all";
};

type NavEntry =
  | ({ type: "link" } & NavLink)
  | {
      type: "group";
      label: string;
      icon: LucideIcon;
      roles: UserRole[] | "all";
      children: NavLink[];
    };

const nav: NavEntry[] = [
  {
    type: "link",
    href: "/planlaegning/statusark",
    label: "Årsoversigt",
    icon: ClipboardCheck,
    roles: ["admin"],
  },
  {
    type: "group",
    label: "KK afdelingen",
    icon: Briefcase,
    roles: ["admin"],
    children: [
      {
        href: "/planlaegning/arshjul",
        label: "Årshjul",
        icon: CalendarDays,
        roles: ["admin"],
      },
      {
        href: "/planlaegning/kurser",
        label: "Kurser",
        icon: ClipboardList,
        roles: ["admin"],
      },
      {
        href: "/skabeloner",
        label: "Skabeloner",
        icon: LayoutTemplate,
        roles: ["admin"],
      },
    ],
  },
  {
    type: "link",
    href: "/kursusleder",
    label: "Kursusleder",
    icon: GraduationCap,
    roles: ["admin", "kursusleder"],
  },
  {
    type: "link",
    href: "/kursusleder/evaluering",
    label: "Evaluering",
    icon: ClipboardList,
    roles: ["admin", "kursusleder"],
  },
  {
    type: "link",
    href: "/kursusleder/kontrakter",
    label: "Kontrakter",
    icon: FileSignature,
    roles: ["admin", "kursusleder"],
  },
  {
    type: "link",
    href: "/koekken",
    label: "Køkken",
    icon: UtensilsCrossed,
    roles: ["admin", "koekkenleder", "koekkenassistent"],
  },
  {
    type: "link",
    href: "/pedel",
    label: "Pedel",
    icon: Sparkles,
    roles: ["admin", "pedelleder", "pedelassistent"],
  },
  {
    type: "link",
    href: "/rengoring",
    label: "Rengøring",
    icon: SprayCan,
    roles: [
      "admin",
      "rengoringsleder",
      "rengoringsassistent",
    ],
  },
  {
    type: "link",
    href: "/vaerelsesbooking",
    label: "Book et værelse",
    icon: BedDouble,
    roles: "all",
  },
  {
    type: "link",
    href: "/kontor",
    label: "Kontor",
    icon: Building2,
    roles: ["admin", "kontor"],
  },
  {
    type: "link",
    href: "/kommunikation",
    label: "Kommunikation",
    icon: Megaphone,
    roles: ["admin"],
  },
  {
    type: "link",
    href: "/vagtplanlaegning",
    label: "Vagtplanlægning",
    icon: CalendarClock,
    roles: ["admin", "koekkenleder", "rengoringsleder"],
  },
  {
    type: "link",
    href: "/beskeder",
    label: "Beskeder",
    icon: Mail,
    roles: "all",
  },
  {
    type: "link",
    href: "/brugere",
    label: "Brugere",
    icon: Users,
    roles: ["admin"],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const KK_GROUP_LABEL = "KK afdelingen";

function isKkGroupActive(pathname: string, item: Extract<NavEntry, { type: "group" }>) {
  return item.children.some((child) => isActive(pathname, child.href));
}

function filterNav(entries: NavEntry[], role: UserRole): NavEntry[] {
  return entries
    .filter((item) => navEntryVisible(item.roles, role))
    .map((item) => {
      if (item.type === "group") {
        const children = item.children.filter((c) =>
          navEntryVisible(c.roles, role),
        );
        if (children.length === 0) return null;
        return { ...item, children };
      }
      return item;
    })
    .filter((item): item is NavEntry => item !== null);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? "kursist";
  const visibleNav = useMemo(() => filterNav(nav, role), [role]);
  const { session } = useCourseDetailSession();
  const kkGroup = visibleNav.find(
    (item): item is Extract<NavEntry, { type: "group" }> =>
      item.type === "group" && item.label === KK_GROUP_LABEL,
  );
  const [kkExpanded, setKkExpanded] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const showCommonFooter = role !== "hojskolelaerer";
  const showOverblik =
    hasFullPlatformAccess(role) ||
    [
      "kursusleder",
      "koekkenleder",
      "koekkenassistent",
      "rengoringsleder",
      "rengoringsassistent",
      "pedelleder",
      "pedelassistent",
      "kontor",
    ].includes(role);

  useEffect(() => {
    if (kkGroup && !isKkGroupActive(pathname, kkGroup)) {
      setKkExpanded(false);
    }
  }, [pathname, kkGroup]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const navContent = (
    <>
      <nav className="space-y-1 p-3">
        {visibleNav.map((item) => (
          <NavItem
            key={item.type === "link" ? item.href : item.label}
            item={item}
            pathname={pathname}
            kkExpanded={kkExpanded}
            onToggleKk={() => setKkExpanded((open) => !open)}
            onNavigate={() => setMobileNavOpen(false)}
          />
        ))}
      </nav>

      {session && hasFullPlatformAccess(role) ? (
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

      {showCommonFooter && (
        <div className="border-t border-slate-200 p-4">
          {showOverblik && (
            <Link
              href="/overblik"
              onClick={() => setMobileNavOpen(false)}
              className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
            >
              <Network className="h-4 w-4" />
              Ledelsesoverblik
            </Link>
          )}
          <Link
            href="/katalog"
            onClick={() => setMobileNavOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100",
              showOverblik ? "mt-2" : "",
            )}
          >
            <Home className="h-4 w-4" />
            Offentligt katalog
          </Link>
        </div>
      )}
    </>
  );

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
              {user && (
                <p className="text-xs font-medium text-emerald-700">
                  {userRoleLabels[user.role]}
                </p>
              )}
            </div>
          </Link>
        </div>

        {navContent}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Luk menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Menu</p>
                {user && (
                  <p className="text-xs text-emerald-700">
                    {userRoleLabels[user.role]}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Luk
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {navContent}
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
                aria-label="Åbn menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Kursusplatform
                </p>
                {user && (
                  <p className="text-xs text-slate-500">
                    {userRoleLabels[user.role]}
                  </p>
                )}
              </div>
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

function NavItem({
  item,
  pathname,
  kkExpanded,
  onToggleKk,
  onNavigate,
}: {
  item: NavEntry;
  pathname: string;
  kkExpanded: boolean;
  onToggleKk: () => void;
  onNavigate: () => void;
}) {
  const { user } = useAuth();

  if (item.type === "link") {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-emerald-50 text-emerald-900"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.href === "/beskeder" && user && (
          <MessagingUnreadBadge userId={user.id} role={user.role} />
        )}
      </Link>
    );
  }

  const groupActive = isKkGroupActive(pathname, item);
  const GroupIcon = item.icon;
  const expanded = item.label === KK_GROUP_LABEL ? kkExpanded : true;

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={() => {
          if (item.label === KK_GROUP_LABEL) {
            onToggleKk();
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
                onClick={onNavigate}
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
}
