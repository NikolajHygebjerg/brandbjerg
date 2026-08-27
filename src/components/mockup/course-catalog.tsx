"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/mockup/status-badge";
import {
  getAvailableCourseYears,
  getDefaultCourseYear,
  getRegistrationCoursesForYear,
} from "@/lib/course-list";
import { saveActiveYearToStorage } from "@/lib/arshjul-utils";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import { formatDate, formatDKK, statusLabels } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function CourseCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");

  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [years, setYears] = useState<number[]>([statusarkYear]);

  useEffect(() => {
    const available = getAvailableCourseYears();
    setYears(available);
    const parsedYear = yearParam ? parseInt(yearParam, 10) : NaN;
    const initial =
      parsedYear && available.includes(parsedYear)
        ? parsedYear
        : getDefaultCourseYear();
    setActiveYear(initial);
    setHydrated(true);
  }, [yearParam]);

  const courses = useMemo(
    () => (hydrated ? getRegistrationCoursesForYear(activeYear) : []),
    [hydrated, activeYear],
  );

  function selectYear(year: number) {
    setActiveYear(year);
    saveActiveYearToStorage(year);
    router.replace(`/katalog?year=${year}`, { scroll: false });
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-center text-stone-500">Indlæser kursuskatalog…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-stone-900">Korte kurser</h1>
        <p className="mt-2 text-stone-600">
          Udforsk og tilmeld dig vores kommende kurser — kurserne hentes fra
          årshjulet
        </p>
      </div>

      <Card className="mb-8 border-emerald-200 bg-emerald-50/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-emerald-700" />
            <div>
              <CardTitle className="text-base text-emerald-900">
                Tilmeldingsmodul {activeYear}
              </CardTitle>
              <CardDescription className="text-emerald-800">
                {activeYear === statusarkYear
                  ? "Kurser fra godkendt årshjul med live tilmeldinger"
                  : "Kurser fra årshjul-planen for det valgte år"}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => selectYear(y)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  activeYear === y
                    ? "bg-emerald-700 text-white"
                    : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {courses.length === 0 ? (
        <Card className="text-center">
          <CardTitle className="text-lg">Ingen kurser endnu</CardTitle>
          <CardDescription className="mt-2">
            Der er ingen godkendte kurser i årshjulet for {activeYear}. Opret
            eller godkend planen under planlægning.
          </CardDescription>
          <Button href="/planlaegning/arshjul" className="mt-4" variant="secondary">
            Gå til årshjul
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const spotsLeft = course.capacity - course.enrolled;
            const isFull = spotsLeft <= 0;

            return (
              <Link
                key={course.id}
                href={`/katalog/${course.id}?year=${activeYear}`}
              >
                <Card className="h-full transition hover:shadow-md">
                  <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-stone-100 text-sm font-medium text-stone-500">
                    {course.category}
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {course.startDate
                      ? formatDate(course.startDate)
                      : `Uge ${course.weekNumber}`}{" "}
                    · {course.location}
                  </CardDescription>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-800">
                      {formatDKK(course.price)}
                    </span>
                    {course.status === "aaben" ||
                    course.status === "markedsfoeres" ? (
                      <StatusBadge status={course.status} />
                    ) : course.status === "fuldt" ? (
                      <span className="text-xs font-medium text-amber-700">
                        Venteliste
                      </span>
                    ) : (
                      <span className="text-xs text-stone-500">
                        {statusLabels[course.status]}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-stone-500">
                    {spotsLeft > 0
                      ? `${spotsLeft} pladser tilbage`
                      : "Fuldt booket"}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
