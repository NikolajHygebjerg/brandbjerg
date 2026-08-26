"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { QuestionCountBadge } from "@/components/mockup/module-questions";
import { StatusBadge } from "@/components/mockup/status-badge";
import {
  CourseListDataCell,
  CourseListDatesCell,
  CourseListEmptyRow,
  CourseListHeaderCell,
  CourseListRow,
  CourseListTable,
  CourseListThead,
  CourseListTitleCell,
  CourseListWeekCell,
} from "@/components/mockup/course-list-table";
import { getBudgetAntal, getRealiseretAntal } from "@/lib/course-enrollment-counts";
import {
  getAvailableCourseYears,
  getCoursesForYear,
  getDefaultCourseYear,
  type CourseListEntry,
} from "@/lib/course-list";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import {
  countUnansweredQuestions,
  QUESTIONS_UPDATED_EVENT,
} from "@/lib/module-questions-storage";

export function KurserList() {
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [years, setYears] = useState<number[]>([statusarkYear]);

  const [questionTick, setQuestionTick] = useState(0);

  useEffect(() => {
    setYears(getAvailableCourseYears());
    setActiveYear(getDefaultCourseYear());
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onUpdate() {
      setQuestionTick((t) => t + 1);
    }
    window.addEventListener(QUESTIONS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(QUESTIONS_UPDATED_EVENT, onUpdate);
  }, []);

  const courses = useMemo(
    () => (hydrated ? getCoursesForYear(activeYear) : []),
    [hydrated, activeYear, questionTick],
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
        <CourseListTable>
          <CourseListThead
            trailingHeaders={
              <>
                <CourseListHeaderCell>Dato</CourseListHeaderCell>
                <CourseListHeaderCell>Ansvarlig</CourseListHeaderCell>
                <CourseListHeaderCell>Budget antal</CourseListHeaderCell>
                <CourseListHeaderCell>Realiseret antal</CourseListHeaderCell>
                <CourseListHeaderCell>Status</CourseListHeaderCell>
              </>
            }
          />
          <tbody>
            {courses.length === 0 ? (
              <CourseListEmptyRow colSpan={7}>
                Ingen kurser for {activeYear}. Opret et årshjul under{" "}
                <Link
                  href="/planlaegning/arshjul"
                  className="font-medium text-emerald-700 hover:underline"
                >
                  årshjul
                </Link>
                .
              </CourseListEmptyRow>
            ) : (
              courses.map((course) => (
                <CourseRow key={course.id} course={course} />
              ))
            )}
          </tbody>
        </CourseListTable>
      </Card>
    </div>
  );
}

function CourseRow({ course }: { course: CourseListEntry }) {
  const budget = getBudgetAntal(course);
  const realiseret = getRealiseretAntal(course);
  const fillPct =
    budget > 0 ? Math.min(100, Math.round((realiseret / budget) * 100)) : 0;
  const openQuestions = countUnansweredQuestions(course.id);

  return (
    <CourseListRow>
      <CourseListWeekCell weekNumber={course.weekNumber} />
      <CourseListTitleCell
        title={course.title}
        href={`/planlaegning/kurser/${course.id}`}
        accent="emerald"
        subtitle={course.type}
        trailing={<QuestionCountBadge count={openQuestions} />}
      />
      <CourseListDatesCell startDate={course.startDate} />
      <CourseListDataCell>{course.responsible}</CourseListDataCell>
      <CourseListDataCell>{budget}</CourseListDataCell>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {budget > 0 && (
            <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          )}
          <span className="text-xs font-medium tabular-nums text-slate-900">
            {realiseret}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={course.status} />
      </td>
    </CourseListRow>
  );
}
