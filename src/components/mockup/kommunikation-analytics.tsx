"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Target } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KommunikationSubnav } from "@/components/mockup/kommunikation-subnav";
import {
  CourseListDataCell,
  CourseListHeaderCell,
  CourseListRow,
  CourseListTable,
  CourseListThead,
  CourseListTitleCell,
  CourseListWeekCell,
} from "@/components/mockup/course-list-table";
import {
  getAvailableCourseYears,
  getDefaultCourseYear,
} from "@/lib/course-list";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import { KOMMUNIKATION_UPDATED_EVENT } from "@/lib/kommunikation-storage";
import {
  buildOverallKommunikationAnalysis,
  paceStatusClasses,
} from "@/lib/kommunikation-utils";
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
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [years, setYears] = useState<number[]>([statusarkYear]);

  useEffect(() => {
    setYears(getAvailableCourseYears());
    setActiveYear(getDefaultCourseYear());
  }, []);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
  }, []);

  const analysis = useMemo(
    () => buildOverallKommunikationAnalysis(activeYear),
    [activeYear, tick],
  );

  const { marketing } = analysis;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kommunikation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Analyse og konklusioner på tværs af alle kurser
        </p>
      </div>

      <KommunikationSubnav />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-purple-700" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Analyse</h2>
            <p className="text-sm text-slate-500">
              Tilmeldingstempo og markedsføringseffekt for {activeYear}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setActiveYear(y)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeYear === y
                    ? "bg-purple-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <Link
            href="/kommunikation/maal"
            className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-sm font-medium text-purple-800 hover:bg-purple-50"
          >
            <Target className="h-4 w-4" />
            Rediger mål
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Kurser" value={String(analysis.courseCount)} />
        <StatCard
          label="På benchmark"
          value={String(analysis.paceCounts.green)}
          detail={`${analysis.paceCounts.orange} orange · ${analysis.paceCounts.red} røde`}
        />
        <StatCard
          label="Markedsføring"
          value={`${analysis.totalMarketingEfforts} indsatser`}
          detail={`${analysis.coursesWithMarketing} kurser · ${analysis.totalMarketingSpend.toLocaleString("da-DK")} kr.`}
        />
        <StatCard
          label="Uden kampagner"
          value={String(analysis.coursesWithoutMarketing)}
          detail="kurser uden registrerede indsatser"
        />
      </div>

      <Card className="border-purple-200 bg-purple-50/40">
        <CardTitle className="text-base text-purple-950">
          Konklusioner — tilmeldinger (alle kurser)
        </CardTitle>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-purple-950">
          {analysis.enrollmentConclusions.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </Card>

      <Card className="border-purple-200 bg-purple-50/40">
        <CardTitle className="text-base text-purple-950">
          Konklusioner — markedsføring (alle indsatser)
        </CardTitle>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-purple-950">
          {analysis.marketingConclusions.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-purple-800">
          Mål: ≤ {marketing.goals.goodCostPerEnrollment.toLocaleString("da-DK")}{" "}
          kr/tilmelding (god) · ≤{" "}
          {marketing.goals.maxCostPerEnrollment.toLocaleString("da-DK")} kr
          (acceptabel) · {marketing.goals.followUpDays} dages opfølgning.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {marketing.byType.map((summary) => (
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
          <CardTitle className="text-base">Tilmeldingstempo — alle kurser</CardTitle>
          <CardDescription>
            Sammenligning af tilmeldte vs. benchmark i dag
          </CardDescription>
        </div>
        <CourseListTable minWidth="720px">
          <CourseListThead
            trailingHeaders={
              <>
                <CourseListHeaderCell>Tilmeldte</CourseListHeaderCell>
                <CourseListHeaderCell>Burde være</CourseListHeaderCell>
                <CourseListHeaderCell>Budget</CourseListHeaderCell>
                <CourseListHeaderCell>Indsatser</CourseListHeaderCell>
              </>
            }
          />
          <tbody>
            {analysis.courses.map((c) => (
              <CourseListRow key={c.courseId}>
                <CourseListWeekCell weekNumber={c.weekNumber} />
                <CourseListTitleCell
                  title={c.title}
                  href={`/kommunikation/${c.courseId}`}
                  accent="purple"
                />
                <CourseListDataCell className="font-semibold text-slate-900">
                  {c.enrolled}
                </CourseListDataCell>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex min-w-[2rem] justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${paceStatusClasses[c.pace]}`}
                  >
                    {c.expected}
                  </span>
                </td>
                <CourseListDataCell>{c.budget}</CourseListDataCell>
                <CourseListDataCell>
                  {c.effortCount > 0 ? c.effortCount : "—"}
                </CourseListDataCell>
              </CourseListRow>
            ))}
          </tbody>
        </CourseListTable>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <CardTitle className="text-base">Markedsføringsindsatser</CardTitle>
          <CardDescription>
            Alle indsatser på tværs af kurser med vurdering mod mål
          </CardDescription>
        </div>
        {marketing.efforts.length === 0 ? (
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
                {marketing.efforts.map((row) => (
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

      {marketing.efforts.length > 0 && (
        <Card>
          <CardTitle className="text-base">Detaljeret analyse pr. indsats</CardTitle>
          <ul className="mt-3 space-y-3">
            {marketing.efforts.map((row) => (
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

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card>
      <CardDescription>{label}</CardDescription>
      <CardTitle className="text-2xl">{value}</CardTitle>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </Card>
  );
}
