"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Megaphone } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  getAvailableCourseYears,
  getCoursesForYear,
  getDefaultCourseYear,
} from "@/lib/course-list";
import { getCourseDetailById } from "@/lib/course-list";
import { formatDate, weekLabel } from "@/lib/mock-data";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kommunikation</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tilmeldinger, benchmark og markedsføringsindsatser
          </p>
        </div>
        <Link
          href="/kommunikation/analyse"
          className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-800"
        >
          <BarChart3 className="h-4 w-4" />
          Samlet analyse
        </Link>
      </div>

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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Uge</th>
                <th className="px-4 py-3">Kursus</th>
                <th className="px-4 py-3">Datoer</th>
                <th className="px-4 py-3">Tilmeldte</th>
                <th className="px-4 py-3">Burde være</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {weekLabel(c.weekNumber)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {c.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.startDate && c.endDate
                      ? `${formatDate(c.startDate)} – ${formatDate(c.endDate)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {c.enrolled}
                  </td>
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
                  <td className="px-4 py-3 text-slate-600">{c.budget || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/kommunikation/${c.id}`}
                      className="text-sm font-medium text-purple-700 hover:underline"
                    >
                      Markedsføring →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
