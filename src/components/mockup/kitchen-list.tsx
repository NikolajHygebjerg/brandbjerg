"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  getAvailableCourseYears,
  getCourseDetailById,
  getCoursesForYear,
  getDefaultCourseYear,
} from "@/lib/course-list";
import { formatDate, weekLabel } from "@/lib/mock-data";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import { countKitchenMeals } from "@/lib/kitchen-utils";

export function KitchenList() {
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [years, setYears] = useState<number[]>([statusarkYear]);

  useEffect(() => {
    setYears(getAvailableCourseYears());
    setActiveYear(getDefaultCourseYear());
    setHydrated(true);
  }, []);

  const courses = useMemo(() => {
    if (!hydrated) return [];
    return getCoursesForYear(activeYear)
      .map((entry) => {
        const detail = getCourseDetailById(entry.id);
        const mealCount = detail ? countKitchenMeals(detail) : 0;
        return { ...entry, mealCount };
      })
      .filter((c) => c.mealCount > 0 || activeYear === statusarkYear)
      .sort(
        (a, b) =>
          a.weekNumber - b.weekNumber ||
          a.title.localeCompare(b.title, "da"),
      );
  }, [hydrated, activeYear]);

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
            {courses.filter((c) => c.mealCount > 0).length} kurser med måltider
            i {activeYear}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Uge</th>
                <th className="px-4 py-3">Kursus</th>
                <th className="px-4 py-3">Datoer</th>
                <th className="px-4 py-3">Deltagere</th>
                <th className="px-4 py-3">Måltider</th>
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
                    Ingen kurser fundet. Planlæg måltider under Modulplan på
                    kursussiderne.
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
                      {c.title}
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
                      {c.mealCount > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          {c.mealCount} måltider
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Ingen endnu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/koekken/${c.id}`}
                        className="text-sm font-medium text-amber-700 hover:underline"
                      >
                        Se forplejning →
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
