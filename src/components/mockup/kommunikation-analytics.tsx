"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KOMMUNIKATION_UPDATED_EVENT } from "@/lib/kommunikation-storage";
import { buildMarketingAnalytics } from "@/lib/kommunikation-utils";
import { marketingEffortTypeLabels } from "@/lib/kommunikation-types";

export function KommunikationAnalytics() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
  }, []);

  const { efforts, byType, conclusions } = buildMarketingAnalytics();

  return (
    <div className="space-y-6">
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

      <Card className="border-purple-200 bg-purple-50/40">
        <CardTitle className="text-base text-purple-950">Konklusioner</CardTitle>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-purple-950">
          {conclusions.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
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
                <dt className="text-slate-500">Tilmeldinger i perioder</dt>
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
            Sammenligning af periode, pris og tilmeldinger i kampagnens løbetid
          </CardDescription>
        </div>
        {efforts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Ingen indsatser endnu — opret markedsføring på enkeltkurser
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Kursus</th>
                  <th className="px-4 py-3">Indsats</th>
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3">Pris</th>
                  <th className="px-4 py-3">Tilm. i periode</th>
                  <th className="px-4 py-3">Kr. / tilmelding</th>
                </tr>
              </thead>
              <tbody>
                {efforts.map((row) => (
                  <tr
                    key={row.effort.id}
                    className="border-b border-slate-100"
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
                      {row.enrollmentsDuring}
                    </td>
                    <td className="px-4 py-3 font-semibold text-purple-800">
                      {row.costPerEnrollment != null
                        ? `${row.costPerEnrollment.toLocaleString("da-DK")} kr.`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
