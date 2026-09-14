"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  DrikkevarerPrintDialog,
  KursuslederPrintPreviewDialog,
  KursuslederVelkomstDialog,
} from "@/components/mockup/kursusleder-afvikling-dialogs";
import { KursuslederEvaluationHistory } from "@/components/mockup/kursusleder-evaluation-history";
import { KursuslederParticipantsDialog } from "@/components/mockup/kursusleder-participants-dialog";
import { KursuslederPrintAreas } from "@/components/mockup/kursusleder-print-areas";
import { KursuslederProgramBoard } from "@/components/mockup/kursusleder-program-board";
import { WorkshopsOverviewPanel } from "@/components/mockup/workshops-overview-panel";
import {
  applyDocumentPlaceholders,
  getDocumentTemplate,
} from "@/lib/document-template-storage";
import { ProgramPrintSheet } from "@/components/mockup/program-print-sheet";
import {
  computeUbakBeskrivelseStats,
  getUbakBeskrivelseRows,
} from "@/lib/ubak-beskrivelse-utils";
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
  participantCity,
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
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [velkomstOpen, setVelkomstOpen] = useState(false);
  const [velkomstDraft, setVelkomstDraft] = useState("");
  const [drikkevareOpen, setDrikkevareOpen] = useState(false);
  const [drikkevareNote, setDrikkevareNote] = useState("");
  const [printBadgesOpen, setPrintBadgesOpen] = useState(false);
  const [printProgramOpen, setPrintProgramOpen] = useState(false);
  const [printUbakOpen, setPrintUbakOpen] = useState(false);
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
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Uge {courseWeek} · {formatDate(course.startDate)} –{" "}
          {formatDate(course.endDate)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <>
              <p className="mt-2 text-xs text-amber-900">
                Mangler: {checklist.missingLabels.slice(0, 3).join(", ")}
                {checklist.missingLabels.length > 3 ? "…" : ""}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full text-sm"
                onClick={() => {
                  document
                    .getElementById("kursus-checkliste-liste")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Gå til liste
              </Button>
            </>
          )}
        </Card>

        <ActionBox title="Kursus">
          <Button
            variant="secondary"
            className="justify-start gap-2"
            onClick={() => setParticipantsDialogOpen(true)}
          >
            <Users className="h-4 w-4" />
            Vis deltagere
          </Button>
          <Button
            variant="secondary"
            className="justify-start"
            href={`/planlaegning/kurser/${courseId}`}
          >
            Rediger kursus
          </Button>
        </ActionBox>

        <ActionBox title="Afvikling">
          <Button
            variant="secondary"
            className="justify-start gap-2"
            href={`/kursusleder/${courseId}/start`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Indkvartering
          </Button>
          <Button
            variant="secondary"
            className="justify-start gap-2"
            onClick={() => setParticipantsDialogOpen(true)}
          >
            <Users className="h-4 w-4" />
            Vis deltagere
          </Button>
          <Button
            variant="secondary"
            className="justify-start"
            onClick={() => {
              const current =
                course.checklist.afviklingVelkomstDraft?.trim() ||
                applyDocumentPlaceholders(
                  getDocumentTemplate("velkomst-afvikling").body,
                  { kursusTitel: course.title },
                );
              setVelkomstDraft(
                course.checklist.afviklingVelkomstDraft ?? current,
              );
              setVelkomstOpen(true);
            }}
          >
            Velkomst
          </Button>
          <Button
            variant="secondary"
            className="justify-start"
            onClick={() => setPrintBadgesOpen(true)}
          >
            Print navneskilte
          </Button>
          <Button
            variant="secondary"
            className="justify-start"
            onClick={() => setPrintProgramOpen(true)}
          >
            Print kursusprogram
          </Button>
          <Button
            variant="secondary"
            className="justify-start"
            onClick={() => {
              setDrikkevareNote(course.checklist.drikkevarerseddelCourseNote ?? "");
              setDrikkevareOpen(true);
            }}
          >
            Print drikkevarerseddel
          </Button>
          <Button
            variant="secondary"
            className="justify-start"
            onClick={() => setPrintUbakOpen(true)}
          >
            Print UBAK
          </Button>
          <Button
            variant="secondary"
            className="justify-start"
            href={`/kursusleder/evaluering/${courseId}`}
          >
            Evaluering
          </Button>
        </ActionBox>
      </div>

      <Card>
        <CardTitle className="text-base">Kursusprogram</CardTitle>
        <CardDescription className="mt-1">
          Dag for dag — klik på et punkt for alle detaljer. Brug Evaluér på
          enkelte punkter.
        </CardDescription>
        <div className="mt-4">
          <KursuslederProgramBoard course={course} />
        </div>
      </Card>

      <KursuslederEvaluationHistory courseId={courseId} />

      {checklist && (
        <div id="kursus-checkliste-liste" className="scroll-mt-6">
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
        </div>
      )}

      <WorkshopsOverviewPanel
        course={course}
        participants={participants}
        onRefresh={() => setTick((t) => t + 1)}
      />

      <KursuslederParticipantsDialog
        open={participantsDialogOpen}
        onClose={() => setParticipantsDialogOpen(false)}
        courseTitle={course.title}
        participants={sortedParticipants}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onMailSelected={mailSelected}
        onMailAll={mailAll}
      />

      <KursuslederVelkomstDialog
        open={velkomstOpen}
        onClose={() => setVelkomstOpen(false)}
        course={course}
        draft={velkomstDraft}
        onDraftChange={setVelkomstDraft}
        onSave={() => {
          updateChecklist({ afviklingVelkomstDraft: velkomstDraft });
          setVelkomstOpen(false);
        }}
      />

      <DrikkevarerPrintDialog
        open={drikkevareOpen}
        onClose={() => setDrikkevareOpen(false)}
        course={course}
        courseNote={drikkevareNote}
        onCourseNoteChange={setDrikkevareNote}
        onSaveNote={() =>
          updateChecklist({ drikkevarerseddelCourseNote: drikkevareNote })
        }
      />

      <KursuslederPrintPreviewDialog
        open={printBadgesOpen}
        onClose={() => setPrintBadgesOpen(false)}
        title="Print navneskilte"
        description="Forhåndsvisning — Avery 55×90 mm (justeres endeligt senere)"
        printTarget="kl-print-badges"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sortedParticipants.slice(0, 6).map((p) => (
            <div
              key={p.id}
              className="rounded border-2 border-dashed border-slate-300 p-3 text-center"
            >
              <p className="text-sm font-bold">{p.name}</p>
              <p className="text-[10px] text-slate-600">{course.title}</p>
              <p className="text-xs text-slate-700">{participantCity(p)}</p>
            </div>
          ))}
        </div>
        {sortedParticipants.length > 6 && (
          <p className="mt-2 text-xs text-slate-500">
            + {sortedParticipants.length - 6} flere ved print
          </p>
        )}
      </KursuslederPrintPreviewDialog>

      <KursuslederPrintPreviewDialog
        open={printProgramOpen}
        onClose={() => setPrintProgramOpen(false)}
        title="Print kursusprogram"
        description="A4 — to kolonner som trykt program"
        printTarget="kl-print-program-a4"
      >
        <ProgramPrintPreview course={course} />
      </KursuslederPrintPreviewDialog>

      <KursuslederPrintPreviewDialog
        open={printUbakOpen}
        onClose={() => setPrintUbakOpen(false)}
        title="Print UBAK"
        description="UBAK-beskrivelser for kurset"
        printTarget="kl-print-ubak"
      >
        <UbakPrintPreview course={course} />
      </KursuslederPrintPreviewDialog>

      <KursuslederPrintAreas
        course={course}
        courseWeek={courseWeek}
        participants={sortedParticipants}
        participantSort={sortMode}
        velkomstText={
          velkomstDraft ||
          course.checklist.afviklingVelkomstDraft ||
          ""
        }
      />
    </div>
  );
}

function ActionBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardDescription className="font-semibold text-slate-800">
        {title}
      </CardDescription>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </Card>
  );
}

function ProgramPrintPreview({ course }: { course: Course }) {
  return (
    <div className="max-h-[min(70vh,520px)] overflow-auto rounded border border-slate-200 bg-white p-2">
      <ProgramPrintSheet course={course} className="kl-program-a4--preview text-[8pt]" />
    </div>
  );
}

function UbakPrintPreview({ course }: { course: Course }) {
  const rows = getUbakBeskrivelseRows(course);
  const stats = computeUbakBeskrivelseStats(course);
  return (
    <div className="text-xs">
      <p className="font-semibold">{course.title}</p>
      <p className="text-slate-600">UBAK i alt: {stats.ubakMinutter} min</p>
      <ul className="mt-2 max-h-48 space-y-1 overflow-auto">
        {rows.slice(0, 8).map((row, i) => (
          <li key={i}>
            {row.dayLabel}: {row.beskrivelse} ({row.ubakMinutter || 0} min)
          </li>
        ))}
      </ul>
    </div>
  );
}
