"use client";

import { Fragment } from "react";
import type { Course } from "@/lib/mock-data";
import { formatDate } from "@/lib/mock-data";
import type { KontorParticipant } from "@/lib/kontor-types";
import { UbakPrintSheet } from "@/components/mockup/ubak-print-sheet";
import { getPersonById } from "@/lib/person-utils";
import { getProgramPrintRows, programDayHeading } from "@/lib/program-print-utils";
import { ProgramPrintSheet } from "@/components/mockup/program-print-sheet";
import {
  participantCity,
  type ParticipantSortMode,
} from "@/lib/kursusleder-utils";

type KursuslederPrintAreasProps = {
  course: Course;
  courseWeek: number;
  participants: KontorParticipant[];
  participantSort: ParticipantSortMode;
  velkomstText?: string;
};

export function KursuslederPrintAreas({
  course,
  courseWeek,
  participants,
  participantSort,
  velkomstText = "",
}: KursuslederPrintAreasProps) {
  const leader = getPersonById(course.courseLeaderId);
  const programRows = getProgramPrintRows(course);

  const sortLabel =
    participantSort === "efternavn"
      ? "Efternavn"
      : participantSort === "fornavn"
        ? "Fornavn"
        : "Værelse";

  return (
    <>
      <div id="kl-print-velkomst" className="kl-print-area hidden">
        <div className="p-8 text-black">
          <h1 className="text-xl font-bold">Velkomst — {course.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {formatDate(course.startDate)} – {formatDate(course.endDate)} · Uge{" "}
            {courseWeek}
          </p>
          <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
            {velkomstText.trim() || "—"}
          </div>
        </div>
      </div>

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
        <UbakPrintSheet
          course={course}
          courseWeek={courseWeek}
          leaderName={leader?.name ?? "—"}
          className="kl-ubak-print--page p-8"
        />
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
        <ProgramPrintSheet course={course} className="kl-program-a4--print" />
      </div>
    </>
  );
}
