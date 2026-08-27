"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KitchenMealDayCards } from "@/components/mockup/kitchen-meal-day-cards";
import { getCourseDetailById } from "@/lib/course-list";
import { formatDate, type Course } from "@/lib/mock-data";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import { getKitchenMealsForCourse } from "@/lib/kitchen-utils";
import { loadKitchenSent } from "@/lib/kitchen-storage";
import { validateKitchenPlan } from "@/lib/kitchen-plan-rules";
import { KitchenPlanWarnings } from "@/components/mockup/kitchen-plan-warnings";
import { CourseEnrollmentBadges } from "@/components/mockup/course-enrollment-badges";

export function KitchenCourseView({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const found = getCourseDetailById(courseId);
    if (found) setCourse(mergeCoursePlan(found));
    else setMissing(true);
  }, [courseId]);

  if (missing) {
    return (
      <Card>
        <CardDescription>Kursus ikke fundet.</CardDescription>
      </Card>
    );
  }

  if (!course) {
    return (
      <Card>
        <CardDescription>Indlæser…</CardDescription>
      </Card>
    );
  }

  const sent = loadKitchenSent(courseId);
  const meals = getKitchenMealsForCourse(courseId, course).map((row) => ({
    ...row,
    courseId,
  }));
  const validation = validateKitchenPlan(course);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/koekken"
          className="text-sm text-amber-700 hover:underline"
        >
          ← Tilbage til køkkenoversigt
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <UtensilsCrossed className="h-6 w-6 text-amber-700" />
          <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(course.startDate)} – {formatDate(course.endDate)}
          {sent ? (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              Modtaget {formatDate(sent.sentAt.slice(0, 10))}
            </span>
          ) : meals.length > 0 ? (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              Udkast — afventer godkendelse
            </span>
          ) : null}
        </p>
        <div className="mt-3">
          <CourseEnrollmentBadges course={course} />
        </div>
      </div>

      {!sent && !validation.ok && meals.length === 0 && (
        <KitchenPlanWarnings validation={validation} />
      )}

      {!sent && meals.length > 0 && !validation.ok && (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle className="text-base text-amber-900">
            Udkast — planen er endnu ikke komplet
          </CardTitle>
          <CardDescription className="text-amber-800">
            Køkkenet kan se nedenstående madbehov, men kursuslederen mangler
            stadig at godkende alle måltidsmoduler.
          </CardDescription>
          <div className="mt-3">
            <KitchenPlanWarnings validation={validation} />
          </div>
        </Card>
      )}

      {!sent && validation.ok && meals.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle className="text-base text-amber-900">
            Afventer endelig godkendelse fra kursusleder
          </CardTitle>
          <CardDescription className="text-amber-800">
            Madbehovet vises nedenfor. Planen markeres automatisk som modtaget,
            når alle måltidsmoduler er godkendt i modulplanen.
          </CardDescription>
        </Card>
      )}

      {!sent && meals.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle className="text-base text-amber-900">
            Afventer køkkenplan fra kursusleder
          </CardTitle>
          <CardDescription className="text-amber-800">
            Køkkenplanen vises her, når måltidsmoduler er oprettet og godkendt
            i modulplanen.
          </CardDescription>
        </Card>
      )}

      {meals.length === 0 ? (
        sent ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardTitle className="text-base text-amber-900">
              Ingen måltider planlagt endnu
            </CardTitle>
            <CardDescription className="text-amber-800">
              Kursuslederen skal markere moduler som måltid under Modulplan og
              vælge forplejning, specifikation og lokale.
            </CardDescription>
          </Card>
        ) : null
      ) : (
        <KitchenMealDayCards meals={meals} />
      )}
    </div>
  );
}
