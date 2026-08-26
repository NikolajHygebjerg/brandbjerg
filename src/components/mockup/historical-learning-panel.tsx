"use client";

import Link from "next/link";
import { BookOpen, Lightbulb } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/mock-data";
import type { HistoricalLearningAnalysis } from "@/lib/kommunikation-types";
import { marketingEffortTypeLabels } from "@/lib/kommunikation-types";

const ratingLabels = {
  good: "Virker",
  acceptable: "Acceptabel",
  poor: "Virker ikke",
  none: "Ukendt",
} as const;

const ratingClasses = {
  good: "bg-emerald-100 text-emerald-800",
  acceptable: "bg-amber-100 text-amber-900",
  poor: "bg-red-100 text-red-800",
  none: "bg-slate-100 text-slate-600",
} as const;

type HistoricalLearningPanelProps = {
  analysis: HistoricalLearningAnalysis;
};

export function HistoricalLearningPanel({ analysis }: HistoricalLearningPanelProps) {
  const hasSimilar = analysis.similarCourses.length > 0;

  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <div className="flex items-start gap-3">
        <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base text-indigo-950">
            Læring fra lignende afholdte kurser
          </CardTitle>
          <CardDescription>
            Automatisk analyse baseret på fælles emneord i titlen — fx «haven»
            for «Liv i haven»
          </CardDescription>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-indigo-200 bg-white px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">
          Konklusioner
        </p>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-800">
          {analysis.conclusions.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      {analysis.recommendations.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-900">
            <Lightbulb className="h-3.5 w-3.5" />
            Anbefalinger til dette kursus
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-amber-950">
            {analysis.recommendations.map((line, i) => (
              <li key={i}>· {line}</li>
            ))}
          </ul>
        </div>
      )}

      {hasSimilar ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Lignende kurser ({analysis.similarCourses.length})
          </p>
          {analysis.similarCourses.map((snap) => (
            <div
              key={snap.courseId}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{snap.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(snap.startDate)} · {snap.matchReason} ·{" "}
                    {snap.fillRate}% belægning ({snap.enrolled}/{snap.budget})
                  </p>
                </div>
                {snap.peakMonthsBefore != null && (
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                    Peak: {snap.peakMonthsBefore} mdr. før
                  </span>
                )}
              </div>

              {snap.peakWeekLabel && (
                <p className="mt-2 text-xs text-slate-600">
                  Flest tilmeldinger: {snap.peakWeekCount} pladser i{" "}
                  {snap.peakWeekLabel}
                </p>
              )}

              {snap.efforts.length > 0 ? (
                <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {snap.efforts.map((e) => (
                    <li key={e.effort.id} className="text-xs text-slate-700">
                      <span
                        className={`mr-2 inline-block rounded px-1.5 py-0.5 font-semibold ${ratingClasses[e.rating]}`}
                      >
                        {ratingLabels[e.rating]}
                      </span>
                      <span className="font-medium">
                        {marketingEffortTypeLabels[e.effort.type]}
                      </span>
                      {" — "}
                      {e.narrative}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Ingen markedsføringsindsatser registreret
                </p>
              )}

              <Link
                href={`/kommunikation/${snap.courseId}`}
                className="mt-2 inline-block text-xs font-medium text-indigo-700 hover:underline"
              >
                Se kursus →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          Når afholdte kurser deler tydelige emneord i titlen (fx have/haven),
          vises de her med timing og markedsføring.
        </p>
      )}
    </Card>
  );
}
