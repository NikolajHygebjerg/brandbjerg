"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, CheckCircle2, AlertTriangle, ExternalLink, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ParticipantDetailDialog } from "@/components/mockup/participant-detail-dialog";
import { PaymentReminderMailButton } from "@/components/mockup/payment-reminder-mail-button";
import { KontorRoomDistributionDialog } from "@/components/mockup/kontor-room-distribution-dialog";
import { getCourseDetailById } from "@/lib/course-list";
import { getStatusarkCourse } from "@/lib/brandbjerg-status";
import { formatDate, type Course } from "@/lib/mock-data";
import {
  ensureParticipantsForCourse,
  getCourseWeekRoomSummary,
} from "@/lib/kontor-participants";
import {
  KONTOR_UPDATED_EVENT,
  loadAlerts,
  loadParticipantsForCourse,
  loadRoomGrid,
  markAlertRead,
} from "@/lib/kontor-storage";
import {
  checkLabels,
  deriveParticipantChecks,
  isActiveParticipant,
  type KontorParticipant,
} from "@/lib/kontor-types";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import { netEnrolled } from "@/lib/statusark-utils";
import { roomWeekKey } from "@/lib/room-utils";
import { KontorLimitsPanel } from "@/components/mockup/kontor-limits-panel";
import { UbakBeskrivelsePanel } from "@/components/mockup/ubak-beskrivelse-panel";
import { defaultLimitsForCourse } from "@/lib/kontor-limits-utils";
import { mergeCoursePlan } from "@/lib/course-plan-storage";

export function KontorCourseView({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [participants, setParticipants] = useState<KontorParticipant[]>([]);
  const [selected, setSelected] = useState<KontorParticipant | null>(null);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [missing, setMissing] = useState(false);
  const [tick, setTick] = useState(0);

  const statusark = getStatusarkCourse(courseId);
  const courseWeek = statusark?.courseWeekNumber ?? course?.weekNumber ?? 0;

  useEffect(() => {
    const found = getCourseDetailById(courseId);
    if (!found) {
      setMissing(true);
      return;
    }
    setCourse(mergeCoursePlan(found));
    setParticipants(ensureParticipantsForCourse(courseId));
  }, [courseId, tick]);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KONTOR_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(KONTOR_UPDATED_EVENT, refresh);
  }, []);

  const checksByParticipant = useMemo(
    () =>
      new Map(
        participants.map((p) => [p.id, deriveParticipantChecks(p)]),
      ),
    [participants],
  );

  const roomSummary = useMemo(
    () => getCourseWeekRoomSummary(courseId, courseWeek),
    [courseId, courseWeek, participants],
  );

  const alerts = loadAlerts().filter(
    (a) => a.courseId === courseId && !a.read,
  );

  const enrolled =
    statusark != null
      ? netEnrolled(statusark.totalEnrolled, statusark.paidCancellations)
      : course?.enrolled ?? 0;

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

  const grid = loadRoomGrid(statusarkYear);
  const weekRoomCells = roomSummary.map(({ roomNumber, occupants }) => {
    const cell = grid[roomWeekKey(roomNumber, statusarkYear, courseWeek)];
    return { roomNumber, occupants, cell };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/kontor"
          className="text-sm text-violet-700 hover:underline"
        >
          ← Tilbage til kontor
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Building2 className="h-6 w-6 text-violet-700" />
          <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(course.startDate)} – {formatDate(course.endDate)} · Uge{" "}
          {courseWeek} ·{" "}
          <span className="font-semibold text-slate-800">
            {enrolled} kursister tilmeldt
          </span>
        </p>
      </div>

      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardTitle className="flex items-center gap-2 text-base text-red-900">
            <AlertTriangle className="h-5 w-5" />
            Advarsler fra værelsesystemet
          </CardTitle>
          <ul className="mt-3 space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 text-sm text-red-900"
              >
                <span>{a.message}</span>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium underline"
                  onClick={() => markAlertRead(a.id)}
                >
                  Markér læst
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden p-0 lg:col-span-2">
          <div className="border-b border-violet-200 bg-violet-50 px-4 py-3">
            <CardTitle className="text-base text-violet-950">
              Tilmeldte kursister ({participants.length})
            </CardTitle>
            <CardDescription>
              Klik på en kursist for fuld info og manuel værelsesændring
            </CardDescription>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Navn</th>
                  <th className="px-4 py-3">Værelse</th>
                  {(Object.keys(checkLabels) as (keyof typeof checkLabels)[]).map(
                    (key) => (
                      <th
                        key={key}
                        className="px-2 py-3 text-center"
                        title={checkLabels[key]}
                      >
                        <span className="sr-only">{checkLabels[key]}</span>
                        <abbr className="no-underline cursor-help">
                          {checkAbbr[key]}
                        </abbr>
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Ingen tilmeldinger endnu
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => {
                    const checks = checksByParticipant.get(p.id)!;
                    return (
                      <tr
                        key={p.id}
                        className="cursor-pointer border-b border-slate-100 hover:bg-violet-50/50"
                        onClick={() => setSelected(p)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {p.name}
                          {checks.saerligeHensyn && (
                            <span
                              className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white"
                              title={p.specialConsiderations}
                            >
                              !
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">
                          {p.roomNumber ?? "—"}
                        </td>
                        {(Object.keys(checkLabels) as (keyof typeof checkLabels)[]).map(
                          (key) => (
                            <td
                              key={key}
                              className="px-2 py-3 text-center"
                              onClick={
                                key === "betalt"
                                  ? (e) => e.stopPropagation()
                                  : undefined
                              }
                            >
                              {key === "betalt" &&
                              !checks.betalt &&
                              isActiveParticipant(p) ? (
                                <PaymentReminderMailButton
                                  participant={p}
                                  courseTitle={course.title}
                                  courseId={courseId}
                                />
                              ) : (
                                <CheckCell
                                  done={checks[key]}
                                  warn={key === "saerligeHensyn" && checks[key]}
                                />
                              )}
                            </td>
                          ),
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
            Forkortelser: {Object.entries(checkAbbr).map(([k, v]) => `${v}=${checkLabels[k as keyof typeof checkLabels]}`).join(" · ")}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  Værelser denne uge (uge {courseWeek})
                </CardTitle>
                <CardDescription>
                  {roomSummary.length} værelser i brug ·{" "}
                  <Link href="/kontor/vaerelser" className="text-violet-700 hover:underline">
                    Åbn fuld værelsesoversigt
                  </Link>
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-9 shrink-0 gap-1.5"
                onClick={() => setRoomDialogOpen(true)}
              >
                <Pencil className="size-4" />
                Rediger værelsesfordeling
              </Button>
            </div>
          </div>
          {weekRoomCells.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">
              Ingen værelser tildelt endnu — placeres automatisk ved tilmelding
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {weekRoomCells.map(({ roomNumber, occupants, cell }) => (
                <li
                  key={roomNumber}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <span className="font-medium tabular-nums text-slate-900">
                    {roomNumber}
                  </span>
                  <span className="text-slate-600">{occupants.join(", ")}</span>
                  {cell?.status === "lukket" && (
                    <span className="text-xs font-medium text-red-600">
                      Lukket
                    </span>
                  )}
                  {cell?.status === "buffer" && (
                    <span className="text-xs font-medium text-sky-700">
                      Buffer
                    </span>
                  )}
                  {cell?.status === "ansatte" && (
                    <span className="text-xs font-medium text-orange-700">
                      Ansatte
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <KontorLimitsPanel
          courseId={courseId}
          statusarkDefaults={defaultLimitsForCourse(courseId)}
        />

        <Card>
          <CardTitle className="text-base">Kursusinfo til kontor</CardTitle>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Type</dt>
              <dd className="font-medium text-slate-900">
                {statusark?.type ?? course.category}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Budgetteret</dt>
              <dd className="font-medium text-slate-900">
                {statusark?.budgetStudents ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Velkomstbrev</dt>
              <dd className="flex items-center gap-1 font-medium text-slate-900">
                {course.checklist.welcomeLetterSent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Sendt
                  </>
                ) : (
                  "Ikke sendt endnu"
                )}
              </dd>
            </div>
          </dl>
          <Link
            href={`/tilmelding/${courseId}`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Åbn tilmeldingsside
          </Link>
        </Card>
      </div>

      <UbakBeskrivelsePanel course={course} courseWeek={courseWeek} />

      {selected && (
        <ParticipantDetailDialog
          participant={selected}
          courseWeek={courseWeek}
          courseTitle={course.title}
          onClose={() => setSelected(null)}
          onUpdated={(p) => {
            setParticipants(loadParticipantsForCourse(courseId));
            setSelected(p);
          }}
        />
      )}

      {roomDialogOpen && (
        <KontorRoomDistributionDialog
          courseId={courseId}
          courseTitle={course.title}
          courseWeek={courseWeek}
          participants={participants}
          onClose={() => setRoomDialogOpen(false)}
          onUpdated={() => {
            setParticipants(loadParticipantsForCourse(courseId));
            setTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

const checkAbbr: Record<keyof typeof checkLabels, string> = {
  modtagetBekræftelse: "Bekr.",
  modtagetFaktura: "Fakt.",
  betalt: "Betalt",
  modtagetVelkomstbrev: "Velk.",
  vaerelsePlaceret: "Vær.",
  saerligeHensyn: "Hensyn",
};

function CheckCell({ done, warn }: { done: boolean; warn?: boolean }) {
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded border text-xs ${
        done
          ? warn
            ? "border-amber-500 bg-amber-100 text-amber-800"
            : "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-transparent"
      }`}
    >
      ✓
    </span>
  );
}
