"use client";

import { useEffect, useMemo, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
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
import { countKitchenMeals } from "@/lib/kitchen-utils";
import {
  KITCHEN_UPDATED_EVENT,
  loadKitchenSent,
} from "@/lib/kitchen-storage";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import {
  countUnansweredQuestions,
  QUESTIONS_UPDATED_EVENT,
} from "@/lib/module-questions-storage";
import {
  getBudgetAntal,
  getRealiseretAntal,
} from "@/lib/course-enrollment-counts";

export function KitchenList() {
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [years, setYears] = useState<number[]>([statusarkYear]);

  const [questionTick, setQuestionTick] = useState(0);
  const [kitchenTick, setKitchenTick] = useState(0);

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

  useEffect(() => {
    function onKitchenUpdate() {
      setKitchenTick((t) => t + 1);
    }
    window.addEventListener(KITCHEN_UPDATED_EVENT, onKitchenUpdate);
    return () => window.removeEventListener(KITCHEN_UPDATED_EVENT, onKitchenUpdate);
  }, []);

  const courses = useMemo(() => {
    if (!hydrated) return [];
    return getCoursesForYear(activeYear)
      .map((entry) => {
        const detail = getCourseDetailById(entry.id);
        const merged = detail ? mergeCoursePlan(detail) : null;
        const sentRecord = loadKitchenSent(entry.id);
        const sent = Boolean(sentRecord);
        const mealCount = merged
          ? countKitchenMeals(merged)
          : sentRecord?.mealCount ?? 0;
        const openQuestions = countUnansweredQuestions(entry.id, "koekken");
        return { ...entry, mealCount, sent, openQuestions };
      })
      .filter((c) => c.sent || c.mealCount > 0)
      .sort(
        (a, b) =>
          a.weekNumber - b.weekNumber ||
          a.title.localeCompare(b.title, "da"),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, activeYear, questionTick, kitchenTick]);

  if (!hydrated) {
    return (
      <Card>
        <CardDescription>Indlæser køkkenoversigt…</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Køkken</h1>
        <p className="mt-1 text-sm text-slate-500">
          Forplejning og måltider fra kursusprogrammer — som i praktisk seddel
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-5 w-5 text-amber-700" />
            <div>
              <CardTitle className="text-base">Vælg uge / år</CardTitle>
              <CardDescription>
                Kurser med planlagte måltider vises her
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
                    ? "bg-amber-600 text-white"
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
        <div className="border-b border-slate-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            {courses.filter((c) => c.sent).length} kurser modtaget fra kursusledere
            i {activeYear}
          </p>
        </div>
        <CourseListTable minWidth="640px">
          <CourseListThead
            trailingHeaders={
              <>
                <CourseListHeaderCell>Datoer</CourseListHeaderCell>
                <CourseListHeaderCell>Budget antal</CourseListHeaderCell>
                <CourseListHeaderCell>Realiseret antal</CourseListHeaderCell>
                <CourseListHeaderCell>Måltider</CourseListHeaderCell>
                <CourseListHeaderCell>Status</CourseListHeaderCell>
              </>
            }
          />
          <tbody>
            {courses.length === 0 ? (
              <CourseListEmptyRow colSpan={7}>
                Ingen køkkenplaner modtaget endnu. Kursuslederen godkender
                måltidsmoduler i modulplanen — derefter sendes planen
                automatisk hertil.
              </CourseListEmptyRow>
            ) : (
              courses.map((c) => (
                <CourseListRow key={c.id}>
                  <CourseListWeekCell weekNumber={c.weekNumber} />
                  <CourseListTitleCell
                    title={c.title}
                    href={`/koekken/${c.id}`}
                    accent="amber"
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
                    {c.sent ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {c.mealCount} måltider
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.sent ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        Modtaget
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        Afventer godkendelse
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
