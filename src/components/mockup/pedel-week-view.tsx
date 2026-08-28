"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LokaleSetupDialog } from "@/components/mockup/lokale-setup-dialog";
import { PedelEvaluationDialog } from "@/components/mockup/pedel-evaluation-dialog";
import { PedelDagensOpgaverCard } from "@/components/mockup/pedel-dagens-opgaver-card";
import { PedelDelegationTab } from "@/components/mockup/pedel-delegation-tab";
import { PedelEvaluationHistory } from "@/components/mockup/pedel-evaluation-history";
import { useAuth } from "@/context/auth-context";
import {
  canAccessPedelAdmin,
  isPedelassistent,
} from "@/lib/auth-permissions";
import { listUsersByRole } from "@/lib/auth-storage";
import {
  getCourseDetailById,
  getCoursesForYear,
} from "@/lib/course-list";
import {
  getBudgetAntal,
  getRealiseretAntal,
} from "@/lib/course-enrollment-counts";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import { addDaysIso, todayIso } from "@/lib/date-utils";
import { getIsoWeekForDate } from "@/lib/kitchen-active-meal";
import { getIsoWeekDays } from "@/lib/kitchen-week-calendar";
import { formatDate, weekLabel } from "@/lib/mock-data";
import { syncAllPedelDagensOpgaver } from "@/lib/pedel-auto-tasks";
import {
  buildRoomContextLines,
  findPedelEvaluation,
  hasPedelEvaluation,
  PEDEL_EVALUATION_UPDATED_EVENT,
  savePedelEvaluation,
} from "@/lib/pedel-evaluation-storage";
import { PEDEL_NOTIFICATIONS_UPDATED_EVENT } from "@/lib/pedel-notifications-storage";
import {
  listPhotosForRoom,
  PEDEL_SETUP_PHOTO_UPDATED_EVENT,
} from "@/lib/pedel-setup-photo-storage";
import {
  assignPedelLeaderTask,
  completePedelTask,
  getIncompletePedelTasksForAssignee,
  getLeaderPedelDagensOpgaver,
  PEDEL_TASKS_UPDATED_EVENT,
  type PedelTask,
} from "@/lib/pedel-task-storage";
import {
  formatLokaleFlags,
  getPedelWeekRoomsForCourse,
  groupPedelWeekRoomsByDate,
  timeSpanForRoom,
  type PedelWeekRoom,
} from "@/lib/pedel-utils";
import { cn } from "@/lib/utils";

type MainTab = "oversigt" | "uddelegering";

type DayGroup = {
  label: string;
  date: string;
  rooms: PedelWeekRoom[];
};

type EvalTarget =
  | { kind: "day"; day: DayGroup }
  | { kind: "room"; room: PedelWeekRoom };

function pedelWeekPath(year: number, weekNumber: number): string {
  return `/pedel/uge/${year}/${weekNumber}`;
}

function roomFromTask(
  task: PedelTask,
  weekRooms: PedelWeekRoom[],
): PedelWeekRoom | null {
  if (task.type !== "lokale") return null;
  const found = weekRooms.find(
    (r) =>
      r.courseId === task.courseId &&
      `${r.courseId}|${r.dayDate}|${r.lokale}` === task.targetKey,
  );
  if (found) return found;

  const [courseId, dayDate, lokale] = task.targetKey.split("|");
  if (!courseId || !dayDate || !lokale) return null;
  const detail = getCourseDetailById(courseId);
  if (!detail) return null;
  const course = mergeCoursePlan(detail);
  return (
    getPedelWeekRoomsForCourse(courseId, course).find(
      (r) => r.dayDate === dayDate && r.lokale === lokale,
    ) ?? null
  );
}

function PedelTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-blue-700 text-white shadow-sm"
          : "text-blue-900 hover:bg-blue-100",
      )}
    >
      {children}
    </button>
  );
}

export function PedelWeekView({
  year,
  weekNumber,
}: {
  year: number;
  weekNumber: number;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const today = todayIso();
  const tomorrow = addDaysIso(today, 1);
  const [hydrated, setHydrated] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("oversigt");
  const [taskTick, setTaskTick] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<PedelWeekRoom | null>(null);
  const [evalTarget, setEvalTarget] = useState<EvalTarget | null>(null);
  const [evalTick, setEvalTick] = useState(0);
  const [photoTick, setPhotoTick] = useState(0);

  const reloadTasks = useCallback(() => setTaskTick((t) => t + 1), []);

  const showDelegation = user && canAccessPedelAdmin(user.role);
  const isAssistant = user && isPedelassistent(user.role);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "uddelegering" && user && canAccessPedelAdmin(user.role)) {
      setMainTab("uddelegering");
    }
  }, [user]);

  useEffect(() => {
    function onTaskUpdate() {
      syncAllPedelDagensOpgaver(today);
      reloadTasks();
    }
    syncAllPedelDagensOpgaver(today);
    window.addEventListener(PEDEL_TASKS_UPDATED_EVENT, onTaskUpdate);
    window.addEventListener(PEDEL_NOTIFICATIONS_UPDATED_EVENT, onTaskUpdate);
    return () => {
      window.removeEventListener(PEDEL_TASKS_UPDATED_EVENT, onTaskUpdate);
      window.removeEventListener(PEDEL_NOTIFICATIONS_UPDATED_EVENT, onTaskUpdate);
    };
  }, [reloadTasks, today]);

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

  const currentIsoWeek = useMemo(
    () => getIsoWeekForDate(new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hydrated],
  );

  const isCurrentWeek =
    year === currentIsoWeek.year && weekNumber === currentIsoWeek.weekNumber;

  const weekCourses = useMemo(() => {
    if (!hydrated) return [];
    return getCoursesForYear(year)
      .filter((entry) => entry.weekNumber === weekNumber)
      .map((entry) => {
        const detail = getCourseDetailById(entry.id);
        if (!detail) return null;
        const course = mergeCoursePlan(detail);
        return { entry, course };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.course.title.localeCompare(b.course.title, "da"));
  }, [hydrated, year, weekNumber]);

  const weekRooms = useMemo(() => {
    const rooms: PedelWeekRoom[] = [];
    for (const { entry, course } of weekCourses) {
      rooms.push(...getPedelWeekRoomsForCourse(entry.id, course));
    }
    return rooms;
  }, [weekCourses]);

  const byDay = useMemo(
    () => groupPedelWeekRoomsByDate(weekRooms),
    [weekRooms],
  );

  const coursesWithNotes = weekCourses.filter(({ course }) =>
    course.pedelGenerelleNoter?.trim(),
  );

  const shiftWeek = useCallback(
    (deltaWeeks: number) => {
      const days = getIsoWeekDays(year, weekNumber);
      const anchor = new Date(`${days[0].date}T12:00:00Z`);
      anchor.setUTCDate(anchor.getUTCDate() + deltaWeeks * 7);
      const next = getIsoWeekForDate(anchor);
      router.push(pedelWeekPath(next.year, next.weekNumber));
    },
    [year, weekNumber, router],
  );

  const goToCurrentWeek = useCallback(() => {
    const current = getIsoWeekForDate(new Date());
    router.push(pedelWeekPath(current.year, current.weekNumber));
  }, [router]);

  const dagensTasks = useMemo(() => {
    if (!hydrated || !user) return [];
    if (isAssistant) {
      return getIncompletePedelTasksForAssignee(user.id, today, tomorrow);
    }
    return getLeaderPedelDagensOpgaver(today, tomorrow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, isAssistant, today, tomorrow, taskTick]);

  const assistants = useMemo(
    () => listUsersByRole("pedelassistent"),
    [taskTick],
  );

  const handleTaskClick = useCallback(
    (task: PedelTask) => {
      if (task.type !== "lokale") return;
      const room = roomFromTask(task, weekRooms);
      if (room) setSelectedRoom(room);
    },
    [weekRooms],
  );

  const evalDialogProps = (() => {
    if (!evalTarget) return null;

    if (evalTarget.kind === "day") {
      const { day } = evalTarget;
      const courseIds = [...new Set(day.rooms.map((r) => r.courseId))];
      const primaryCourseId = courseIds[0] ?? "";
      const primaryCourse = weekCourses.find((c) => c.entry.id === primaryCourseId);
      const existing = primaryCourseId
        ? findPedelEvaluation("day", primaryCourseId, day.date)
        : undefined;
      return {
        title: `Dagevaluering — ${day.label}`,
        subtitle: `${weekLabel(weekNumber)} · ${formatDate(day.date)}`,
        initialText: existing?.text ?? "",
        contextLines: [
          `${day.rooms.length} lokale${day.rooms.length !== 1 ? "r" : ""} på tværs af ${courseIds.length} kursus${courseIds.length !== 1 ? "er" : ""}`,
          ...day.rooms.map(
            (r) =>
              `${r.courseTitle}: ${r.lokale} · kl. ${timeSpanForRoom(r.entries)}`,
          ),
        ],
        onSave: (text: string) => {
          if (!primaryCourse) return;
          savePedelEvaluation({
            kind: "day",
            courseId: primaryCourseId,
            courseTitle: primaryCourse.course.title,
            text,
            date: day.date,
            dayLabel: day.label,
            courseMeta: { id: primaryCourseId, weekNumber },
            enrolled: getRealiseretAntal(primaryCourse.entry),
            budgetStudents: getBudgetAntal(primaryCourse.entry),
          });
        },
      };
    }

    const { room } = evalTarget;
    const courseEntry = weekCourses.find((c) => c.entry.id === room.courseId);
    const existing = findPedelEvaluation(
      "room",
      room.courseId,
      room.dayDate,
      room.lokale,
    );
    return {
      title: `Eva — ${room.lokale}`,
      subtitle: `${room.courseTitle} · ${room.dayLabel} · ${formatDate(room.dayDate)}`,
      initialText: existing?.text ?? "",
      contextLines: buildRoomContextLines(room),
      onSave: (text: string) => {
        savePedelEvaluation({
          kind: "room",
          courseId: room.courseId,
          courseTitle: room.courseTitle,
          text,
          date: room.dayDate,
          dayLabel: room.dayLabel,
          lokale: room.lokale,
          room,
          courseMeta: { id: room.courseId, weekNumber },
          enrolled: courseEntry ? getRealiseretAntal(courseEntry.entry) : 0,
          budgetStudents: courseEntry ? getBudgetAntal(courseEntry.entry) : 0,
        });
      },
    };
  })();

  if (!hydrated) {
    return (
      <Card>
        <CardDescription>Indlæser pedeloversigt…</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pedel</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dagens opgaver og lokaler samlet pr. uge — på tværs af kurser
        </p>
      </div>

      <PedelDagensOpgaverCard
        today={today}
        tasks={dagensTasks}
        assistants={showDelegation ? assistants : undefined}
        showAssign={Boolean(showDelegation)}
        onAssign={
          showDelegation
            ? (taskId, assigneeUserId) => {
                assignPedelLeaderTask(taskId, assigneeUserId);
                reloadTasks();
              }
            : undefined
        }
        onComplete={(task) => {
          completePedelTask(task);
          reloadTasks();
        }}
        onTaskClick={handleTaskClick}
      />

      {showDelegation && (
        <div className="flex gap-1 rounded-lg border border-blue-200 bg-blue-50/50 p-1">
          <PedelTabButton
            active={mainTab === "oversigt"}
            onClick={() => setMainTab("oversigt")}
          >
            Ugeoversigt
          </PedelTabButton>
          <PedelTabButton
            active={mainTab === "uddelegering"}
            onClick={() => setMainTab("uddelegering")}
          >
            Uddelegering
          </PedelTabButton>
        </div>
      )}

      {mainTab === "uddelegering" && showDelegation ? (
        <PedelDelegationTab today={today} />
      ) : (
        <>
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-blue-700" />
            <div>
              <CardTitle className="text-base">
                {weekLabel(weekNumber)} · {year}
              </CardTitle>
              <CardDescription>
                {weekCourses.length} kursus
                {weekCourses.length !== 1 ? "er" : ""} · {weekRooms.length}{" "}
                lokale-dage
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Forrige uge
            </button>
            <Button
              type="button"
              onClick={() => shiftWeek(1)}
              className="bg-blue-700 hover:bg-blue-800"
            >
              Næste uge
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isCurrentWeek && (
              <button
                type="button"
                onClick={goToCurrentWeek}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-800 underline-offset-2 transition hover:underline"
              >
                Denne uge
              </button>
            )}
          </div>
        </div>
      </Card>

      {weekCourses.length > 0 && (
        <Card className="border-slate-200 bg-slate-50/60">
          <CardTitle className="text-sm text-slate-800">
            Kurser i {weekLabel(weekNumber)}
          </CardTitle>
          <ul className="mt-2 flex flex-wrap gap-2">
            {weekCourses.map(({ entry, course }) => (
              <li
                key={entry.id}
                className="rounded-full bg-white px-3 py-1 text-sm text-slate-700 ring-1 ring-slate-200"
              >
                {course.title}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {coursesWithNotes.map(({ entry, course }) => (
        <Card key={entry.id} className="border-blue-200 bg-blue-50">
          <CardTitle className="text-base text-blue-900">
            Generelle noter til pedel
          </CardTitle>
          <p className="mt-1 text-sm font-medium text-blue-800">
            Kursus: {course.title}
          </p>
          <CardDescription className="mt-2 whitespace-pre-wrap text-blue-950">
            {course.pedelGenerelleNoter}
          </CardDescription>
        </Card>
      ))}

      {weekRooms.length === 0 ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardTitle className="text-base text-blue-900">
            Ingen lokaler i {weekLabel(weekNumber)}
          </CardTitle>
          <CardDescription className="text-blue-800">
            {weekCourses.length === 0
              ? "Der er ingen kurser planlagt i denne uge endnu."
              : "Kursuslederne skal vælge lokale under Oversigt & økonomi eller udfylde lokalespecifikation i Modulplan."}
          </CardDescription>
        </Card>
      ) : (
        byDay.map((day) => (
          <DayCard
            key={day.date}
            day={day}
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
          courseId={selectedRoom.courseId}
          courseTitle={selectedRoom.courseTitle}
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

      <PedelEvaluationHistory />
        </>
      )}
    </div>
  );
}

function DayCard({
  day,
  evalTick,
  photoTick,
  onOpenSetup,
  onOpenEval,
}: {
  day: DayGroup;
  evalTick: number;
  photoTick: number;
  onOpenSetup: (room: PedelWeekRoom) => void;
  onOpenEval: (target: EvalTarget) => void;
}) {
  const courseIds = [...new Set(day.rooms.map((r) => r.courseId))];
  const hasDayEval = courseIds.some((courseId) =>
    hasPedelEvaluation("day", courseId, day.date),
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
              {day.rooms.length} lokale{day.rooms.length !== 1 ? "r" : ""} fra{" "}
              {courseIds.length} kursus{courseIds.length !== 1 ? "er" : ""} —
              klik for opsætning
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            className={cn(
              "h-8 shrink-0 gap-1.5 text-xs",
              hasDayEval && "ring-1 ring-emerald-400",
            )}
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
            key={`${room.courseId}-${room.dayDate}-${room.lokale}`}
            room={room}
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
  evalTick,
  photoTick,
  onOpenSetup,
  onOpenEval,
}: {
  room: PedelWeekRoom;
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
    () =>
      hasPedelEvaluation("room", room.courseId, room.dayDate, room.lokale),
    [room.courseId, room.dayDate, room.lokale, evalTick],
  );

  const photoCount = useMemo(
    () => listPhotosForRoom(room.courseId, room.dayDate, room.lokale).length,
    [room.courseId, room.dayDate, room.lokale, photoTick],
  );

  return (
    <li>
      <div className="flex w-full flex-col rounded-xl border border-blue-200 bg-white transition hover:border-blue-400 hover:shadow-sm">
        <button
          type="button"
          onClick={onOpenSetup}
          className="flex w-full flex-col p-4 text-left hover:bg-blue-50/50"
        >
          <p className="mb-2 text-xs font-medium text-blue-800">
            {room.courseTitle}
          </p>
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
            className={cn(
              "h-7 px-2 text-xs",
              hasRoomEval && "ring-1 ring-emerald-400",
            )}
            onClick={onOpenEval}
          >
            Eva
          </Button>
        </div>
      </div>
    </li>
  );
}
