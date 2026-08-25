"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { AskQuestionButton } from "@/components/mockup/module-questions";
import { getCourseDetailById } from "@/lib/course-list";
import { formatDate, type Course } from "@/lib/mock-data";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import {
  formatLokaleFlags,
  getPedelRowsFromCourse,
} from "@/lib/pedel-utils";

export function PedelCourseView({ courseId }: { courseId: string }) {
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

  const rows = getPedelRowsFromCourse(course);
  const participantCount =
    course.enrolled > 0 ? course.enrolled : course.capacity;

  const byDay = rows.reduce(
    (acc, row) => {
      const key = `${row.dayDate}|${row.dayLabel}`;
      if (!acc[key]) {
        acc[key] = { label: row.dayLabel, date: row.dayDate, rows: [] };
      }
      acc[key].rows.push(row);
      return acc;
    },
    {} as Record<
      string,
      { label: string; date: string; rows: typeof rows }
    >,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/pedel"
          className="text-sm text-blue-700 hover:underline"
        >
          ← Tilbage til pedeloversigt
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Sparkles className="h-6 w-6 text-blue-700" />
          <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(course.startDate)} – {formatDate(course.endDate)} ·{" "}
          <span className="font-medium text-slate-700">
            {participantCount} deltagere
          </span>
        </p>
      </div>

      {rows.length === 0 ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardTitle className="text-base text-blue-900">
            Ingen lokalespecifikation endnu
          </CardTitle>
          <CardDescription className="text-blue-800">
            Kursuslederen skal udfylde lokalespecifikation på moduler under
            Modulplan.
          </CardDescription>
        </Card>
      ) : (
        Object.values(byDay).map((day) => (
          <Card key={day.date} className="overflow-hidden p-0">
            <div className="border-b border-blue-200 bg-blue-50 px-4 py-3">
              <CardTitle className="text-base text-blue-950">
                {day.label} · {formatDate(day.date)}
              </CardTitle>
              <CardDescription>
                {day.rows.length} lokaleopsætninger
              </CardDescription>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Modul</th>
                    <th className="px-4 py-2">Fra</th>
                    <th className="px-4 py-2">Til</th>
                    <th className="px-4 py-2">Lokaler</th>
                    <th className="px-4 py-2">Personer</th>
                    <th className="px-4 py-2">Bordopstilling</th>
                    <th className="px-4 py-2">Udstyr</th>
                    <th className="px-4 py-2">Noter</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {day.rows.map((row) => {
                    const flags = formatLokaleFlags(row.spec);
                    const flereDage = row.spec.skalBrugesFlereDage
                      ? `Klar ${row.spec.klarFraUgedag} ${row.spec.klarFraKl} · Ledig ${row.spec.ledigFraUgedag} ${row.spec.ledigFraKl}`
                      : null;
                    return (
                      <tr
                        key={row.moduleId}
                        className="border-b border-slate-100"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {row.overskrift || "—"}
                          {flereDage && (
                            <p className="mt-0.5 text-xs font-normal text-blue-700">
                              {flereDage}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">
                          {row.tidFra}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">
                          {row.tidTil}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.spec.lokale || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.spec.antalPersoner || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.spec.bordopstilling || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {flags.length > 0 ? flags.join(", ") : "—"}
                        </td>
                        <td className="max-w-xs px-4 py-3 text-slate-600">
                          {row.spec.noter || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <AskQuestionButton
                            courseId={courseId}
                            moduleId={row.moduleId}
                            department="pedel"
                            moduleLabel={row.overskrift || row.spec.lokale}
                            compact
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
