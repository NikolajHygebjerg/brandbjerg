"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, GraduationCap } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/context/auth-context";
import {
  getAvailableCourseYears,
  getDefaultCourseYear,
} from "@/lib/course-list";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import { getKursuslederCoursesForUser } from "@/lib/kursusleder-utils";
import {
  countSurveyResponses,
  KURSUSLEDER_SURVEY_UPDATED_EVENT,
} from "@/lib/kursusleder-survey-storage";

export function KursuslederEvalueringList() {
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [years, setYears] = useState<number[]>([statusarkYear]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setYears(getAvailableCourseYears());
    setActiveYear(getDefaultCourseYear());
    setHydrated(true);
  }, []);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KURSUSLEDER_SURVEY_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(KURSUSLEDER_SURVEY_UPDATED_EVENT, refresh);
  }, []);

  const courses = useMemo(() => {
    if (!hydrated || !user) return [];
    return getKursuslederCoursesForUser(user, activeYear).map((c) => ({
      ...c,
      responseCount: countSurveyResponses(c.id),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, activeYear, tick]);

  if (!hydrated || !user) {
    return (
      <Card>
        <CardDescription>Indlæser evalueringer…</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/kursusleder"
          className="text-sm text-teal-700 hover:underline"
        >
          ← Tilbage til kursusleder
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-teal-700" />
          <h1 className="text-2xl font-bold text-slate-900">Evaluering</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Kursusevalueringer baseret på Brandbjerg/Players 1st-skemaet —
          tilret spørgsmål og del link med kursister
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-teal-700" />
            <div>
              <CardTitle className="text-base">Vælg år</CardTitle>
              <CardDescription>Dine kurser med evalueringsmodul</CardDescription>
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
                    ? "bg-teal-700 text-white"
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
        <CourseListTable minWidth="640px">
          <CourseListThead
            trailingHeaders={
              <>
                <CourseListHeaderCell>Datoer</CourseListHeaderCell>
                <CourseListHeaderCell>Svar</CourseListHeaderCell>
              </>
            }
          />
          <tbody>
            {courses.length === 0 ? (
              <CourseListEmptyRow colSpan={4}>
                Ingen kurser fundet for {activeYear}.
              </CourseListEmptyRow>
            ) : (
              courses.map((c) => (
                <CourseListRow key={c.id}>
                  <CourseListWeekCell weekNumber={c.weekNumber} />
                  <CourseListTitleCell
                    title={c.title}
                    href={`/kursusleder/evaluering/${c.id}`}
                    accent="teal"
                  />
                  <CourseListDatesCell
                    startDate={c.startDate}
                    endDate={c.endDate}
                  />
                  <CourseListDataCell>
                    {c.responseCount > 0 ? (
                      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-900">
                        {c.responseCount} svar
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Ingen endnu</span>
                    )}
                  </CourseListDataCell>
                </CourseListRow>
              ))
            )}
          </tbody>
        </CourseListTable>
      </Card>
    </div>
  );
}
