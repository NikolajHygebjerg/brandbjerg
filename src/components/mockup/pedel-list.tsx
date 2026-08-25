"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { QuestionCountBadge } from "@/components/mockup/module-questions";
import {
  getAvailableCourseYears,
  getCourseDetailById,
  getCoursesForYear,
  getDefaultCourseYear,
} from "@/lib/course-list";
import { formatDate, weekLabel } from "@/lib/mock-data";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import {
  countUnansweredQuestions,
  QUESTIONS_UPDATED_EVENT,
} from "@/lib/module-questions-storage";
import { countPedelModules } from "@/lib/pedel-utils";

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
        const moduleCount = detail ? countPedelModules(detail) : 0;
        const openQuestions = countUnansweredQuestions(entry.id, "pedel");
        return { ...entry, moduleCount, openQuestions };
      })
      .filter((c) => c.moduleCount > 0 || activeYear === statusarkYear)
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
            {courses.filter((c) => c.moduleCount > 0).length} kurser med
            lokaler i {activeYear}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Uge</th>
                <th className="px-4 py-3">Kursus</th>
                <th className="px-4 py-3">Datoer</th>
                <th className="px-4 py-3">Deltagere</th>
                <th className="px-4 py-3">Lokaler</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Ingen kurser fundet. Udfyld lokalespecifikation under
                    Modulplan.
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {weekLabel(c.weekNumber)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <span className="inline-flex items-center gap-2">
                        {c.title}
                        <QuestionCountBadge count={c.openQuestions} />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.startDate && c.endDate
                        ? `${formatDate(c.startDate)} – ${formatDate(c.endDate)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.enrolled > 0 ? c.enrolled : c.budgetStudents}
                    </td>
                    <td className="px-4 py-3">
                      {c.moduleCount > 0 ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {c.moduleCount} moduler
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Ingen endnu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/pedel/${c.id}`}
                        className="text-sm font-medium text-blue-700 hover:underline"
                      >
                        Se lokaler →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
