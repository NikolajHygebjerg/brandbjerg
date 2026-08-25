"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import {
  getAvailableCourseYears,
  getCoursesForYear,
  getDefaultCourseYear,
  type CourseListEntry,
} from "@/lib/course-list";
import { formatDate, weekLabel } from "@/lib/mock-data";
import { statusarkYear } from "@/lib/brandbjerg-statusark";

export function KurserList() {
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [years, setYears] = useState<number[]>([statusarkYear]);

  useEffect(() => {
    setYears(getAvailableCourseYears());
    setActiveYear(getDefaultCourseYear());
    setHydrated(true);
  }, []);

  const courses = useMemo(
    () => (hydrated ? getCoursesForYear(activeYear) : []),
    [hydrated, activeYear],
  );

  if (!hydrated) {
    return (
      <Card>
        <CardDescription>Indlæser kurser…</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-emerald-700" />
            <div>
              <CardTitle className="text-base">Vælg år</CardTitle>
              <CardDescription>
                {activeYear === statusarkYear
                  ? "2026 med live tilmeldinger fra statusark"
                  : "Kurser fra årshjul-planen"}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setActiveYear(y)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeYear === y
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-slate-700">
            {courses.length} kurser i {activeYear}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Kursus</th>
                <th className="px-4 py-3 font-medium">Uge</th>
                <th className="px-4 py-3 font-medium">Dato</th>
                <th className="px-4 py-3 font-medium">Ansvarlig</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Tilmeldte</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Ingen kurser for {activeYear}. Opret et årshjul under{" "}
                    <Link
                      href="/planlaegning/arshjul"
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      årshjul
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <CourseRow key={course.id} course={course} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CourseRow({ course }: { course: CourseListEntry }) {
  const fillPct =
    course.capacity > 0
      ? Math.min(100, Math.round((course.enrolled / course.capacity) * 100))
      : 0;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-3">
        <Link
          href={`/planlaegning/kurser/${course.id}`}
          className="font-medium text-emerald-800 hover:underline"
        >
          {course.title}
        </Link>
        <p className="text-xs text-slate-500">{course.type}</p>
      </td>
      <td className="px-4 py-3 text-slate-600">
        {weekLabel(course.weekNumber)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
        {course.startDate ? formatDate(course.startDate) : "—"}
      </td>
      <td className="px-4 py-3 text-slate-600">{course.responsible}</td>
      <td className="px-4 py-3">{course.budgetStudents}</td>
      <td className="px-4 py-3">
        {course.enrolled > 0 ? (
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <span className="text-xs">
              {course.enrolled}/{course.capacity}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={course.status} />
      </td>
    </tr>
  );
}
