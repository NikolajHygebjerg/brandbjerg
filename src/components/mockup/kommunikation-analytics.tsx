"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Target } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KOMMUNIKATION_UPDATED_EVENT } from "@/lib/kommunikation-storage";
import { buildMarketingAnalytics } from "@/lib/kommunikation-utils";
import {
  marketingEffortTypeLabels,
  type MarketingEffortRating,
} from "@/lib/kommunikation-types";

const ratingLabels: Record<MarketingEffortRating, string> = {
  good: "God",
  acceptable: "Acceptabel",
  poor: "Svag",
  none: "—",
};

const ratingClasses: Record<MarketingEffortRating, string> = {
  good: "bg-emerald-100 text-emerald-800",
  acceptable: "bg-amber-100 text-amber-900",
  poor: "bg-red-100 text-red-800",
  none: "bg-slate-100 text-slate-600",
};

export function KommunikationAnalytics() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
  }, []);

  const { efforts, byType, conclusions, goals } = buildMarketingAnalytics();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/kommunikation"
            className="text-sm text-purple-700 hover:underline"
          >
            ← Tilbage til kommunikation
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-purple-700" />
            <h1 className="text-2xl font-bold text-slate-900">Samlet analyse</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Effektivitet af markedsføringsindsatser · omkostning pr. tilmelding
          </p>
        </div>
        <Link
          href="/kommunikation/maal"
          className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-white px-4 py-2.5 text-sm font-medium text-purple-800 hover:bg-purple-50"
        >
          <Target className="h-4 w-4" />
          Rediger mål
        </Link>
      </div>

      <Card className="border-purple-200 bg-purple-50/40">
        <CardTitle className="text-base text-purple-950">Konklusioner</CardTitle>
        <ul className="mt-3 space-y-3 text-sm text-purple-950">
          {conclusions.map((line, i) => (
            <li key={i} className="leading-relaxed">
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-purple-800">
          Mål: ≤ {goals.goodCostPerEnrollment.toLocaleString("da-DK")} kr/tilmelding
          (god) · ≤ {goals.maxCostPerEnrollment.toLocaleString("da-DK")} kr (acceptabel)
          · {goals.followUpDays} dages opfølgning efter kampagne.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {byType.map((summary) => (
          <Card key={summary.type}>
            <CardDescription>{summary.label}</CardDescription>
            <CardTitle className="text-lg">{summary.effortCount} indsatser</CardTitle>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Forbrug</dt>
                <dd className="font-medium">
                  {summary.totalSpend.toLocaleString("da-DK")} kr.
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tilmeldinger efter kampagne</dt>
                <dd className="font-medium">{summary.totalEnrollments}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Kr. pr. tilmelding</dt>
                <dd className="font-semibold text-purple-800">
                  {summary.avgCostPerEnrollment != null
                    ? `${summary.avgCostPerEnrollment.toLocaleString("da-DK")} kr.`
                    : "—"}
                </dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <CardTitle className="text-base">Alle indsatser</CardTitle>
          <CardDescription>
            Periode, pris, tilmeldinger i opfølgningsperioden og vurdering mod mål
          </CardDescription>
        </div>
        {efforts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Ingen indsatser endnu — opret markedsføring på enkeltkurser
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Kursus</th>
                  <th className="px-4 py-3">Indsats</th>
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3">Pris</th>
                  <th className="px-4 py-3">Tilm. efter</th>
                  <th className="px-4 py-3">Kr. / tilm.</th>
                  <th className="px-4 py-3">Vurdering</th>
                </tr>
              </thead>
              <tbody>
                {efforts.map((row) => (
                  <tr
                    key={row.effort.id}
                    className="border-b border-slate-100 align-top"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.courseTitle}
                    </td>
                    <td className="px-4 py-3">
                      {marketingEffortTypeLabels[row.effort.type]}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.effort.startDate} – {row.effort.endDate}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.effort.price.toLocaleString("da-DK")} kr.
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {row.enrollmentsInFollowUp}
                    </td>
                    <td className="px-4 py-3 font-semibold text-purple-800">
                      {row.costPerEnrollmentFollowUp != null
                        ? `${row.costPerEnrollmentFollowUp.toLocaleString("da-DK")} kr.`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ratingClasses[row.rating]}`}
                      >
                        {ratingLabels[row.rating]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {efforts.length > 0 && (
        <Card>
          <CardTitle className="text-base">Detaljeret analyse pr. indsats</CardTitle>
          <ul className="mt-3 space-y-3">
            {efforts.map((row) => (
              <li
                key={row.effort.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
              >
                <span className="font-medium text-slate-900">
                  {row.courseTitle} · {marketingEffortTypeLabels[row.effort.type]}
                </span>
                <p className="mt-1 leading-relaxed">{row.narrative}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
