import {
  getBudgetAntal,
  getRealiseretAntal,
} from "@/lib/course-enrollment-counts";
import type { Course } from "@/lib/mock-data";
import type { CourseListEntry } from "@/lib/course-list";

type CourseEnrollmentBadgesProps = {
  course: Pick<Course, "id" | "capacity" | "enrolled"> | CourseListEntry;
  compact?: boolean;
};

export function CourseEnrollmentBadges({
  course,
  compact = false,
}: CourseEnrollmentBadgesProps) {
  const budget = getBudgetAntal(course);
  const realiseret = getRealiseretAntal(course);

  if (compact) {
    return (
      <span className="tabular-nums text-slate-700">
        {budget} / {realiseret}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <span className="rounded-lg bg-slate-100 px-3 py-1.5 tabular-nums text-slate-800">
        <span className="text-slate-500">Budget antal </span>
        <span className="font-semibold">{budget}</span>
      </span>
      <span className="rounded-lg bg-emerald-50 px-3 py-1.5 tabular-nums text-emerald-950">
        <span className="text-emerald-700">Realiseret antal </span>
        <span className="font-semibold">{realiseret}</span>
      </span>
    </div>
  );
}
