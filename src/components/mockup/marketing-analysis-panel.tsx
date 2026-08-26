"use client";

import Link from "next/link";
import { BarChart3, Target } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type {
  CourseMarketingAnalysis,
  MarketingEffortRating,
} from "@/lib/kommunikation-types";

const ratingLabels: Record<MarketingEffortRating, string> = {
  good: "God effekt",
  acceptable: "Acceptabel",
  poor: "Svag effekt",
  none: "Ingen data",
};

const ratingClasses: Record<MarketingEffortRating, string> = {
  good: "bg-emerald-100 text-emerald-800",
  acceptable: "bg-amber-100 text-amber-900",
  poor: "bg-red-100 text-red-800",
  none: "bg-slate-100 text-slate-600",
};

type MarketingAnalysisPanelProps = {
  analysis: CourseMarketingAnalysis;
  compact?: boolean;
};

export function MarketingAnalysisPanel({
  analysis,
  compact = false,
}: MarketingAnalysisPanelProps) {
  const { efforts, overallConclusion, goals } = analysis;

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base text-purple-950">
            <BarChart3 className="h-5 w-5" />
            Analyse af markedsføring
          </CardTitle>
          <CardDescription>
            Indsatser holdt op mod tilmeldinger · sammenlignet med jeres mål
          </CardDescription>
        </div>
        {!compact && (
          <Link
            href="/kommunikation/maal"
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs font-medium text-purple-800 hover:bg-purple-50"
          >
            <Target className="h-3.5 w-3.5" />
            Rediger mål
          </Link>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-purple-200 bg-white px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-purple-700">
          Konklusion
        </p>
        <p className="mt-1 text-sm text-slate-800">{overallConclusion}</p>
      </div>

      {efforts.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          Opret markedsføringsindsatser ovenfor — analysen opdateres automatisk
          når der kommer tilmeldinger i opfølgningsperioden.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {efforts.map((row) => (
            <li
              key={row.effort.id}
              className="rounded-lg border border-purple-100 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ratingClasses[row.rating]}`}
                >
                  {ratingLabels[row.rating]}
                </span>
                {row.goalComparison && (
                  <span className="text-xs text-slate-500">
                    {row.goalComparison}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">
                {row.narrative}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-purple-800/80">
        Mål: god effekt ≤ {goals.goodCostPerEnrollment.toLocaleString("da-DK")}{" "}
        kr/tilmelding · acceptabel ≤{" "}
        {goals.maxCostPerEnrollment.toLocaleString("da-DK")} kr · mindst{" "}
        {goals.minEnrollmentsPerEffort} tilmelding
        {goals.minEnrollmentsPerEffort !== 1 ? "er" : ""} inden for{" "}
        {goals.followUpDays} dage efter kampagnen.{" "}
        <Link href="/kommunikation/maal" className="font-medium underline">
          Tilpas mål
        </Link>
      </p>
    </Card>
  );
}
