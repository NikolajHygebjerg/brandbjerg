"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/mockup/status-badge";
import {
  EnrollmentSparkline,
  EnrollmentTimelinePanel,
} from "@/components/mockup/enrollment-timeline";
import {
  CourseListDataCell,
  CourseListDatesCell,
  CourseListHeaderCell,
  CourseListLeadingCell,
  CourseListLeadingHeader,
  CourseListRow,
  CourseListTable,
  CourseListThead,
  CourseListTitleCell,
  CourseListWeekCell,
} from "@/components/mockup/course-list-table";
import type { StatusarkCourse } from "@/lib/brandbjerg-statusark";
import { statusarkToCourse } from "@/lib/brandbjerg-status";
import {
  netEnrolled,
  overUnderLabel,
  peakEnrollmentWeek,
} from "@/lib/statusark-utils";

export function StatusarkTable({ courses }: { courses: StatusarkCourse[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <CourseListTable minWidth="960px">
      <CourseListThead
        leading={<CourseListLeadingHeader />}
        trailingHeaders={
          <>
            <CourseListHeaderCell>Dato</CourseListHeaderCell>
            <CourseListHeaderCell>Budget</CourseListHeaderCell>
            <CourseListHeaderCell>Tilmeldte</CourseListHeaderCell>
            <CourseListHeaderCell>Uge-for-uge</CourseListHeaderCell>
            <CourseListHeaderCell>Værelser</CourseListHeaderCell>
            <CourseListHeaderCell>Status</CourseListHeaderCell>
          </>
        }
      />
      <tbody>
        {courses.map((course) => {
          const enrolled = netEnrolled(
            course.totalEnrolled,
            course.paidCancellations,
          );
          const cap = course.maxStudents ?? course.budgetStudents;
          const fillPct =
            cap > 0 ? Math.min(100, Math.round((enrolled / cap) * 100)) : 0;
          const expanded = expandedId === course.id;
          const peak = peakEnrollmentWeek(course.enrollmentByWeek);
          const detail = statusarkToCourse(course);

          return (
            <Fragment key={course.id}>
              <CourseListRow>
                <CourseListLeadingCell>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expanded ? null : course.id)
                    }
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    aria-label={
                      expanded ? "Fold sammen" : "Vis tilmeldinger pr. uge"
                    }
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </CourseListLeadingCell>
                <CourseListWeekCell weekNumber={course.courseWeekNumber} />
                <CourseListTitleCell
                  title={course.title}
                  href={`/planlaegning/kurser/${course.id}`}
                  accent="emerald"
                  subtitle={
                    <>
                      {course.type}
                      {course.statusNote && ` · ${course.statusNote}`}
                    </>
                  }
                />
                <CourseListDatesCell startDate={course.startDate} />
                <td className="px-4 py-3">
                  <span className="font-medium">{course.budgetStudents}</span>
                  {course.overUnderBudget != null &&
                    course.overUnderBudget !== 0 && (
                      <p
                        className={`text-[10px] ${
                          course.overUnderBudget > 0
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {overUnderLabel(course.overUnderBudget)}
                      </p>
                    )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-14 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <span className="whitespace-nowrap">
                      {enrolled}
                      {course.maxStudents != null && `/${course.maxStudents}`}
                    </span>
                  </div>
                  {course.paidCancellations > 0 && (
                    <p className="text-[10px] text-slate-400">
                      {course.paidCancellations} betalende afmeldt
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <EnrollmentSparkline weeks={course.enrollmentByWeek} />
                  {peak && !expanded && (
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      <TrendingUp className="mr-0.5 inline h-3 w-3" />
                      Stærk uge {peak.week}/{peak.year}: +{peak.count}
                    </p>
                  )}
                </td>
                <CourseListDataCell className="text-xs">
                  {course.rooms.double != null && (
                    <span>D:{course.rooms.double} </span>
                  )}
                  {course.rooms.single != null && (
                    <span>E:{course.rooms.single}</span>
                  )}
                  {course.rooms.double == null &&
                    course.rooms.single == null &&
                    "—"}
                </CourseListDataCell>
                <td className="px-4 py-3">
                  <StatusBadge status={detail.status} />
                </td>
              </CourseListRow>
              {expanded && (
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <td colSpan={9} className="px-6 py-4">
                    <EnrollmentTimelinePanel course={course} />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </CourseListTable>
  );
}
