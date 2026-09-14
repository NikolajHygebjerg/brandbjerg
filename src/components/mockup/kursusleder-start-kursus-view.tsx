"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { getCourseDetailById } from "@/lib/course-list";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import { ensureParticipantsForCourse } from "@/lib/kontor-participants";
import {
  BEDDING_EXTRA_INVOICE_KR,
  inferBeddingOrdered,
  isSengetojGreenForLeader,
} from "@/lib/kontor-bedding-utils";
import {
  addAlert,
  KONTOR_UPDATED_EVENT,
  updateParticipant,
} from "@/lib/kontor-storage";
import {
  isActiveParticipant,
  type KontorParticipant,
} from "@/lib/kontor-types";
import { formatDate, type Course } from "@/lib/mock-data";
import {
  buildStartKursusKontorReport,
  countArrived,
} from "@/lib/kursusleder-start-kontor-report";
import {
  getUserRolesOnCourse,
  sortParticipants,
  type ParticipantSortMode,
} from "@/lib/kursusleder-utils";
export function KursuslederStartKursusView({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [participants, setParticipants] = useState<KontorParticipant[]>([]);
  const [missing, setMissing] = useState(false);
  const [sortMode] = useState<ParticipantSortMode>("efternavn");
  const [tick, setTick] = useState(0);
  const [kontorDialogOpen, setKontorDialogOpen] = useState(false);
  const [kontorMessageDraft, setKontorMessageDraft] = useState("");
  const [sentToKontor, setSentToKontor] = useState(false);

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

  const active = useMemo(
    () =>
      sortParticipants(
        participants.filter(isActiveParticipant),
        sortMode,
      ),
    [participants, sortMode],
  );

  const arrivalStats = useMemo(
    () => countArrived(participants),
    [participants],
  );

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

  function refreshList() {
    setParticipants(ensureParticipantsForCourse(courseId));
  }

  function toggleArrived(p: KontorParticipant, arrived: boolean) {
    updateParticipant(p.courseId, p.id, {
      arrivedAt: arrived ? new Date().toISOString() : undefined,
    });
    refreshList();
  }

  function setNote(p: KontorParticipant, note: string) {
    updateParticipant(p.courseId, p.id, {
      startCourseNote: note.trim() || undefined,
    });
    refreshList();
  }

  function toggleBeddingHandedOut(p: KontorParticipant, handedOut: boolean) {
    updateParticipant(p.courseId, p.id, {
      beddingHandedOutByLeaderAt: handedOut
        ? new Date().toISOString()
        : undefined,
    });
    refreshList();
  }

  function toggleExtraBedding(p: KontorParticipant, approved: boolean) {
    if (inferBeddingOrdered(p)) return;

    if (approved) {
      updateParticipant(p.courseId, p.id, {
        beddingExtraApproved: true,
        beddingExtraNotifiedAt: new Date().toISOString(),
      });
      addAlert({
        type: "bedding_extra",
        courseId: p.courseId,
        participantId: p.id,
        message: `${p.name} har fået sengetøj ved indkvartering uden forudbestilling — send regning på ${BEDDING_EXTRA_INVOICE_KR} kr. (${course!.title})`,
      });
    } else {
      updateParticipant(p.courseId, p.id, {
        beddingExtraApproved: false,
        beddingExtraNotifiedAt: undefined,
        beddingHandedOutByLeaderAt: undefined,
        beddingOnRoom: false,
      });
    }
    refreshList();
  }

  function sendReportToKontor(leaderMessage?: string) {
    if (!course) return;
    const message = buildStartKursusKontorReport({
      courseTitle: course.title,
      participants,
      allArrived: arrivalStats.allArrived,
      leaderMessage,
    });
    addAlert({
      type: "course_arrival_report",
      courseId,
      message,
    });
    setKontorDialogOpen(false);
    setKontorMessageDraft("");
    setSentToKontor(true);
  }

  function handleSendClick() {
    if (arrivalStats.allArrived) {
      sendReportToKontor();
      return;
    }
    setKontorMessageDraft("");
    setKontorDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/kursusleder/${courseId}`}
          className="text-sm text-teal-700 hover:underline"
        >
          ← Tilbage til kurset
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <GraduationCap className="h-6 w-6 text-teal-700" />
          <h1 className="text-2xl font-bold text-slate-900">Start kursus</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {course.title} · {formatDate(course.startDate)} –{" "}
          {formatDate(course.endDate)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Tjek indkvartering, sengetøj og ankomst. Bestilt sengetøj bliver grønt
          når rengøring har lagt det på værelset, eller når du afkrydser ved
          udlevering.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-teal-50 px-4 py-3">
          <CardTitle className="text-base text-teal-900">
            Deltagere ({active.length})
          </CardTitle>
          <CardDescription className="text-teal-800/80">
            Værelse, tilmeldingskommentarer og noter
          </CardDescription>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3">Navn</th>
                <th className="px-4 py-3">Værelse</th>
                <th className="min-w-[200px] px-4 py-3">Kommentar (tilmelding)</th>
                <th className="px-4 py-3">Sengetøj</th>
                <th className="px-4 py-3 text-center">Ankommet</th>
                <th className="min-w-[180px] px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Ingen aktive deltagere.
                  </td>
                </tr>
              ) : (
                active.map((p) => (
                  <ParticipantStartRow
                    key={p.id}
                    participant={p}
                    onToggleArrived={toggleArrived}
                    onToggleExtraBedding={toggleExtraBedding}
                    onToggleBeddingHandedOut={toggleBeddingHandedOut}
                    onNoteChange={setNote}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-teal-200 bg-teal-50/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-950">
              {arrivalStats.allArrived
                ? "Alle er ankommet — send til kontor"
                : "Ikke alle indtjekket — send alligevel til kontor?"}
            </p>
            <p className="mt-1 text-xs text-teal-800/90">
              {arrivalStats.arrived} af {arrivalStats.total} markeret som
              ankommet
              {sentToKontor && (
                <span className="ml-2 font-medium text-emerald-700">
                  · Sendt til kontor
                </span>
              )}
            </p>
          </div>
          <Button
            type="button"
            className="shrink-0 bg-teal-700 hover:bg-teal-800"
            disabled={arrivalStats.total === 0}
            onClick={handleSendClick}
          >
            Send
          </Button>
        </div>
      </Card>

      {kontorDialogOpen && (
        <SendToKontorDialog
          message={kontorMessageDraft}
          onMessageChange={setKontorMessageDraft}
          onCancel={() => setKontorDialogOpen(false)}
          onConfirm={() => sendReportToKontor(kontorMessageDraft)}
        />
      )}
    </div>
  );
}

function SendToKontorDialog({
  message,
  onMessageChange,
  onCancel,
  onConfirm,
}: {
  message: string;
  onMessageChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        role="dialog"
        aria-labelledby="kontor-dialog-title"
      >
        <h2
          id="kontor-dialog-title"
          className="text-base font-semibold text-slate-900"
        >
          Ikke alle indtjekket — vil du skrive en besked til kontor?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Beskeden sendes sammen med tjeklisten over deltagere til kontoret.
        </p>
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={4}
          placeholder="Valgfri besked til kontor…"
          className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annuller
          </Button>
          <Button type="button" onClick={onConfirm}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function ParticipantStartRow({
  participant: p,
  onToggleArrived,
  onToggleExtraBedding,
  onToggleBeddingHandedOut,
  onNoteChange,
}: {
  participant: KontorParticipant;
  onToggleArrived: (p: KontorParticipant, arrived: boolean) => void;
  onToggleExtraBedding: (p: KontorParticipant, approved: boolean) => void;
  onToggleBeddingHandedOut: (p: KontorParticipant, handedOut: boolean) => void;
  onNoteChange: (p: KontorParticipant, note: string) => void;
}) {
  const ordered = inferBeddingOrdered(p);
  const green = isSengetojGreenForLeader(p);
  const onRoom = Boolean(p.beddingOnRoom);
  const handedOut = Boolean(p.beddingHandedOutByLeaderAt);
  const [noteDraft, setNoteDraft] = useState(p.startCourseNote ?? "");

  useEffect(() => {
    setNoteDraft(p.startCourseNote ?? "");
  }, [p.startCourseNote, p.id]);

  return (
    <tr className="border-b border-slate-100 align-top hover:bg-slate-50/80">
      <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
      <td className="px-4 py-3 tabular-nums text-slate-800">
        {p.roomNumber ?? "—"}
      </td>
      <td className="px-4 py-3 text-slate-600">
        {p.specialConsiderations.trim() || "—"}
      </td>
      <td className="px-4 py-3">
        <SengetojCell
          ordered={ordered}
          green={green}
          onRoom={onRoom}
          handedOut={handedOut}
          extraApproved={Boolean(p.beddingExtraApproved)}
          onExtraChange={(checked) => onToggleExtraBedding(p, checked)}
          onHandedOutChange={(checked) => onToggleBeddingHandedOut(p, checked)}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5">
          <input
            type="checkbox"
            className="size-4 rounded border-slate-300 text-teal-600"
            checked={Boolean(p.arrivedAt)}
            onChange={(e) => onToggleArrived(p, e.target.checked)}
          />
          <span className="sr-only">Ankommet</span>
          {p.arrivedAt && (
            <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
          )}
        </label>
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => {
            if (noteDraft !== (p.startCourseNote ?? "")) {
              onNoteChange(p, noteDraft);
            }
          }}
          placeholder="Note til deltager…"
          className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
        />
      </td>
    </tr>
  );
}

function SengetojCell({
  ordered,
  green,
  onRoom,
  handedOut,
  extraApproved,
  onExtraChange,
  onHandedOutChange,
}: {
  ordered: boolean;
  green: boolean;
  onRoom: boolean;
  handedOut: boolean;
  extraApproved: boolean;
  onExtraChange: (checked: boolean) => void;
  onHandedOutChange: (checked: boolean) => void;
}) {
  if (green) {
    const label = onRoom
      ? "På værelset"
      : handedOut
        ? "Udleveret"
        : "OK";
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        {label}
      </span>
    );
  }

  if (ordered) {
    return (
      <label className="inline-flex max-w-[220px] cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-emerald-600"
          checked={handedOut}
          onChange={(e) => onHandedOutChange(e.target.checked)}
        />
        <span className="text-xs leading-snug text-slate-600">
          Afventer rengøring (tryk ved udlevering)
        </span>
      </label>
    );
  }

  if (!ordered) {
    if (extraApproved) {
      return (
        <label className="inline-flex max-w-[220px] cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-emerald-600"
            checked={handedOut}
            onChange={(e) => onHandedOutChange(e.target.checked)}
          />
          <span className="text-xs leading-snug text-slate-600">
            Afventer sengetøj (tryk ved udlevering)
          </span>
        </label>
      );
    }
    return (
      <label className="inline-flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          className="size-4 rounded border-slate-300 text-teal-600"
          checked={extraApproved}
          onChange={(e) => onExtraChange(e.target.checked)}
        />
        <span className="text-xs text-slate-600">
          Ikke bestilt (tjek ved ønske)
        </span>
      </label>
    );
  }

  return <span className="text-slate-400">—</span>;
}
