"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  getAvailableCourseYears,
  getDefaultCourseYear,
  getRegistrationCoursesForYear,
} from "@/lib/course-list";
import { saveActiveYearToStorage } from "@/lib/arshjul-utils";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import { formatDate } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function RegistrationModulePanel() {
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [years, setYears] = useState<number[]>([statusarkYear]);

  useEffect(() => {
    setYears(getAvailableCourseYears());
    setActiveYear(getDefaultCourseYear());
    setHydrated(true);
  }, []);

  const courses = useMemo(
    () => (hydrated ? getRegistrationCoursesForYear(activeYear) : []),
    [hydrated, activeYear],
  );

  function selectYear(year: number) {
    setActiveYear(year);
    saveActiveYearToStorage(year);
  }

  if (!hydrated) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardDescription>Indlæser tilmeldingsmodul…</CardDescription>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <CardTitle className="text-blue-900">Tilmeldingsmodul</CardTitle>
          <CardDescription className="text-blue-800">
            Kurser hentes fra årshjulet for det valgte år. Nye tilmeldinger
            skrives til databasen med dato og kalenderuge — årsoversigten
            opdateres automatisk for {statusarkYear}.
          </CardDescription>
        </div>
        <Button
          href={`/katalog?year=${activeYear}`}
          variant="secondary"
          className="shrink-0 gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Åbn tilmeldingsmodul {activeYear}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Calendar className="h-4 w-4 text-blue-700" aria-hidden />
        <span className="text-sm font-medium text-blue-900">Vælg år:</span>
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => selectYear(y)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              activeYear === y
                ? "bg-blue-700 text-white"
                : "bg-white text-blue-900 ring-1 ring-blue-200 hover:bg-blue-100/60",
            )}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-blue-200 bg-white">
        <div className="border-b border-blue-100 bg-blue-50/80 px-4 py-2 text-sm font-medium text-blue-900">
          {courses.length} kurser i {activeYear}
        </div>
        {courses.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">
            Ingen godkendte kurser i årshjulet for {activeYear}. Godkend planen
            under{" "}
            <Link href="/planlaegning/arshjul" className="text-blue-700 underline">
              årshjul
            </Link>
            .
          </p>
        ) : (
          <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
            {courses.map((course) => (
              <li
                key={course.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {course.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    Uge {course.weekNumber}
                    {course.startDate
                      ? ` · ${formatDate(course.startDate)}`
                      : ""}
                    {" · "}
                    {course.capacity - course.enrolled} pladser tilbage
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    href={`/katalog/${course.id}?year=${activeYear}`}
                    variant="ghost"
                    className="h-8 text-xs"
                  >
                    Katalog
                  </Button>
                  <Button
                    href={`/tilmelding/${course.id}?year=${activeYear}`}
                    variant="secondary"
                    className="h-8 text-xs"
                  >
                    Tilmelding
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
