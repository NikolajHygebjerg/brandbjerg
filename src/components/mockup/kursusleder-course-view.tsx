"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Mail,
  Printer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KursuslederEvaluationHistory } from "@/components/mockup/kursusleder-evaluation-history";
import { KursuslederPrintAreas } from "@/components/mockup/kursusleder-print-areas";
import {
  KursuslederCourseEvalButton,
  KursuslederProgramBoard,
} from "@/components/mockup/kursusleder-program-board";
import { triggerKursuslederPrint } from "@/components/mockup/kursusleder-print-trigger";
import { WelcomeLetterPanel } from "@/components/mockup/welcome-letter-panel";
import { WorkshopsOverviewPanel } from "@/components/mockup/workshops-overview-panel";
import { useAuth } from "@/context/auth-context";
import { getStatusarkCourse } from "@/lib/brandbjerg-status";
import { buildChecklistSummary } from "@/lib/checklist-summary";
import { getCourseDetailById } from "@/lib/course-list";
import {
  createPlanSnapshot,
  loadCoursePlan,
  mergeCoursePlan,
  saveCoursePlan,
} from "@/lib/course-plan-storage";
import {
  getBudgetAntal,
  getRealiseretAntal,
} from "@/lib/course-enrollment-counts";
import { ensureParticipantsForCourse } from "@/lib/kontor-participants";
import { KONTOR_UPDATED_EVENT } from "@/lib/kontor-storage";
import type { KontorParticipant } from "@/lib/kontor-types";
import { formatDate, type Course, type CourseChecklist } from "@/lib/mock-data";
import { netEnrolled } from "@/lib/statusark-utils";
import {
  buildMailtoLink,
  getUserRolesOnCourse,
  sortParticipants,
  type ParticipantSortMode,
} from "@/lib/kursusleder-utils";

export function KursuslederCourseView({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [participants, setParticipants] = useState<KontorParticipant[]>([]);
  const [missing, setMissing] = useState(false);
  const [sortMode, setSortMode] = useState<ParticipantSortMode>("efternavn");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showParticipants, setShowParticipants] = useState(false);
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

  useEffect(() => {
    if (!user || !course) return;
    if (!getUserRolesOnCourse(course, user).length) {
      router.replace("/kursusleder");
    }
  }, [user, course, router]);

  const sortedParticipants = useMemo(
    () => sortParticipants(participants, sortMode),
    [participants, sortMode],
  );

  const checklist = useMemo(
    () => (course ? buildChecklistSummary(course) : null),
    [course],
  );

  const enrolled =
    statusark != null
      ? netEnrolled(statusark.totalEnrolled, statusark.paidCancellations)
      : course
        ? getRealiseretAntal(course)
        : 0;

  const roles = user && course ? getUserRolesOnCourse(course, user) : [];

  if (missing) {
    return (
      <Card>
        <CardDescription>Kursus ikke fundet.</CardDescription>
      </Card>
    );
  }

  if (!course || !user) {
    return (
      <Card>
        <CardDescription>Indlæser…</CardDescription>
      </Card>
    );
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function mailSelected() {
    const emails = sortedParticipants
      .filter((p) => selectedIds.has(p.id))
      .map((p) => p.email);
    if (emails.length === 0) return;
    window.location.href = buildMailtoLink(
      emails,
      course!.title,
      `Kære kursist\n\nVedr. kurset "${course!.title}".\n\n`,
    );
  }

  function mailAll() {
    const emails = sortedParticipants.map((p) => p.email);
    if (emails.length === 0) return;
    window.location.href = buildMailtoLink(
      emails,
      course!.title,
      `Kære kursist\n\nVedr. kurset "${course!.title}".\n\n`,
    );
  }

  function updateChecklist(patch: Partial<CourseChecklist>) {
    setCourse((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        checklist: { ...prev.checklist, ...patch },
      };
      const stored = loadCoursePlan(courseId);
      saveCoursePlan(
        courseId,
        createPlanSnapshot(next, stored?.programStatus ?? "kladde"),
      );
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/kursusleder"
          className="text-sm text-teal-700 hover:underline"
        >
          ← Tilbage til mine kurser
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <GraduationCap className="h-6 w-6 text-teal-700" />
            <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
            {roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-900"
              >
                {role}
              </span>
            ))}
          </div>
          <KursuslederCourseEvalButton course={course} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Uge {courseWeek} · {formatDate(course.startDate)} –{" "}
          {formatDate(course.endDate)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardDescription>Deltagere</CardDescription>
          <CardTitle className="mt-1 text-2xl">{enrolled}</CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Budget {getBudgetAntal(course)} · {participants.length} i listen
          </p>
        </Card>

        <Card
          className={
            checklist?.allDone
              ? "border-emerald-200 bg-emerald-50/50"
              : "border-amber-200 bg-amber-50/50"
          }
        >
          <CardDescription>Kursus-checkliste</CardDescription>
          <CardTitle className="mt-1 flex items-center gap-2 text-xl">
            {checklist?.allDone ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Alt klart
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-600" />
                {checklist?.doneCount}/{checklist?.totalCount} færdige
              </>
            )}
          </CardTitle>
          {!checklist?.allDone && checklist && (
            <p className="mt-2 text-xs text-amber-900">
              Mangler: {checklist.missingLabels.slice(0, 3).join(", ")}
              {checklist.missingLabels.length > 3 ? "…" : ""}
            </p>
          )}
        </Card>

        <Card>
          <CardDescription>Handlinger</CardDescription>
          <div className="mt-2 flex flex-col gap-2">
            <Button
              variant="secondary"
              className="justify-start gap-2"
              onClick={() => setShowParticipants((v) => !v)}
            >
              <Users className="h-4 w-4" />
              {showParticipants ? "Skjul deltagere" : "Vis deltagere"}
            </Button>
            <Button
              variant="secondary"
              className="justify-start gap-2"
              href={`/kursusleder/evaluering/${courseId}`}
            >
              Evaluering
            </Button>
            <Button
              variant="secondary"
              className="justify-start gap-2"
              href={`/planlaegning/kurser/${courseId}`}
            >
              Rediger kursus
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle className="text-base">Kursusprogram</CardTitle>
        <CardDescription className="mt-1">
          Dag for dag — klik på et punkt for alle detaljer. Brug Eva til
          evaluering af enkelte punkter.
        </CardDescription>
        <div className="mt-4">
          <KursuslederProgramBoard course={course} />
        </div>
      </Card>

      <KursuslederEvaluationHistory courseId={courseId} />

      {checklist && (
        <Card>
          <CardTitle className="text-base">Checkliste — status</CardTitle>
          <ul className="mt-4 space-y-2">
            {checklist.items.map((item) => (
              <li
                key={item.id}
                className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
                  item.done
                    ? "border-emerald-200 bg-emerald-50/60"
                    : item.urgent
                      ? "border-red-200 bg-red-50/60"
                      : "border-slate-200 bg-white"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                    item.done
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-300 bg-white"
                  }`}
                >
                  {item.done ? "✓" : ""}
                </span>
                <div>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.hint}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <WelcomeLetterPanel
        course={course}
        participants={participants}
        onUpdateChecklist={updateChecklist}
        onParticipantsUpdated={() => setTick((t) => t + 1)}
      />

      <WorkshopsOverviewPanel
        course={course}
        participants={participants}
        onRefresh={() => setTick((t) => t + 1)}
      />

      {showParticipants && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <CardTitle className="text-base">Deltagere</CardTitle>
              <CardDescription>
                Navn, særlige hensyn, værelse og mail
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                Sortér:
                <select
                  value={sortMode}
                  onChange={(e) =>
                    setSortMode(e.target.value as ParticipantSortMode)
                  }
                  className="rounded border border-slate-200 px-2 py-1 text-sm"
                >
                  <option value="efternavn">Efternavn</option>
                  <option value="fornavn">Fornavn</option>
                  <option value="vaerelse">Værelse</option>
                </select>
              </label>
              <Button
                variant="secondary"
                className="gap-1 text-sm"
                disabled={selectedIds.size === 0}
                onClick={mailSelected}
              >
                <Mail className="h-4 w-4" />
                Skriv til valgte
              </Button>
              <Button variant="secondary" className="gap-1 text-sm" onClick={mailAll}>
                <Mail className="h-4 w-4" />
                Skriv til alle
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3">Navn</th>
                  <th className="px-4 py-3">Værelse</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Særlige hensyn</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sortedParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Ingen tilmeldinger endnu
                    </td>
                  </tr>
                ) : (
                  sortedParticipants.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 hover:bg-teal-50/30"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {p.roomNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{p.email}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.specialConsiderations ? (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                            {p.specialConsiderations}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={buildMailtoLink([p.email], course.title)}
                          className="text-xs font-medium text-teal-700 hover:underline"
                        >
                          Mail
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle className="text-base">Print</CardTitle>
        <CardDescription className="mt-1">
          Printvenlige versioner til kursusafvikling
        </CardDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          <PrintButton
            label="Deltagerliste"
            onClick={() => triggerKursuslederPrint("kl-print-participants")}
          />
          <PrintButton
            label="Navneskilte (55×90 mm)"
            onClick={() => triggerKursuslederPrint("kl-print-badges")}
          />
          <PrintButton
            label="UBAK-skema"
            onClick={() => triggerKursuslederPrint("kl-print-ubak")}
          />
          <PrintButton
            label="Program (fuld)"
            onClick={() => triggerKursuslederPrint("kl-print-program-full")}
          />
          <PrintButton
            label="Program (A4 — tid, sted, titel)"
            onClick={() => triggerKursuslederPrint("kl-print-program-a4")}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Navneskilte er tilpasset etiketteark 55×90 mm (fx JustMore
          kongresmærke). Par vises sammen på deltagerlisten uanset sortering.
        </p>
      </Card>

      <KursuslederPrintAreas
        course={course}
        courseWeek={courseWeek}
        participants={sortedParticipants}
        participantSort={sortMode}
      />
    </div>
  );
}

function PrintButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="gap-2"
      onClick={onClick}
    >
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  );
}
