"use client";

import { useEffect, useMemo, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { QuestionCountBadge } from "@/components/mockup/module-questions";
import { KitchenWeekCalendarView } from "@/components/mockup/kitchen-week-calendar-view";
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
import { weekLabel } from "@/lib/mock-data";
import { getKitchenMealsForCourse } from "@/lib/kitchen-utils";
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
import { ISO_WEEKS } from "@/lib/kitchen-week-calendar";

export function KitchenList() {
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [activeWeek, setActiveWeek] = useState(1);
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
          ? getKitchenMealsForCourse(entry.id, merged).length
          : sentRecord?.mealCount ?? 0;
        const openQuestions = countUnansweredQuestions(entry.id, "koekken");
        return { ...entry, mealCount, sent, openQuestions };
      })
      .filter(
        (c) =>
          c.sent ||
          c.mealCount > 0 ||
          (activeYear === statusarkYear && c.startDate),
      )
      .sort(
        (a, b) =>
          a.weekNumber - b.weekNumber ||
          a.title.localeCompare(b.title, "da"),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, activeYear, questionTick, kitchenTick]);

  useEffect(() => {
    const weeksWithCourses = new Set(
      courses.map((c) => c.weekNumber).filter(Boolean),
    );
    if (weeksWithCourses.size === 0) return;
    setActiveWeek((prev) =>
      weeksWithCourses.has(prev) ? prev : Math.min(...weeksWithCourses),
    );
  }, [courses, activeYear]);

  const filteredCourses = courses.filter((c) => c.weekNumber === activeWeek);

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
          Madplan for hele året — kurser med godkendt forplejning vises
          automatisk i den rigtige uge
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-5 w-5 text-amber-700" />
            <div>
              <CardTitle className="text-base">Vælg år</CardTitle>
              <CardDescription>
                {ISO_WEEKS.length} uger pr. år — madplan gemmes pr. uge
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

      <KitchenWeekCalendarView
        year={activeYear}
        courses={courses}
        activeWeek={activeWeek}
        onWeekChange={setActiveWeek}
      />

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            {courses.filter((c) => c.sent).length} kurser modtaget fra kursusledere
            i {activeYear} · {weekLabel(activeWeek)}
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
            {filteredCourses.length === 0 ? (
              <CourseListEmptyRow colSpan={7}>
                Ingen kursusplaner i {weekLabel(activeWeek)} endnu. Når
                kursuslederen godkender forplejning, dukker kurset op i
                madplanen ovenfor.
              </CourseListEmptyRow>
            ) : (
              filteredCourses.map((c) => (
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
                    {c.mealCount > 0 ? (
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
                    ) : c.mealCount > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                        Udkast
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
