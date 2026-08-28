"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KursistProgramBoard } from "@/components/kursist/kursist-program-board";
import { KursistShell } from "@/components/kursist/kursist-shell";
import { useAuth } from "@/context/auth-context";
import {
  enrollmentStatusLabel,
  findEnrollmentsByEmail,
  formatEnrollmentDates,
} from "@/lib/kursist-enrollments";
import { ensureParticipantsForCourse } from "@/lib/kontor-participants";

export function KursistCoursePage({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    ensureParticipantsForCourse(courseId);
    setTick((t) => t + 1);
  }, [courseId]);

  const enrollment = useMemo(() => {
    if (!user) return null;
    return findEnrollmentsByEmail(user.email).find(
      (e) => e.course.id === courseId,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, courseId, tick]);

  useEffect(() => {
    if (user && tick > 0 && !enrollment) {
      router.replace("/kursist");
    }
  }, [user, enrollment, tick, router]);

  if (!user || !enrollment) {
    return (
      <KursistShell>
        <CardDescription>Indlæser kursus…</CardDescription>
      </KursistShell>
    );
  }

  const { participant, course } = enrollment;

  return (
    <KursistShell courseTitle={course.title}>
      <div className="space-y-6">
        <div>
          <Link
            href="/kursist"
            className="text-sm text-teal-700 hover:underline"
          >
            ← Alle kurser
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {course.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatEnrollmentDates(course)} · Uge {course.weekNumber}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardDescription>Status</CardDescription>
            <CardTitle className="mt-1 text-lg">
              {enrollmentStatusLabel(participant.status)}
            </CardTitle>
          </Card>
          {participant.roomNumber && (
            <Card>
              <CardDescription>Værelse</CardDescription>
              <CardTitle className="mt-1 flex items-center gap-2 text-lg">
                <MapPin className="size-4 text-teal-700" />
                {participant.roomNumber}
              </CardTitle>
            </Card>
          )}
          <Card className="border-teal-100 bg-teal-50/40">
            <CardDescription>Eva</CardDescription>
            <CardTitle className="mt-1 text-base font-medium text-teal-950">
              Tryk Eva på hvert punkt — vælg en smiley
            </CardTitle>
          </Card>
        </div>

        <Card>
          <CardTitle className="text-base">Kursusprogram</CardTitle>
          <CardDescription className="mt-1">
            Dag for dag — klik for detaljer. Brug Eva til hurtig evaluering med
            smileys.
          </CardDescription>
          <div className="mt-4">
            <KursistProgramBoard
              course={course}
              participantId={participant.id}
            />
          </div>
        </Card>
      </div>
    </KursistShell>
  );
}
