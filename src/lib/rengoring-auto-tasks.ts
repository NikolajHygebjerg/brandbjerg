import { addDaysIso } from "./date-utils";
import { getCourseDetailById, getCoursesForYear } from "./course-list";
import { mergeCoursePlan } from "./course-plan-storage";
import { getPedelDayRooms } from "./pedel-utils";
import {
  lokaleTargetKey,
  vaerelseTargetKey,
} from "./rengoring-delegation-utils";
import { getVaerelserWithCheckoutOnDate } from "./rengoring-room-utils";
import { isLokaleKlar, isVaerelseKlar } from "./rengoring-storage";
import {
  getAssignmentForTarget,
  loadRengoringTasks,
  mergeSyncedAutoTasks,
  type RengoringTask,
} from "./rengoring-task-storage";

const DEPARTURE_DUE_BY = "09:00";

export interface DepartureTaskSpec {
  type: RengoringTask["type"];
  targetKey: string;
  label: string;
  note?: string;
  lokaleId?: string;
}

function isDepartureAlreadyKlar(spec: DepartureTaskSpec, date: string): boolean {
  if (spec.type === "vaerelse") {
    return isVaerelseKlar(spec.targetKey, date);
  }
  if (spec.lokaleId) {
    return isLokaleKlar(spec.lokaleId);
  }
  return false;
}

export function getDepartureTasksForDate(date: string): DepartureTaskSpec[] {
  const specs: DepartureTaskSpec[] = [];

  for (const roomNumber of getVaerelserWithCheckoutOnDate(date)) {
    specs.push({
      type: "vaerelse",
      targetKey: vaerelseTargetKey(roomNumber),
      label: `Værelse ${roomNumber}`,
      note: "Check-out i dag — gøres rent før kl. 09:00",
    });
  }

  const year = parseInt(date.slice(0, 4), 10);
  const seenLokaler = new Set<string>();

  for (const entry of getCoursesForYear(year)) {
    if (!entry.endDate) continue;
    if (addDaysIso(entry.endDate, 1) !== date) continue;

    const course = getCourseDetailById(entry.id);
    if (!course) continue;

    const merged = mergeCoursePlan(course);
    const dayRooms = getPedelDayRooms(merged);

    for (const room of dayRooms) {
      const targetKey = lokaleTargetKey(room.lokale);
      if (seenLokaler.has(targetKey)) continue;
      seenLokaler.add(targetKey);

      const lastUse = dayRooms
        .filter((r) => r.lokale === room.lokale)
        .sort((a, b) => b.dayDate.localeCompare(a.dayDate))[0];

      specs.push({
        type: "lokale",
        targetKey,
        label: room.lokale,
        note: `Kursus afsluttet: ${entry.title} — gøres rent før kl. 09:00`,
        lokaleId: lastUse
          ? `${entry.id}|${lastUse.dayDate}|${lastUse.lokale}`
          : undefined,
      });
    }
  }

  return specs.sort((a, b) => a.label.localeCompare(b.label, "da"));
}

export function syncAutoRengoringTasksForDate(date: string): number {
  if (typeof window === "undefined") return 0;

  const departures = getDepartureTasksForDate(date);
  const now = new Date().toISOString();
  const toMerge: RengoringTask[] = [];

  for (const dep of departures) {
    if (isDepartureAlreadyKlar(dep, date)) continue;

    const existing = loadRengoringTasks().find(
      (t) =>
        t.date === date &&
        t.type === dep.type &&
        t.targetKey === dep.targetKey,
    );
    if (existing?.completed) continue;

    const delegation = getAssignmentForTarget(date, dep.type, dep.targetKey);
    const assignee =
      existing?.assigneeUserId || delegation?.assigneeUserId || "";

    toMerge.push({
      id:
        existing?.id ??
        `rt-auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      assigneeUserId: assignee,
      date,
      type: dep.type,
      targetKey: dep.targetKey,
      label: dep.label,
      note: dep.note,
      lokaleId: dep.lokaleId ?? existing?.lokaleId,
      completed: false,
      published: Boolean(assignee),
      publishedAt: assignee ? existing?.publishedAt ?? now : undefined,
      source: "auto",
      dueBy: DEPARTURE_DUE_BY,
      createdAt: existing?.createdAt ?? now,
    });
  }

  return mergeSyncedAutoTasks(toMerge) ? toMerge.length : 0;
}
