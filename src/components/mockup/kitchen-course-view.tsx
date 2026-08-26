"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { AskQuestionButton } from "@/components/mockup/module-questions";
import { getCourseDetailById } from "@/lib/course-list";
import { formatDate, type Course } from "@/lib/mock-data";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import { getMealRowsFromCourse } from "@/lib/kitchen-utils";
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
  const meals = sent?.meals ?? getMealRowsFromCourse(course);
  const validation = validateKitchenPlan(course);

  const byDay = meals.reduce(
    (acc, row) => {
      const key = `${row.dayDate}|${row.dayLabel}`;
      if (!acc[key]) acc[key] = { label: row.dayLabel, date: row.dayDate, rows: [] };
      acc[key].rows.push(row);
      return acc;
    },
    {} as Record<
      string,
      { label: string; date: string; rows: typeof meals }
    >,
  );

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
          {sent && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              Modtaget {formatDate(sent.sentAt.slice(0, 10))}
            </span>
          )}
        </p>
        <div className="mt-3">
          <CourseEnrollmentBadges course={course} />
        </div>
      </div>

      {!sent && !validation.ok && (
        <KitchenPlanWarnings validation={validation} />
      )}

      {!sent && validation.ok && (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle className="text-base text-amber-900">
            Afventer godkendelse fra kursusleder
          </CardTitle>
          <CardDescription className="text-amber-800">
            Køkkenplanen vises her, når alle måltidsmoduler er godkendt i
            modulplanen.
          </CardDescription>
        </Card>
      )}

      {sent && meals.length === 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle className="text-base text-amber-900">
            Ingen måltider planlagt endnu
          </CardTitle>
          <CardDescription className="text-amber-800">
            Kursuslederen skal markere moduler som måltid under Modulplan og
            vælge forplejning, specifikation og lokale.
          </CardDescription>
        </Card>
      ) : sent ? (
        Object.values(byDay).map((day) => (
          <Card key={day.date} className="overflow-hidden p-0">
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
              <CardTitle className="text-base text-amber-950">
                {day.label} · {formatDate(day.date)}
              </CardTitle>
              <CardDescription>
                {day.rows.reduce((sum, r) => sum + r.antalPersoner, 0)} kuverter
                i alt · {day.rows.length} serveringer
              </CardDescription>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Antal pers.</th>
                    <th className="px-4 py-2">Forplejning</th>
                    <th className="px-4 py-2">Specifikation</th>
                    <th className="px-4 py-2">Fra kl.</th>
                    <th className="px-4 py-2">Til kl.</th>
                    <th className="px-4 py-2">Lokaler</th>
                    <th className="px-4 py-2">Noter</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {day.rows.map((row) => (
                    <tr
                      key={row.moduleId}
                      className="border-b border-slate-100"
                    >
                      <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">
                        {row.antalPersoner}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.forplejning}
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        {row.specifikation}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {row.tidFra}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {row.tidTil}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.lokale}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-slate-600">
                        {row.note || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <AskQuestionButton
                          courseId={courseId}
                          moduleId={row.moduleId}
                          department="koekken"
                          moduleLabel={
                            row.forplejning || row.specifikation || "Måltid"
                          }
                          compact
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      ) : null}
    </div>
  );
}
