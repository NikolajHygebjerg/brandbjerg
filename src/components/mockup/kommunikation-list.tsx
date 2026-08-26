"use client";

import { useEffect, useMemo, useState } from "react";
import { Megaphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KommunikationSubnav } from "@/components/mockup/kommunikation-subnav";
import { WeeklyEffortSuggestionsPanel } from "@/components/mockup/weekly-effort-suggestions-panel";
import {
  CourseListDataCell,
  CourseListDatesCell,
  CourseListHeaderCell,
  CourseListRow,
  CourseListTable,
  CourseListThead,
  CourseListTitleCell,
  CourseListWeekCell,
} from "@/components/mockup/course-list-table";
import {
  getAvailableCourseYears,
  getCoursesForYear,
  getDefaultCourseYear,
} from "@/lib/course-list";
import { getCourseDetailById } from "@/lib/course-list";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import {
  KOMMUNIKATION_UPDATED_EVENT,
} from "@/lib/kommunikation-storage";
import {
  benchmarkPaceStatus,
  expectedEnrollmentToday,
  getBenchmarksForCourse,
  paceStatusClasses,
  resolveKommunikationContext,
} from "@/lib/kommunikation-utils";

export function KommunikationList() {
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [years, setYears] = useState<number[]>([statusarkYear]);
  const [tick, setTick] = useState(0);
  const [showWeeklySuggestions, setShowWeeklySuggestions] = useState(false);

  useEffect(() => {
    setYears(getAvailableCourseYears());
    setActiveYear(getDefaultCourseYear());
    setHydrated(true);
  }, []);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
  }, []);

  const courses = useMemo(() => {
    if (!hydrated) return [];
    return getCoursesForYear(activeYear)
      .map((entry) => {
        const detail = getCourseDetailById(entry.id);
        const ctx = detail
          ? resolveKommunikationContext(entry.id, detail)
          : null;
        const enrolled = ctx?.enrolled ?? entry.enrolled;
        const budget = ctx?.budgetStudents ?? entry.budgetStudents;
        const startDate = ctx?.startDate ?? entry.startDate;
        const benchmarks =
          startDate && budget
            ? getBenchmarksForCourse(entry.id, startDate, budget)
            : [];
        const expected =
          startDate && benchmarks.length > 0
            ? expectedEnrollmentToday(startDate, benchmarks)
            : null;
        const pace =
          expected != null
            ? benchmarkPaceStatus(enrolled, expected)
            : null;
        return {
          ...entry,
          enrolled,
          budget,
          expected,
          pace,
        };
      })
      .sort(
        (a, b) =>
          a.weekNumber - b.weekNumber ||
          a.title.localeCompare(b.title, "da"),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, activeYear, tick]);

  if (!hydrated) {
    return (
      <Card>
        <CardDescription>Indlæser kommunikation…</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kommunikation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tilmeldinger, benchmark og markedsføringsindsatser
        </p>
      </div>

      <KommunikationSubnav />

      <div className="rounded-xl border-2 border-purple-300 bg-gradient-to-r from-purple-600 to-purple-800 p-5 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-white">
            <p className="text-lg font-bold">Hvad skal I fokusere på denne uge?</p>
            <p className="mt-1 text-sm text-purple-100">
              Appen sammenligner tilmeldinger med «burde være», budget og
              erfaringer om timing — og foreslår hvor indsats giver mest mening.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setShowWeeklySuggestions(true)}
            className="shrink-0 border-0 bg-white px-5 py-3 text-base font-bold text-purple-800 shadow-md hover:bg-purple-50"
          >
            <Sparkles className="h-5 w-5" />
            Forslag til indsats denne uge
          </Button>
        </div>
      </div>

      <WeeklyEffortSuggestionsPanel
        year={activeYear}
        open={showWeeklySuggestions}
        onClose={() => setShowWeeklySuggestions(false)}
      />

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="h-5 w-5 text-purple-700" />
            <div>
              <CardTitle className="text-base">Kurser</CardTitle>
              <CardDescription>
                Tilmeldte vs. forventet tempo mod budget
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
                    ? "bg-purple-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="rounded px-1.5 py-0.5 bg-emerald-100 text-emerald-800">
              Grøn
            </span>
            på eller over benchmark
          </span>
          <span className="flex items-center gap-1">
            <span className="rounded px-1.5 py-0.5 bg-amber-100 text-amber-900">
              Orange
            </span>
            mangler ≤ 5
          </span>
          <span className="flex items-center gap-1">
            <span className="rounded px-1.5 py-0.5 bg-red-100 text-red-800">
              Rød
            </span>
            mere end 5 under
          </span>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <CourseListTable minWidth="720px">
          <CourseListThead
            trailingHeaders={
              <>
                <CourseListHeaderCell>Datoer</CourseListHeaderCell>
                <CourseListHeaderCell>Tilmeldte</CourseListHeaderCell>
                <CourseListHeaderCell>Burde være</CourseListHeaderCell>
                <CourseListHeaderCell>Budget</CourseListHeaderCell>
              </>
            }
          />
          <tbody>
            {courses.map((c) => (
              <CourseListRow key={c.id}>
                <CourseListWeekCell weekNumber={c.weekNumber} />
                <CourseListTitleCell
                  title={c.title}
                  href={`/kommunikation/${c.id}`}
                  accent="purple"
                />
                <CourseListDatesCell
                  startDate={c.startDate}
                  endDate={c.endDate}
                />
                <CourseListDataCell className="font-semibold text-slate-900">
                  {c.enrolled}
                </CourseListDataCell>
                <td className="px-4 py-3">
                  {c.expected != null && c.pace ? (
                    <span
                      className={`inline-flex min-w-[2rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${paceStatusClasses[c.pace]}`}
                    >
                      {c.expected}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <CourseListDataCell>{c.budget || "—"}</CourseListDataCell>
              </CourseListRow>
            ))}
          </tbody>
        </CourseListTable>
      </Card>
    </div>
  );
}
