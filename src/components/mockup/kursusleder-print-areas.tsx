"use client";

import { Fragment } from "react";
import type { Course } from "@/lib/mock-data";
import { formatDate } from "@/lib/mock-data";
import type { KontorParticipant } from "@/lib/kontor-types";
import {
  computeUbakBeskrivelseStats,
  getUbakBeskrivelseRows,
} from "@/lib/ubak-beskrivelse-utils";
import { getPersonById } from "@/lib/person-utils";
import {
  getProgramPrintRows,
  programDayHeading,
} from "@/lib/program-print-utils";
import {
  participantCity,
  type ParticipantSortMode,
} from "@/lib/kursusleder-utils";

type KursuslederPrintAreasProps = {
  course: Course;
  courseWeek: number;
  participants: KontorParticipant[];
  participantSort: ParticipantSortMode;
};

export function KursuslederPrintAreas({
  course,
  courseWeek,
  participants,
  participantSort,
}: KursuslederPrintAreasProps) {
  const leader = getPersonById(course.courseLeaderId);
  const ubakRows = getUbakBeskrivelseRows(course);
  const ubakStats = computeUbakBeskrivelseStats(course);
  const programRows = getProgramPrintRows(course);

  const sortLabel =
    participantSort === "efternavn"
      ? "Efternavn"
      : participantSort === "fornavn"
        ? "Fornavn"
        : "Værelse";

  return (
    <>
      <div id="kl-print-participants" className="kl-print-area hidden">
        <div className="p-8 text-black">
          <h1 className="text-xl font-bold">{course.title}</h1>
          <p className="text-sm text-slate-600">
            Deltagerliste · sorteret efter {sortLabel.toLowerCase()} ·{" "}
            {formatDate(course.startDate)} – {formatDate(course.endDate)}
          </p>
          <table className="mt-6 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2 pr-4">Navn</th>
                <th className="py-2 pr-4">Værelse</th>
                <th className="py-2 pr-4">E-mail</th>
                <th className="py-2">Særlige hensyn</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} className="border-b border-slate-300">
                  <td className="py-2 pr-4 font-medium">{p.name}</td>
                  <td className="py-2 pr-4 tabular-nums">{p.roomNumber ?? "—"}</td>
                  <td className="py-2 pr-4">{p.email}</td>
                  <td className="py-2">{p.specialConsiderations || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-slate-500">
            {participants.length} deltagere · Par holdes sammen uanset sortering
          </p>
        </div>
      </div>

      <div id="kl-print-badges" className="kl-print-area hidden">
        <div className="badge-sheet p-0 text-black">
          {participants.map((p) => (
            <div key={p.id} className="name-badge">
              <p className="badge-name">{p.name}</p>
              <p className="badge-course">{course.title}</p>
              <p className="badge-city">{participantCity(p)}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="kl-print-ubak" className="kl-print-area hidden">
        <div className="p-8 text-black">
          <h1 className="text-xl font-bold">UBAK beskrivelse — {course.title}</h1>
          <p className="text-sm">
            Kursusleder: {leader?.name ?? "—"} · Uge {courseWeek}
          </p>
          {course.kursetsHovedsigte?.trim() && (
            <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
              {course.kursetsHovedsigte}
            </p>
          )}
          <table className="mt-4 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-1 pr-2">Dag</th>
                <th className="py-1 pr-2">Beskrivelse</th>
                <th className="py-1 pr-2 text-right">UBAK</th>
                <th className="py-1 pr-2">Almen karakter</th>
                <th className="py-1">Underviser</th>
              </tr>
            </thead>
            <tbody>
              {ubakRows.map((row, i) => (
                <tr key={i} className="border-b border-slate-300 align-top">
                  <td className="py-1 pr-2">{row.dayLabel}</td>
                  <td className="py-1 pr-2">{row.beskrivelse}</td>
                  <td className="py-1 pr-2 text-right tabular-nums">
                    {row.ubakMinutter || "—"}
                  </td>
                  <td className="py-1 pr-2">{row.ubakBeskrivelse || "—"}</td>
                  <td className="py-1">{row.underviser}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black font-semibold">
                <td colSpan={2} className="py-2">
                  I alt
                </td>
                <td className="py-2 text-right">{ubakStats.ubakMinutter} min</td>
                <td colSpan={2} className="py-2">
                  UBAK: {ubakStats.ubakPct}% af ugens timer
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div id="kl-print-program-full" className="kl-print-area hidden">
        <div className="p-8 text-black">
          <h1 className="text-xl font-bold">Program — {course.title}</h1>
          <p className="text-sm text-slate-600">
            {formatDate(course.startDate)} – {formatDate(course.endDate)}
          </p>
          <div className="mt-6 space-y-4">
            {programRows.map((row, i) => (
              <div key={i} className="border-b border-slate-300 pb-3">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {programDayHeading(row)}
                </p>
                <p className="mt-1 font-bold">
                  {row.tidFra}–{row.tidTil} · {row.overskrift}
                </p>
                {row.lokale && (
                  <p className="text-sm">Lokale: {row.lokale}</p>
                )}
                {row.underviser && (
                  <p className="text-sm">Underviser: {row.underviser}</p>
                )}
                {row.broedtekst && (
                  <p className="mt-1 text-sm text-slate-700">{row.broedtekst}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="kl-print-program-a4" className="kl-print-area hidden">
        <div className="p-8 text-black">
          <h1 className="text-lg font-bold">{course.title}</h1>
          <p className="text-xs text-slate-600">
            Program · {formatDate(course.startDate)} – {formatDate(course.endDate)}
          </p>
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left text-xs uppercase">
                <th className="py-2 pr-3">Tid</th>
                <th className="py-2 pr-3">Sted</th>
                <th className="py-2">Overskrift</th>
              </tr>
            </thead>
            <tbody>
              {programRows.map((row, i) => {
                const showDayHeader =
                  i === 0 || programRows[i - 1].dayDate !== row.dayDate;
                return (
                  <Fragment key={`row-${i}`}>
                    {showDayHeader && (
                      <tr>
                        <td
                          colSpan={3}
                          className="border-b border-slate-400 bg-slate-100 py-2 pl-1 text-xs font-bold uppercase"
                        >
                          {programDayHeading(row)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-slate-200">
                      <td className="py-2 pr-3 tabular-nums whitespace-nowrap">
                        {row.tidFra}–{row.tidTil}
                      </td>
                      <td className="py-2 pr-3">{row.lokale || "—"}</td>
                      <td className="py-2 font-medium">{row.overskrift}</td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
