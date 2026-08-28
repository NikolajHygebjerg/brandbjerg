import { markPedelNotificationRead } from "./pedel-notifications-storage";

export type PedelTaskType = "lokale" | "besked";

export interface PedelTask {
  id: string;
  assigneeUserId: string;
  date: string;
  type: PedelTaskType;
  targetKey: string;
  label: string;
  note?: string;
  courseId?: string;
  courseTitle?: string;
  /** Reference til besked fra anden afdeling */
  notificationId?: string;
  completed: boolean;
  published: boolean;
  publishedAt?: string;
  source?: "auto" | "manual" | "afdeling";
  dueBy?: string;
  createdAt: string;
}

const STORAGE_KEY = "brandbjerg-pedel-tasks";
export const PEDEL_TASKS_UPDATED_EVENT = "brandbjerg-pedel-tasks-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PEDEL_TASKS_UPDATED_EVENT));
  }
}

function taskKey(date: string, type: PedelTaskType, targetKey: string): string {
  return `${date}|${type}|${targetKey}`;
}

function normalizeTask(raw: PedelTask): PedelTask {
  return {
    ...raw,
    assigneeUserId: raw.assigneeUserId ?? "",
    published: raw.published ?? true,
    source: raw.source ?? "manual",
  };
}

export function loadPedelTasks(): PedelTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as PedelTask[]).map(normalizeTask);
  } catch {
    return [];
  }
}

export function savePedelTasks(tasks: PedelTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  emitUpdate();
}

export function upsertPedelAssignment(input: {
  date: string;
  type: PedelTaskType;
  targetKey: string;
  label: string;
  assigneeUserId: string;
  courseId?: string;
  courseTitle?: string;
  dueBy?: string;
}): PedelTask | void {
  const all = loadPedelTasks();
  const key = taskKey(input.date, input.type, input.targetKey);
  const idx = all.findIndex(
    (t) => taskKey(t.date, t.type, t.targetKey) === key,
  );

  if (!input.assigneeUserId) {
    if (idx >= 0) {
      if (all[idx].source === "auto" || all[idx].source === "afdeling") {
        all[idx] = {
          ...all[idx],
          assigneeUserId: "",
          published: false,
          publishedAt: undefined,
        };
        savePedelTasks(all);
        return all[idx];
      }
      all.splice(idx, 1);
      savePedelTasks(all);
    }
    return;
  }

  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      assigneeUserId: input.assigneeUserId,
      label: input.label,
      courseId: input.courseId ?? all[idx].courseId,
      courseTitle: input.courseTitle ?? all[idx].courseTitle,
      dueBy: input.dueBy ?? all[idx].dueBy,
      source: all[idx].source ?? "manual",
      published: false,
      publishedAt: undefined,
      completed: false,
    };
    savePedelTasks(all);
    return all[idx];
  }

  const task: PedelTask = {
    id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    assigneeUserId: input.assigneeUserId,
    date: input.date,
    type: input.type,
    targetKey: input.targetKey,
    label: input.label,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    dueBy: input.dueBy,
    completed: false,
    published: false,
    source: "manual",
    createdAt: new Date().toISOString(),
  };
  all.push(task);
  savePedelTasks(all);
  return task;
}

export function publishPedelAssignmentsForDate(date: string): number {
  const now = new Date().toISOString();
  let count = 0;
  const all = loadPedelTasks().map((t) => {
    if (t.date !== date || !t.assigneeUserId) return t;
    if (t.published) return t;
    count += 1;
    return { ...t, published: true, publishedAt: now };
  });
  savePedelTasks(all);
  return count;
}

export function getPedelAssignmentForTarget(
  date: string,
  type: PedelTaskType,
  targetKey: string,
): PedelTask | null {
  const key = taskKey(date, type, targetKey);
  return (
    loadPedelTasks().find(
      (t) => taskKey(t.date, t.type, t.targetKey) === key,
    ) ?? null
  );
}

export function countUnpublishedPedelAssignments(date: string): number {
  return loadPedelTasks().filter(
    (t) => t.date === date && t.assigneeUserId && !t.published,
  ).length;
}

export function assignPedelLeaderTask(
  taskId: string,
  assigneeUserId: string,
): void {
  const now = new Date().toISOString();
  const all = loadPedelTasks().map((t) => {
    if (t.id !== taskId) return t;
    return {
      ...t,
      assigneeUserId,
      published: Boolean(assigneeUserId),
      publishedAt: assigneeUserId ? now : undefined,
    };
  });
  savePedelTasks(all);
}

export function updatePedelTask(
  id: string,
  patch: Partial<Pick<PedelTask, "completed" | "assigneeUserId" | "published" | "publishedAt">>,
): void {
  const all = loadPedelTasks().map((t) =>
    t.id === id ? { ...t, ...patch } : t,
  );
  savePedelTasks(all);
}

export function pedelLokaleTargetKey(
  courseId: string,
  dayDate: string,
  lokale: string,
): string {
  return `${courseId}|${dayDate}|${lokale}`;
}

export function isPedelLokaleCompleted(
  courseId: string,
  dayDate: string,
  lokale: string,
): boolean {
  const targetKey = pedelLokaleTargetKey(courseId, dayDate, lokale);
  const task = getPedelAssignmentForTarget(dayDate, "lokale", targetKey);
  return task?.completed ?? false;
}

export function setPedelLokaleCompleted(input: {
  courseId: string;
  dayDate: string;
  lokale: string;
  courseTitle: string;
  label?: string;
  dueBy?: string;
  completed: boolean;
}): void {
  const targetKey = pedelLokaleTargetKey(
    input.courseId,
    input.dayDate,
    input.lokale,
  );
  const label =
    input.label ?? `${input.lokale} — ${input.courseTitle}`;
  const existing = getPedelAssignmentForTarget(
    input.dayDate,
    "lokale",
    targetKey,
  );

  if (existing) {
    updatePedelTask(existing.id, { completed: input.completed });
    if (input.completed && existing.notificationId) {
      markPedelNotificationRead(existing.notificationId);
    }
    return;
  }

  if (!input.completed) return;

  const now = new Date().toISOString();
  const all = loadPedelTasks();
  all.push({
    id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    assigneeUserId: "",
    date: input.dayDate,
    type: "lokale",
    targetKey,
    label,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    dueBy: input.dueBy,
    completed: true,
    published: true,
    publishedAt: now,
    source: "auto",
    createdAt: now,
  });
  savePedelTasks(all);
}

export type PedelCompletionFilter = "all" | "pending" | "completed";

function matchesCompletionFilter(
  completed: boolean,
  filter: PedelCompletionFilter,
): boolean {
  if (filter === "pending") return !completed;
  if (filter === "completed") return completed;
  return true;
}

export function setPedelTaskCompleted(task: PedelTask, completed: boolean): void {
  updatePedelTask(task.id, { completed });
  if (completed && task.notificationId) {
    markPedelNotificationRead(task.notificationId);
  }
}

export function completePedelTask(task: PedelTask): void {
  setPedelTaskCompleted(task, true);
}

export function togglePedelTaskCompleted(task: PedelTask): void {
  setPedelTaskCompleted(task, !task.completed);
}

export function getPedelTasksForAssignee(
  userId: string,
  date?: string,
): PedelTask[] {
  return loadPedelTasks()
    .filter(
      (t) =>
        t.assigneeUserId === userId &&
        t.published &&
        (!date || t.date === date),
    )
    .sort((a, b) => a.label.localeCompare(b.label, "da"));
}

export function getIncompletePedelTasksForAssignee(
  userId: string,
  today: string,
  tomorrow: string,
  filter: PedelCompletionFilter = "pending",
): PedelTask[] {
  return loadPedelTasks()
    .filter((t) => {
      if (t.assigneeUserId !== userId || !t.published) return false;
      const inScope =
        t.date === today ||
        t.date === tomorrow ||
        t.source === "afdeling";
      if (!inScope) return false;
      return matchesCompletionFilter(t.completed, filter);
    })
    .sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.label.localeCompare(b.label, "da");
    });
}

export function getLeaderPedelDagensOpgaver(
  today: string,
  tomorrow: string,
  filter: PedelCompletionFilter = "pending",
): PedelTask[] {
  return loadPedelTasks()
    .filter((t) => {
      const inScope =
        (t.type === "lokale" && (t.date === today || t.date === tomorrow)) ||
        t.source === "afdeling";
      if (!inScope) return false;
      return matchesCompletionFilter(t.completed, filter);
    })
    .sort((a, b) => {
      const aUnassigned = !a.assigneeUserId ? 0 : 1;
      const bUnassigned = !b.assigneeUserId ? 0 : 1;
      if (aUnassigned !== bUnassigned) return aUnassigned - bUnassigned;
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.label.localeCompare(b.label, "da");
    });
}

export function mergeSyncedPedelAutoTasks(tasks: PedelTask[]): boolean {
  const existing = loadPedelTasks();
  const byKey = new Map(
    existing.map((t) => [taskKey(t.date, t.type, t.targetKey), t]),
  );
  let changed = false;

  for (const task of tasks) {
    const key = taskKey(task.date, task.type, task.targetKey);
    const current = byKey.get(key);
    if (current) {
      if (current.completed) continue;
      const assignee =
        current.assigneeUserId || task.assigneeUserId || "";
      byKey.set(key, {
        ...current,
        source: current.source ?? task.source ?? "auto",
        dueBy: task.dueBy ?? current.dueBy,
        label: task.label,
        note: task.note ?? current.note,
        courseId: task.courseId ?? current.courseId,
        courseTitle: task.courseTitle ?? current.courseTitle,
        notificationId: task.notificationId ?? current.notificationId,
        assigneeUserId: assignee,
        published:
          current.source === "afdeling" ||
          task.source === "afdeling" ||
          Boolean(assignee),
        publishedAt:
          current.source === "afdeling" || task.source === "afdeling"
            ? current.publishedAt ?? task.publishedAt ?? new Date().toISOString()
            : assignee
              ? current.publishedAt ?? task.publishedAt ?? new Date().toISOString()
              : undefined,
      });
      changed = true;
    } else {
      byKey.set(key, task);
      changed = true;
    }
  }

  if (changed) {
    savePedelTasks(Array.from(byKey.values()));
  }
  return changed;
}
