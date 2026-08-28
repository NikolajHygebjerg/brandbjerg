"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KursistShell } from "@/components/kursist/kursist-shell";
import { useAuth } from "@/context/auth-context";
import {
  enrollmentStatusLabel,
  findEnrollmentsByEmail,
  formatEnrollmentDates,
} from "@/lib/kursist-enrollments";
import { getCoursesForYear, getDefaultCourseYear } from "@/lib/course-list";
import { ensureParticipantsForCourse } from "@/lib/kontor-participants";

export function KursistHomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    const year = getDefaultCourseYear();
    for (const course of getCoursesForYear(year).slice(0, 3)) {
      ensureParticipantsForCourse(course.id);
    }
    setTick((t) => t + 1);
  }, [user]);

  const enrollments = useMemo(() => {
    if (!user) return [];
    return findEnrollmentsByEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tick]);

  useEffect(() => {
    if (enrollments.length === 1) {
      router.replace(`/kursist/kurser/${enrollments[0].course.id}`);
    }
  }, [enrollments, router]);

  if (!user) return null;

  if (enrollments.length === 0) {
    return (
      <KursistShell>
        <Card>
          <CardTitle className="text-base">Ingen tilmelding fundet</CardTitle>
          <CardDescription className="mt-2">
            Vi kan ikke finde et kursus knyttet til {user.email}. Tilmeld dig
            via kursuskataloget, eller log ind med den e-mail du brugte ved
            tilmelding.
          </CardDescription>
          <p className="mt-4 text-xs text-slate-500">
            Demo: brug <strong>deltager0@example.dk</strong> / Brandbjerg1234
            efter et kursus har tilmeldinger i systemet.
          </p>
        </Card>
      </KursistShell>
    );
  }

  if (enrollments.length === 1) {
    return (
      <KursistShell>
        <CardDescription>Åbner dit kursus…</CardDescription>
      </KursistShell>
    );
  }

  return (
    <KursistShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dine kurser</h1>
          <p className="mt-1 text-sm text-slate-500">
            Vælg et kursus for at se program og evaluere punkter
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {enrollments.map(({ participant, course }) => (
            <Link key={course.id} href={`/kursist/kurser/${course.id}`}>
              <Card className="h-full transition hover:border-teal-300 hover:shadow-md">
                <CardTitle className="text-base">{course.title}</CardTitle>
                <CardDescription className="mt-2 space-y-1">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {formatEnrollmentDates(course)}
                  </span>
                  <span className="inline-block rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900">
                    {enrollmentStatusLabel(participant.status)}
                  </span>
                  {participant.roomNumber && (
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="size-3.5" />
                      Værelse {participant.roomNumber}
                    </span>
                  )}
                </CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </KursistShell>
  );
}
