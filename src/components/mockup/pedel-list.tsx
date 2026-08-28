"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { hasFullPlatformAccess } from "@/lib/auth-types";
import { QuestionCountBadge } from "@/components/mockup/module-questions";
import { PedelNotificationsInbox } from "@/components/mockup/pedel-notifications-inbox";
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
} from "@/lib/course-list";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import { getIsoWeekForDate } from "@/lib/kitchen-active-meal";
import { getIsoWeekDays } from "@/lib/kitchen-week-calendar";
import { weekLabel } from "@/lib/mock-data";
import {
  countUnansweredQuestions,
  QUESTIONS_UPDATED_EVENT,
} from "@/lib/module-questions-storage";
import { countPedelLokaler } from "@/lib/pedel-utils";
import { PedelEvaluationHistory } from "@/components/mockup/pedel-evaluation-history";
import {
  getBudgetAntal,
  getRealiseretAntal,
} from "@/lib/course-enrollment-counts";

export function PedelList() {
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [activeWeek, setActiveWeek] = useState(1);
  const [years, setYears] = useState<number[]>([statusarkYear]);
  const [questionTick, setQuestionTick] = useState(0);

  const currentIsoWeek = useMemo(
    () => getIsoWeekForDate(new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hydrated],
  );

  useEffect(() => {
    const { year, weekNumber } = getIsoWeekForDate(new Date());
    setYears(getAvailableCourseYears());
    setActiveYear(year);
    setActiveWeek(weekNumber);
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

  const filteredCourses = courses.filter((c) => c.weekNumber === activeWeek);

  const isCurrentWeek =
    activeYear === currentIsoWeek.year &&
    activeWeek === currentIsoWeek.weekNumber;

  const shiftWeek = useCallback((deltaWeeks: number) => {
    const days = getIsoWeekDays(activeYear, activeWeek);
    const anchor = new Date(`${days[0].date}T12:00:00Z`);
    anchor.setUTCDate(anchor.getUTCDate() + deltaWeeks * 7);
    const { year, weekNumber } = getIsoWeekForDate(anchor);
    setActiveYear(year);
    setActiveWeek(weekNumber);
  }, [activeYear, activeWeek]);

  const goToCurrentWeek = useCallback(() => {
    const { year, weekNumber } = getIsoWeekForDate(new Date());
    setActiveYear(year);
    setActiveWeek(weekNumber);
  }, []);

  const showRengoringInbox =
    user &&
    (hasFullPlatformAccess(user.role) ||
      user.role === "pedelleder" ||
      user.role === "pedelassistent");

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
        <h1 className="text-2xl font-bold text-slate-900">Pedel</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lokalespecifikationer fra kursusprogrammer — som i Pedel-arket
        </p>
      </div>

      {showRengoringInbox && <PedelNotificationsInbox />}

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-blue-700" />
              <div>
                <CardTitle className="text-base">
                  {weekLabel(activeWeek)} · {activeYear}
                </CardTitle>
                <CardDescription>
                  Kurser med lokaleopsætning i den valgte uge
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => shiftWeek(-1)}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
                Forrige uge
              </button>
              <Button
                type="button"
                onClick={() => shiftWeek(1)}
                className="bg-blue-700 hover:bg-blue-800"
              >
                Næste uge
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isCurrentWeek && (
                <button
                  type="button"
                  onClick={goToCurrentWeek}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-800 underline-offset-2 transition hover:underline"
                >
                  Denne uge
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              År
            </span>
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
            {filteredCourses.filter((c) => c.lokaleCount > 0).length} kurser med
            lokaler i {weekLabel(activeWeek)} · {activeYear}
          </p>
        </div>
        <CourseListTable minWidth="640px">
          <CourseListThead
            trailingHeaders={
              <>
                <CourseListHeaderCell>Datoer</CourseListHeaderCell>
                <CourseListHeaderCell>Budget antal</CourseListHeaderCell>
                <CourseListHeaderCell>Realiseret antal</CourseListHeaderCell>
                <CourseListHeaderCell>Lokaler</CourseListHeaderCell>
              </>
            }
          />
          <tbody>
            {filteredCourses.length === 0 ? (
              <CourseListEmptyRow colSpan={6}>
                Ingen kurser i {weekLabel(activeWeek)} endnu. Udfyld
                lokalespecifikation under Modulplan, eller gå til en anden uge.
              </CourseListEmptyRow>
            ) : (
              filteredCourses.map((c) => (
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
                    {getBudgetAntal(c)}
                  </CourseListDataCell>
                  <CourseListDataCell>
                    {getRealiseretAntal(c)}
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

      <PedelEvaluationHistory />
    </div>
  );
}
