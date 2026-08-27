"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { AskQuestionButton } from "@/components/mockup/module-questions";
import { formatDate } from "@/lib/mock-data";
import type { KitchenMealRow } from "@/lib/kitchen-utils";

export type KitchenMealDisplayRow = KitchenMealRow & {
  courseId?: string;
  courseTitle?: string;
};

function groupMealsByDay(meals: KitchenMealDisplayRow[]) {
  return meals.reduce(
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
      { label: string; date: string; rows: KitchenMealDisplayRow[] }
    >,
  );
}

export function KitchenMealDayCards({
  meals,
  showCourse = false,
}: {
  meals: KitchenMealDisplayRow[];
  showCourse?: boolean;
}) {
  const byDay = groupMealsByDay(meals);

  return (
    <>
      {Object.values(byDay).map((day) => (
        <Card key={day.date} className="overflow-hidden p-0">
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
            <CardTitle className="text-base text-amber-950">
              {day.label} · {formatDate(day.date)}
            </CardTitle>
            <CardDescription>
              {day.rows.reduce((sum, r) => sum + r.antalPersoner, 0)} kuverter i
              alt · {day.rows.length} serveringer
            </CardDescription>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  {showCourse && <th className="px-4 py-2">Kursus</th>}
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
                    key={`${row.courseId ?? ""}-${row.moduleId}`}
                    className="border-b border-slate-100"
                  >
                    {showCourse && (
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.courseTitle ?? "—"}
                      </td>
                    )}
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
                    <td className="px-4 py-3 text-slate-700">{row.lokale}</td>
                    <td className="max-w-xs px-4 py-3 text-slate-600">
                      {row.note || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.courseId ? (
                        <AskQuestionButton
                          courseId={row.courseId}
                          moduleId={row.moduleId}
                          department="koekken"
                          moduleLabel={
                            row.forplejning || row.specifikation || "Måltid"
                          }
                          compact
                        />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </>
  );
}
