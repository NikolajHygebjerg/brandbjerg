"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import { getCourseDetailById } from "@/lib/course-list";
import { formatDate, formatDKK, type Course } from "@/lib/mock-data";

type CourseCatalogDetailProps = {
  courseId: string;
};

export function CourseCatalogDetail({ courseId }: CourseCatalogDetailProps) {
  const searchParams = useSearchParams();
  const year = searchParams.get("year");
  const backHref = year ? `/katalog?year=${year}` : "/katalog";

  const [course, setCourse] = useState<Course | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const found = getCourseDetailById(courseId);
    if (!found || found.status === "udkast") {
      setMissing(true);
      setCourse(null);
      return;
    }
    setCourse(found);
    setMissing(false);
  }, [courseId]);

  if (missing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center">
        <h1 className="text-xl font-semibold text-stone-900">Kursus ikke fundet</h1>
        <Link href={backHref} className="mt-4 inline-block text-emerald-800 hover:underline">
          ← Tilbage til katalog
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center text-stone-500">
        Indlæser kursus…
      </div>
    );
  }

  const spotsLeft = course.capacity - course.enrolled;
  const isFull = spotsLeft <= 0;
  const tilmeldingHref = year
    ? `/tilmelding/${courseId}?year=${year}`
    : `/tilmelding/${courseId}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href={backHref} className="text-sm text-emerald-800 hover:underline">
        ← Tilbage til katalog{year ? ` ${year}` : ""}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              {course.category}
            </span>
            <StatusBadge status={course.status} />
          </div>

          <h1 className="text-3xl font-bold text-stone-900">{course.title}</h1>
          <p className="mt-4 text-stone-600">
            Et inspirerende kort kursus med fokus på praktisk læring og fællesskab.
            Kurset afholdes på {course.location} med {course.instructor} som
            underviser.
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              [
                "Dato",
                course.startDate
                  ? `${formatDate(course.startDate)} – ${formatDate(course.endDate)}`
                  : `Uge ${course.weekNumber}`,
              ],
              ["Sted", course.location],
              ["Underviser", course.instructor],
              ["Pris", formatDKK(course.price)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg bg-white p-4 ring-1 ring-stone-200"
              >
                <dt className="text-xs text-stone-500">{label}</dt>
                <dd className="mt-1 font-medium text-stone-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardTitle>{isFull ? "Tilmeld venteliste" : "Tilmeld dig"}</CardTitle>
            <CardDescription>
              {isFull
                ? "Kurset er fuldt — du kan skrive dig på ventelisten"
                : `${spotsLeft} pladser tilbage`}
            </CardDescription>
            <p className="mt-3 text-sm text-stone-600">
              Tilmeldingsblanket med kontaktoplysninger, indkvartering, sengetøj,
              kosthensyn m.m. — som på brandbjerg.dk (uden CPR).
            </p>
            <Button href={tilmeldingHref} className="mt-4 w-full gap-2">
              {isFull ? "Tilmeld venteliste" : "Gå til tilmelding"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
