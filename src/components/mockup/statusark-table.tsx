"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/mockup/status-badge";
import {
  EnrollmentSparkline,
  EnrollmentTimelinePanel,
} from "@/components/mockup/enrollment-timeline";
import type { StatusarkCourse } from "@/lib/brandbjerg-statusark";
import { statusarkToCourse } from "@/lib/brandbjerg-status";
import {
  netEnrolled,
  overUnderLabel,
  peakEnrollmentWeek,
} from "@/lib/statusark-utils";
import { formatDate, weekLabel } from "@/lib/mock-data";

export function StatusarkTable({ courses }: { courses: StatusarkCourse[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            <th className="w-8 px-2 py-3" />
            <th className="px-3 py-3 font-medium">Kursus</th>
            <th className="px-3 py-3 font-medium">Kursusuge</th>
            <th className="px-3 py-3 font-medium">Dato</th>
            <th className="px-3 py-3 font-medium">Budget</th>
            <th className="px-3 py-3 font-medium">Tilmeldte</th>
            <th className="px-3 py-3 font-medium">Uge-for-uge</th>
            <th className="px-3 py-3 font-medium">Værelser</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium" />
          </tr>
        </thead>
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
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expanded ? null : course.id)
                      }
                      className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                      aria-label={expanded ? "Fold sammen" : "Vis tilmeldinger pr. uge"}
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/planlaegning/kurser/${course.id}`}
                      className="font-medium text-emerald-800 hover:underline"
                    >
                      {course.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {course.type}
                      {course.statusNote && ` · ${course.statusNote}`}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {weekLabel(course.courseWeekNumber)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                    {course.startDate ? formatDate(course.startDate) : "—"}
                  </td>
                  <td className="px-3 py-3">
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
                  <td className="px-3 py-3">
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
                  <td className="px-3 py-3">
                    <EnrollmentSparkline weeks={course.enrollmentByWeek} />
                    {peak && !expanded && (
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        <TrendingUp className="mr-0.5 inline h-3 w-3" />
                        Stærk uge {peak.week}/{peak.year}: +{peak.count}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    {course.rooms.double != null && (
                      <span>D:{course.rooms.double} </span>
                    )}
                    {course.rooms.single != null && (
                      <span>E:{course.rooms.single}</span>
                    )}
                    {course.rooms.double == null &&
                      course.rooms.single == null &&
                      "—"}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={detail.status} />
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/planlaegning/kurser/${course.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                    >
                      Planlæg
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
                {expanded && (
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <td colSpan={10} className="px-6 py-4">
                      <EnrollmentTimelinePanel course={course} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
