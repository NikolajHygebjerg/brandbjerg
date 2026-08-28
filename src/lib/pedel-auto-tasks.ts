import { addDaysIso, todayIso } from "./date-utils";
import { getLokalerForRengoringDate } from "./rengoring-lokale-utils";
import { getPedelNotifications } from "./pedel-notifications-storage";
import {
  getPedelAssignmentForTarget,
  loadPedelTasks,
  mergeSyncedPedelAutoTasks,
  type PedelTask,
} from "./pedel-task-storage";

export function getSetupTasksForDate(date: string): Omit<
  PedelTask,
  "id" | "createdAt" | "completed" | "published" | "publishedAt"
>[] {
  const specs: Omit<
    PedelTask,
    "id" | "createdAt" | "completed" | "published" | "publishedAt"
  >[] = [];

  for (const row of getLokalerForRengoringDate(date)) {
    const dueBy =
      row.timeSpan.split("–")[0]?.trim() || row.timeSpan.split("-")[0]?.trim();

    specs.push({
      assigneeUserId: "",
      date,
      type: "lokale",
      targetKey: row.id,
      label: `${row.lokale} — ${row.courseTitle}`,
      note: `Klargøring · kl. ${row.timeSpan}`,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      dueBy: dueBy || undefined,
      source: "auto",
    });
  }

  return specs;
}

export function syncAutoPedelTasksForDates(dates: string[]): number {
  if (typeof window === "undefined") return 0;

  const now = new Date().toISOString();
  const toMerge: PedelTask[] = [];

  for (const date of dates) {
    for (const spec of getSetupTasksForDate(date)) {
      const existing = loadPedelTasks().find(
        (t) =>
          t.date === date &&
          t.type === spec.type &&
          t.targetKey === spec.targetKey,
      );
      if (existing?.completed) continue;

      const delegation = getPedelAssignmentForTarget(
        date,
        spec.type,
        spec.targetKey,
      );
      const assignee =
        existing?.assigneeUserId || delegation?.assigneeUserId || "";

      toMerge.push({
        id:
          existing?.id ??
          `pt-auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        assigneeUserId: assignee,
        date: spec.date,
        type: spec.type,
        targetKey: spec.targetKey,
        label: spec.label,
        note: spec.note,
        courseId: spec.courseId,
        courseTitle: spec.courseTitle,
        completed: false,
        published: Boolean(assignee),
        publishedAt: assignee ? existing?.publishedAt ?? now : undefined,
        source: "auto",
        dueBy: spec.dueBy,
        createdAt: existing?.createdAt ?? now,
      });
    }
  }

  return mergeSyncedPedelAutoTasks(toMerge) ? toMerge.length : 0;
}

export function syncPedelTasksForTodayAndTomorrow(today?: string): number {
  const base = today ?? todayIso();
  return syncAutoPedelTasksForDates([base, addDaysIso(base, 1)]);
}

export function syncPedelNotificationTasks(): number {
  if (typeof window === "undefined") return 0;

  const now = new Date().toISOString();
  const today = todayIso();
  const toMerge: PedelTask[] = [];

  for (const notification of getPedelNotifications()) {
    const date = notification.createdAt.slice(0, 10) || today;
    const targetKey = `besked:${notification.id}`;

    const existing = loadPedelTasks().find(
      (t) => t.type === "besked" && t.targetKey === targetKey,
    );
    if (existing?.completed) continue;

    const delegation = getPedelAssignmentForTarget(date, "besked", targetKey);
    const assignee =
      existing?.assigneeUserId || delegation?.assigneeUserId || "";

    toMerge.push({
      id:
        existing?.id ??
        `pt-besked-${notification.id}`,
      assigneeUserId: assignee,
      date,
      type: "besked",
      targetKey,
      label: notification.targetLabel || "Pedelopgave",
      note: notification.message,
      notificationId: notification.messageId ?? notification.id,
      completed: false,
      published: true,
      publishedAt: existing?.publishedAt ?? now,
      source: "afdeling",
      createdAt: existing?.createdAt ?? notification.createdAt,
    });
  }

  return mergeSyncedPedelAutoTasks(toMerge) ? toMerge.length : 0;
}

export function syncAllPedelDagensOpgaver(today?: string): number {
  const setup = syncPedelTasksForTodayAndTomorrow(today);
  const beskeder = syncPedelNotificationTasks();
  return setup + beskeder;
}
