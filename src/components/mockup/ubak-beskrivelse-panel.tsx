"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getStaff } from "@/lib/brandbjerg-staff";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import type { Course } from "@/lib/mock-data";
import {
  computeUbakBeskrivelseStats,
  getUbakBeskrivelseRows,
} from "@/lib/ubak-beskrivelse-utils";

type UbakBeskrivelsePanelProps = {
  course: Course;
  courseWeek: number;
};

export function UbakBeskrivelsePanel({
  course,
  courseWeek,
}: UbakBeskrivelsePanelProps) {
  const merged = mergeCoursePlan(course);
  const rows = getUbakBeskrivelseRows(merged);
  const stats = computeUbakBeskrivelseStats(merged);
  const leader = getStaff(merged.courseLeaderId);

  function handlePrint() {
    window.print();
  }

  if (rows.length === 0) {
    return (
      <Card className="lg:col-span-2">
        <CardTitle className="text-base">UBAK beskrivelse</CardTitle>
        <CardDescription className="mt-2">
          Intet program oprettet endnu — kursuslederen skal oprette modulplanen
          under Planlægning.
        </CardDescription>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden p-0 lg:col-span-2 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-violet-200 bg-violet-50 px-4 py-3">
          <div>
            <CardTitle className="text-base text-violet-950">
              UBAK beskrivelse
            </CardTitle>
            <CardDescription>
              Som UBAK_beskriv-arket i praktisk seddel — minutter og beskrivelse
              pr. modul
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Printvenlig version
          </Button>
        </div>

        <UbakSheetContent
          course={merged}
          courseWeek={courseWeek}
          leaderName={leader?.name ?? "—"}
          rows={rows}
          stats={stats}
        />
      </Card>

      <div id="ubak-print-area" className="hidden print:block">
        <UbakSheetContent
          course={merged}
          courseWeek={courseWeek}
          leaderName={leader?.name ?? "—"}
          rows={rows}
          stats={stats}
          forPrint
        />
      </div>
    </>
  );
}

function UbakSheetContent({
  course,
  courseWeek,
  leaderName,
  rows,
  stats,
  forPrint = false,
}: {
  course: Course;
  courseWeek: number;
  leaderName: string;
  rows: ReturnType<typeof getUbakBeskrivelseRows>;
  stats: ReturnType<typeof computeUbakBeskrivelseStats>;
  forPrint?: boolean;
}) {
  return (
    <div className={forPrint ? "p-8 text-black" : ""}>
      <div
        className={`grid gap-4 border-b border-slate-200 px-4 py-4 sm:grid-cols-2 ${
          forPrint ? "border-black px-0" : "bg-white"
        }`}
      >
        <dl className="grid gap-2 text-sm">
          <MetaRow label="Kursusnavn" value={course.title} />
          <MetaRow label="Kursusleder" value={leaderName} />
          <MetaRow label="Kursusuge" value={`Uge ${courseWeek}`} />
        </dl>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Kursets hovedsigte
          </p>
          <p
            className={`mt-1 min-h-[4rem] rounded-lg border px-3 py-2 text-sm ${
              forPrint
                ? "border-black bg-amber-50"
                : "border-amber-200 bg-amber-50 text-slate-800"
            }`}
          >
            {course.kursetsHovedsigte?.trim() ||
              "Ikke udfyldt endnu — kursuslederen udfylder under Oversigt & økonomi."}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className={`w-full min-w-[900px] text-sm ${
            forPrint ? "border-collapse" : ""
          }`}
        >
          <thead>
            <tr
              className={`text-left text-xs uppercase tracking-wide ${
                forPrint
                  ? "border-b-2 border-black"
                  : "border-b border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <th className="px-3 py-2">Dag</th>
              <th className="px-3 py-2">Tidsrum</th>
              <th className="px-3 py-2">Beskrivelse</th>
              <th className="px-3 py-2 text-right">UBAK min.</th>
              <th className="min-w-[280px] px-3 py-2">
                Beskrivelse af undervisningens almene karakter
              </th>
              <th className="px-3 py-2">Underviser</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={`${row.dayLabel}-${row.tidFra}-${row.beskrivelse}-${i}`}
                className={
                  forPrint ? "border-b border-slate-300" : "border-b border-slate-100"
                }
              >
                <td className="px-3 py-2 align-top font-medium text-slate-900">
                  {row.dayLabel}
                </td>
                <td className="px-3 py-2 align-top text-slate-700">
                  {row.tidsrum}
                  <span className="mt-0.5 block text-[11px] tabular-nums text-slate-500">
                    {row.tidFra}–{row.tidTil}
                  </span>
                </td>
                <td className="px-3 py-2 align-top font-medium text-slate-900">
                  {row.beskrivelse}
                </td>
                <td
                  className={`px-3 py-2 align-top text-right tabular-nums ${
                    row.ubakMinutter > 0
                      ? "font-semibold text-violet-900"
                      : "text-slate-400"
                  }`}
                >
                  {row.ubakMinutter > 0 ? row.ubakMinutter : "—"}
                </td>
                <td className="px-3 py-2 align-top text-slate-800">
                  {row.ubakBeskrivelse || (
                    <span className="text-slate-400">
                      {row.ubakMinutter > 0 ? "Mangler beskrivelse" : "—"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 align-top text-slate-700">
                  {row.underviser}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr
              className={
                forPrint
                  ? "border-t-2 border-black font-semibold"
                  : "border-t-2 border-slate-200 bg-violet-50 font-semibold"
              }
            >
              <td colSpan={3} className="px-3 py-3 text-slate-900">
                I alt
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-violet-950">
                {stats.ubakMinutter} min
              </td>
              <td colSpan={2} className="px-3 py-3 text-slate-800">
                UBAK udgør{" "}
                <span className="text-violet-950">{stats.ubakPct}%</span> af
                ugens undervisningstimer ({stats.ubakTimer} af {stats.ugeTimer})
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
