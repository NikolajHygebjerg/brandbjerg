"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { QuestionCountBadge } from "@/components/mockup/module-questions";
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
import {
  getAvailableCourseYears,
  getCourseDetailById,
  getCoursesForYear,
  getDefaultCourseYear,
} from "@/lib/course-list";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import {
  countUnansweredQuestions,
  QUESTIONS_UPDATED_EVENT,
} from "@/lib/module-questions-storage";
import { countPedelLokaler } from "@/lib/pedel-utils";

export function PedelList() {
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

  const courses = useMemo(() => {
    if (!hydrated) return [];
    return getCoursesForYear(activeYear)
      .map((entry) => {
        const detail = getCourseDetailById(entry.id);
        const lokaleCount = detail ? countPedelLokaler(detail) : 0;
        const openQuestions = countUnansweredQuestions(entry.id, "pedel");
        return { ...entry, lokaleCount, openQuestions };
      })
      .filter((c) => c.lokaleCount > 0 || activeYear === statusarkYear)
      .sort(
        (a, b) =>
          a.weekNumber - b.weekNumber ||
          a.title.localeCompare(b.title, "da"),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, activeYear, questionTick]);

  if (!hydrated) {
    return (
      <Card>
        <CardDescription>Indlæser pedeloversigt…</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Pedel og rengøring
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Lokalespecifikationer fra kursusprogrammer — som i Pedel-arket
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-700" />
            <div>
              <CardTitle className="text-base">Vælg uge / år</CardTitle>
              <CardDescription>
                Kurser med lokaleopsætning vises her
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
                    ? "bg-blue-700 text-white"
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
        <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            {courses.filter((c) => c.lokaleCount > 0).length} kurser med
            lokaler i {activeYear}
          </p>
        </div>
        <CourseListTable minWidth="640px">
          <CourseListThead
            trailingHeaders={
              <>
                <CourseListHeaderCell>Datoer</CourseListHeaderCell>
                <CourseListHeaderCell>Deltagere</CourseListHeaderCell>
                <CourseListHeaderCell>Lokaler</CourseListHeaderCell>
              </>
            }
          />
          <tbody>
            {courses.length === 0 ? (
              <CourseListEmptyRow colSpan={5}>
                Ingen kurser fundet. Udfyld lokalespecifikation under
                Modulplan.
              </CourseListEmptyRow>
            ) : (
              courses.map((c) => (
                <CourseListRow key={c.id}>
                  <CourseListWeekCell weekNumber={c.weekNumber} />
                  <CourseListTitleCell
                    title={c.title}
                    href={`/pedel/${c.id}`}
                    accent="blue"
                    trailing={<QuestionCountBadge count={c.openQuestions} />}
                  />
                  <CourseListDatesCell
                    startDate={c.startDate}
                    endDate={c.endDate}
                  />
                  <CourseListDataCell>
                    {c.enrolled > 0 ? c.enrolled : c.budgetStudents}
                  </CourseListDataCell>
                  <td className="px-4 py-3">
                    {c.lokaleCount > 0 ? (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {c.lokaleCount} lokale-dage
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Ingen endnu
                      </span>
                    )}
                  </td>
                </CourseListRow>
              ))
            )}
          </tbody>
        </CourseListTable>
      </Card>
    </div>
  );
}
