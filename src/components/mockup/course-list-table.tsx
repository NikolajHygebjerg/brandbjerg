"use client";

import Link from "next/link";
import { formatDate, weekLabel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export type CourseListAccent =
  | "purple"
  | "violet"
  | "amber"
  | "blue"
  | "emerald"
  | "teal";

const accentTitleClasses: Record<CourseListAccent, string> = {
  purple: "text-purple-800 hover:text-purple-950",
  violet: "text-violet-800 hover:text-violet-950",
  amber: "text-amber-800 hover:text-amber-950",
  blue: "text-blue-800 hover:text-blue-950",
  emerald: "text-emerald-800 hover:text-emerald-950",
  teal: "text-teal-800 hover:text-teal-950",
};

const theadRowClass =
  "border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500";

const thClass = "px-4 py-3";
const thWeekClass = "w-24 whitespace-nowrap px-4 py-3";
const rowClass = "border-b border-slate-100 hover:bg-slate-50";
const tdWeekClass =
  "whitespace-nowrap px-4 py-3 font-medium tabular-nums text-slate-600";

type CourseListTableProps = {
  minWidth?: string;
  children: React.ReactNode;
};

export function CourseListTable({ minWidth = "640px", children }: CourseListTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

type CourseListTheadProps = {
  leading?: React.ReactNode;
  trailingHeaders: React.ReactNode;
};

export function CourseListThead({
  leading,
  trailingHeaders,
}: CourseListTheadProps) {
  return (
    <thead>
      <tr className={theadRowClass}>
        {leading}
        <th className={thWeekClass}>Uge</th>
        <th className={thClass}>Kursus</th>
        {trailingHeaders}
      </tr>
    </thead>
  );
}

export function CourseListLeadingHeader() {
  return <th className="w-10 px-2 py-3" />;
}

export function CourseListRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tr className={cn(rowClass, className)}>{children}</tr>;
}

export function CourseListLeadingCell({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-3">{children}</td>;
}

export function CourseListWeekCell({ weekNumber }: { weekNumber: number }) {
  return (
    <td className={tdWeekClass}>{weekLabel(weekNumber)}</td>
  );
}

type CourseListTitleCellProps = {
  title: string;
  href: string;
  accent?: CourseListAccent;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
};

export function CourseListTitleCell({
  title,
  href,
  accent = "emerald",
  subtitle,
  trailing,
}: CourseListTitleCellProps) {
  return (
    <td className="px-4 py-3">
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-2 font-medium hover:underline",
          accentTitleClasses[accent],
        )}
      >
        {title}
        {trailing}
      </Link>
      {subtitle ? (
        <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>
      ) : null}
    </td>
  );
}

export function CourseListDatesCell({
  startDate,
  endDate,
}: {
  startDate?: string | null;
  endDate?: string | null;
}) {
  return (
    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
      {startDate && endDate
        ? `${formatDate(startDate)} – ${formatDate(endDate)}`
        : startDate
          ? formatDate(startDate)
          : "—"}
    </td>
  );
}

export function CourseListEmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
        {children}
      </td>
    </tr>
  );
}

export function CourseListDataCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-4 py-3 text-slate-600", className)}>{children}</td>
  );
}

export function CourseListHeaderCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <th className={cn(thClass, className)}>{children}</th>;
}
