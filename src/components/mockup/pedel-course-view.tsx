"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Camera, ClipboardList, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LokaleSetupDialog } from "@/components/mockup/lokale-setup-dialog";
import { PedelEvaluationDialog } from "@/components/mockup/pedel-evaluation-dialog";
import { CourseEnrollmentBadges } from "@/components/mockup/course-enrollment-badges";
import { getCourseDetailById } from "@/lib/course-list";
import {
  getBudgetAntal,
  getRealiseretAntal,
} from "@/lib/course-enrollment-counts";
import { formatDate, type Course } from "@/lib/mock-data";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import {
  buildRoomContextLines,
  findPedelEvaluation,
  hasPedelEvaluation,
  PEDEL_EVALUATION_UPDATED_EVENT,
  savePedelEvaluation,
} from "@/lib/pedel-evaluation-storage";
import {
  listPhotosForRoom,
  PEDEL_SETUP_PHOTO_UPDATED_EVENT,
} from "@/lib/pedel-setup-photo-storage";
import {
  formatLokaleFlags,
  getPedelDayRooms,
  groupPedelDayRoomsByDate,
  timeSpanForRoom,
  type PedelDayRoom,
} from "@/lib/pedel-utils";
import { cn } from "@/lib/utils";

type DayGroup = {
  label: string;
  date: string;
  rooms: PedelDayRoom[];
};

type EvalTarget =
  | { kind: "course" }
  | { kind: "day"; day: DayGroup }
  | { kind: "room"; room: PedelDayRoom };

export function PedelCourseView({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [missing, setMissing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<PedelDayRoom | null>(null);
  const [evalTarget, setEvalTarget] = useState<EvalTarget | null>(null);
  const [evalTick, setEvalTick] = useState(0);
  const [photoTick, setPhotoTick] = useState(0);

  useEffect(() => {
    const found = getCourseDetailById(courseId);
    if (found) setCourse(mergeCoursePlan(found));
    else setMissing(true);
  }, [courseId]);

  useEffect(() => {
    function refreshEval() {
      setEvalTick((t) => t + 1);
    }
    function refreshPhotos() {
      setPhotoTick((t) => t + 1);
    }
    window.addEventListener(PEDEL_EVALUATION_UPDATED_EVENT, refreshEval);
    window.addEventListener(PEDEL_SETUP_PHOTO_UPDATED_EVENT, refreshPhotos);
    return () => {
      window.removeEventListener(PEDEL_EVALUATION_UPDATED_EVENT, refreshEval);
      window.removeEventListener(PEDEL_SETUP_PHOTO_UPDATED_EVENT, refreshPhotos);
    };
  }, []);

  const hasCourseEval = useMemo(
    () => hasPedelEvaluation("course", courseId),
    [courseId, evalTick],
  );

  const existingCourseEval = useMemo(
    () => findPedelEvaluation("course", courseId),
    [courseId, evalTick],
  );

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

  const dayRooms = getPedelDayRooms(course);
  const byDay = groupPedelDayRoomsByDate(dayRooms);

  const evalDialogProps = (() => {
    if (!evalTarget) return null;

    if (evalTarget.kind === "course") {
      return {
        title: `Kursusevaluering — ${course.title}`,
        subtitle: "Samlet evaluering af kurset",
        initialText: existingCourseEval?.text ?? "",
        contextLines: [
          `${getRealiseretAntal(course)} tilmeldte / ${getBudgetAntal(course)} budget`,
          `${dayRooms.length} lokale-dage i planen`,
          ...byDay.map((d) => `${d.label}: ${d.rooms.map((r) => r.lokale).join(", ")}`),
        ],
        onSave: (text: string) => {
          savePedelEvaluation({
            kind: "course",
            courseId,
            courseTitle: course.title,
            text,
            courseMeta: { id: courseId, weekNumber: course.weekNumber },
            enrolled: getRealiseretAntal(course),
            budgetStudents: getBudgetAntal(course),
          });
        },
      };
    }

    if (evalTarget.kind === "day") {
      const { day } = evalTarget;
      const existing = findPedelEvaluation("day", courseId, day.date);
      return {
        title: `Dagevaluering — ${day.label}`,
        subtitle: formatDate(day.date),
        initialText: existing?.text ?? "",
        contextLines: [
          `${day.rooms.length} lokale${day.rooms.length !== 1 ? "r" : ""}`,
          ...day.rooms.map(
            (r) =>
              `${r.lokale} · kl. ${timeSpanForRoom(r.entries)} · ${r.entries.length} punkt${r.entries.length !== 1 ? "er" : ""}`,
          ),
        ],
        onSave: (text: string) => {
          savePedelEvaluation({
            kind: "day",
            courseId,
            courseTitle: course.title,
            text,
            date: day.date,
            dayLabel: day.label,
            courseMeta: { id: courseId, weekNumber: course.weekNumber },
            enrolled: getRealiseretAntal(course),
            budgetStudents: getBudgetAntal(course),
          });
        },
      };
    }

    const { room } = evalTarget;
    const existing = findPedelEvaluation("room", courseId, room.dayDate, room.lokale);
    return {
      title: `Eva — ${room.lokale}`,
      subtitle: `${room.dayLabel} · ${formatDate(room.dayDate)}`,
      initialText: existing?.text ?? "",
      contextLines: buildRoomContextLines(room),
      onSave: (text: string) => {
        savePedelEvaluation({
          kind: "room",
          courseId,
          courseTitle: course.title,
          text,
          date: room.dayDate,
          dayLabel: room.dayLabel,
          lokale: room.lokale,
          room,
          courseMeta: { id: courseId, weekNumber: course.weekNumber },
          enrolled: getRealiseretAntal(course),
          budgetStudents: getBudgetAntal(course),
        });
      },
    };
  })();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/pedel"
          className="text-sm text-blue-700 hover:underline"
        >
          ← Tilbage til pedeloversigt
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-700" />
            <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
          </div>
          <Button
            type="button"
            variant="secondary"
            className={cn("gap-2", hasCourseEval && "ring-1 ring-emerald-400")}
            onClick={() => setEvalTarget({ kind: "course" })}
          >
            <ClipboardList className="size-4" />
            Evaluering
          </Button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(course.startDate)} – {formatDate(course.endDate)}
        </p>
        <div className="mt-3">
          <CourseEnrollmentBadges course={course} />
        </div>
      </div>

      {course.pedelGenerelleNoter?.trim() && (
        <Card className="border-blue-200 bg-blue-50">
          <CardTitle className="text-base text-blue-900">
            Generelle noter til pedel/rengøring
          </CardTitle>
          <CardDescription className="mt-2 whitespace-pre-wrap text-blue-950">
            {course.pedelGenerelleNoter}
          </CardDescription>
        </Card>
      )}

      {dayRooms.length === 0 ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardTitle className="text-base text-blue-900">
            Ingen lokaler planlagt endnu
          </CardTitle>
          <CardDescription className="text-blue-800">
            Kursuslederen skal vælge lokale under Oversigt & økonomi eller
            udfylde lokalespecifikation på enkeltmoduler i Modulplan.
          </CardDescription>
        </Card>
      ) : (
        byDay.map((day) => (
          <DayCard
            key={day.date}
            day={day}
            courseId={courseId}
            evalTick={evalTick}
            photoTick={photoTick}
            onOpenSetup={setSelectedRoom}
            onOpenEval={(target) => setEvalTarget(target)}
          />
        ))
      )}

      {selectedRoom && (
        <LokaleSetupDialog
          room={selectedRoom}
          courseId={courseId}
          courseTitle={course.title}
          onClose={() => setSelectedRoom(null)}
        />
      )}

      {evalDialogProps && (
        <PedelEvaluationDialog
          open
          title={evalDialogProps.title}
          subtitle={evalDialogProps.subtitle}
          initialText={evalDialogProps.initialText}
          contextLines={evalDialogProps.contextLines}
          onClose={() => setEvalTarget(null)}
          onSave={evalDialogProps.onSave}
        />
      )}
    </div>
  );
}

function DayCard({
  day,
  courseId,
  evalTick,
  photoTick,
  onOpenSetup,
  onOpenEval,
}: {
  day: DayGroup;
  courseId: string;
  evalTick: number;
  photoTick: number;
  onOpenSetup: (room: PedelDayRoom) => void;
  onOpenEval: (target: EvalTarget) => void;
}) {
  const hasDayEval = useMemo(
    () => hasPedelEvaluation("day", courseId, day.date),
    [courseId, day.date, evalTick],
  );

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-blue-200 bg-blue-50 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base text-blue-950">
              {day.label} · {formatDate(day.date)}
            </CardTitle>
            <CardDescription>
              {day.rooms.length} lokale{day.rooms.length !== 1 ? "r" : ""} skal
              klargøres — klik for opsætning
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            className={cn("h-8 shrink-0 gap-1.5 text-xs", hasDayEval && "ring-1 ring-emerald-400")}
            onClick={() => onOpenEval({ kind: "day", day })}
          >
            <ClipboardList className="size-3.5" />
            Evaluering
          </Button>
        </div>
      </div>
      <ul className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {day.rooms.map((room) => (
          <RoomTile
            key={`${room.dayDate}-${room.lokale}`}
            room={room}
            courseId={courseId}
            evalTick={evalTick}
            photoTick={photoTick}
            onOpenSetup={() => onOpenSetup(room)}
            onOpenEval={() => onOpenEval({ kind: "room", room })}
          />
        ))}
      </ul>
    </Card>
  );
}

function RoomTile({
  room,
  courseId,
  evalTick,
  photoTick,
  onOpenSetup,
  onOpenEval,
}: {
  room: PedelDayRoom;
  courseId: string;
  evalTick: number;
  photoTick: number;
  onOpenSetup: () => void;
  onOpenEval: () => void;
}) {
  const flags = formatLokaleFlags(room.entries[0].spec);
  const personer = Math.max(
    ...room.entries.map((e) => e.spec.antalPersoner),
  );

  const hasRoomEval = useMemo(
    () => hasPedelEvaluation("room", courseId, room.dayDate, room.lokale),
    [courseId, room.dayDate, room.lokale, evalTick],
  );

  const photoCount = useMemo(
    () => listPhotosForRoom(courseId, room.dayDate, room.lokale).length,
    [courseId, room.dayDate, room.lokale, photoTick],
  );

  return (
    <li>
      <div className="flex w-full flex-col rounded-xl border border-blue-200 bg-white transition hover:border-blue-400 hover:shadow-sm">
        <button
          type="button"
          onClick={onOpenSetup}
          className="flex w-full flex-col p-4 text-left hover:bg-blue-50/50"
        >
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900">{room.lokale}</p>
                {photoCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">
                    <Camera className="size-3" />
                    {photoCount}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                Kl. {timeSpanForRoom(room.entries)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            {personer > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                {personer} pers.
              </span>
            )}
            {room.entries[0].spec.bordopstilling && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                {room.entries[0].spec.bordopstilling}
              </span>
            )}
            {flags.slice(0, 2).map((f) => (
              <span
                key={f}
                className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800"
              >
                {f}
              </span>
            ))}
            {flags.length > 2 && (
              <span className="text-slate-500">+{flags.length - 2}</span>
            )}
          </div>
          <p className="mt-3 text-xs font-medium text-blue-700">
            Se opsætning →
          </p>
        </button>
        <div className="flex justify-end border-t border-blue-100 px-3 py-2">
          <Button
            type="button"
            variant="secondary"
            className={cn("h-7 px-2 text-xs", hasRoomEval && "ring-1 ring-emerald-400")}
            onClick={onOpenEval}
          >
            Eva
          </Button>
        </div>
      </div>
    </li>
  );
}
