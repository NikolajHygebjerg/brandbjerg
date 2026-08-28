"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AskQuestionButton } from "@/components/mockup/module-questions";
import { PedelEvaluationDialog } from "@/components/mockup/pedel-evaluation-dialog";
import { PedelSetupPhotoPanel } from "@/components/mockup/pedel-setup-photo-panel";
import { formatDate } from "@/lib/mock-data";
import {
  getBudgetAntal,
  getRealiseretAntal,
} from "@/lib/course-enrollment-counts";
import {
  buildEntryContextLines,
  findPedelEvaluation,
  hasPedelEvaluation,
  PEDEL_EVALUATION_UPDATED_EVENT,
  savePedelEvaluation,
} from "@/lib/pedel-evaluation-storage";
import {
  formatLokaleFlags,
  type PedelDayRoom,
  type PedelLokaleRow,
} from "@/lib/pedel-utils";
import { cn } from "@/lib/utils";

type LokaleSetupDialogProps = {
  room: PedelDayRoom;
  courseId: string;
  courseTitle: string;
  onClose: () => void;
};

export function LokaleSetupDialog({
  room,
  courseId,
  courseTitle,
  onClose,
}: LokaleSetupDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        role="dialog"
        aria-modal
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
              {room.dayLabel} · {formatDate(room.dayDate)}
            </p>
            <h2 className="text-lg font-bold text-slate-900">{room.lokale}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Opsætning bestilt af kursusleder
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Luk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <PedelSetupPhotoPanel
            courseId={courseId}
            courseTitle={courseTitle}
            room={room}
          />

          {room.entries.map((entry, index) => (
            <SetupBlock
              key={entry.moduleId}
              entry={entry}
              room={room}
              courseId={courseId}
              courseTitle={courseTitle}
              showDivider={index > 0}
            />
          ))}
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-right">
          <Button variant="secondary" onClick={onClose}>
            Luk
          </Button>
        </div>
      </div>
    </div>
  );
}

function SetupBlock({
  entry,
  room,
  courseId,
  courseTitle,
  showDivider,
}: {
  entry: PedelLokaleRow;
  room: PedelDayRoom;
  courseId: string;
  courseTitle: string;
  showDivider: boolean;
}) {
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalTick, setEvalTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setEvalTick((t) => t + 1);
    }
    window.addEventListener(PEDEL_EVALUATION_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(PEDEL_EVALUATION_UPDATED_EVENT, refresh);
  }, []);

  const hasEva = useMemo(
    () => hasPedelEvaluation("entry", courseId, room.dayDate, room.lokale, entry.moduleId),
    [courseId, room.dayDate, room.lokale, entry.moduleId, evalTick],
  );

  const existingEval = useMemo(
    () =>
      findPedelEvaluation(
        "entry",
        courseId,
        room.dayDate,
        room.lokale,
        entry.moduleId,
      ),
    [courseId, room.dayDate, room.lokale, entry.moduleId, evalTick],
  );

  const spec = entry.spec;
  const flags = formatLokaleFlags(spec);

  return (
    <section className={showDivider ? "border-t border-slate-200 pt-4" : ""}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-800">
          Kl. {entry.tidFra}–{entry.tidTil}
          {entry.overskrift ? ` · ${entry.overskrift}` : ""}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            className={cn("h-7 px-2 text-xs", hasEva && "ring-1 ring-emerald-400")}
            onClick={() => setEvalOpen(true)}
          >
            Eva
          </Button>
          <AskQuestionButton
            courseId={courseId}
            moduleId={entry.moduleId}
            department="pedel"
            moduleLabel={entry.spec.lokale}
            compact
          />
        </div>
      </div>

      <PedelEvaluationDialog
        open={evalOpen}
        title={`Eva — ${room.lokale}`}
        subtitle={`${entry.tidFra}–${entry.tidTil} · ${room.dayLabel}`}
        initialText={existingEval?.text ?? ""}
        contextLines={buildEntryContextLines(entry)}
        onClose={() => setEvalOpen(false)}
        onSave={(text) => {
          savePedelEvaluation({
            kind: "entry",
            courseId,
            courseTitle,
            text,
            date: room.dayDate,
            dayLabel: room.dayLabel,
            lokale: room.lokale,
            moduleId: entry.moduleId,
            entry,
            room,
          });
        }}
      />

      <dl className="mt-3 grid gap-2 text-sm">
        <SpecRow label="Antal personer" value={spec.antalPersoner || "—"} />
        <SpecRow label="Bordopstilling" value={spec.bordopstilling || "—"} />
        {flags.length > 0 && (
          <SpecRow label="Udstyr / dekoration" value={flags.join(", ")} />
        )}
        {spec.skalBrugesFlereDage && (
          <>
            <SpecRow
              label="Klar fra"
              value={
                spec.klarFraUgedag && spec.klarFraKl
                  ? `${spec.klarFraUgedag} kl. ${spec.klarFraKl}`
                  : "—"
              }
            />
            <SpecRow
              label="Ledig fra"
              value={
                spec.ledigFraUgedag && spec.ledigFraKl
                  ? `${spec.ledigFraUgedag} kl. ${spec.ledigFraKl}`
                  : "—"
              }
            />
          </>
        )}
        {spec.noter.trim() && (
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Noter til pedel</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-slate-900">
              {spec.noter}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function SpecRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex gap-3">
      <dt className="w-36 shrink-0 text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
