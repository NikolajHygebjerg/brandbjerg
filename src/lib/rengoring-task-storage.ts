import type { UserRole } from "./auth-types";

export interface RengoringTask {
  id: string;
  assigneeUserId: string;
  date: string;
  type: "vaerelse" | "lokale";
  targetKey: string;
  label: string;
  note?: string;
  completed: boolean;
  /** Assistenter ser kun publicerede opgaver */
  published: boolean;
  publishedAt?: string;
  createdAt: string;
}

const STORAGE_KEY = "brandbjerg-rengoring-tasks";
export const RENGORING_TASKS_UPDATED_EVENT = "brandbjerg-rengoring-tasks-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(RENGORING_TASKS_UPDATED_EVENT));
  }
}

function taskKey(date: string, type: RengoringTask["type"], targetKey: string): string {
  return `${date}|${type}|${targetKey}`;
}

function normalizeTask(raw: RengoringTask): RengoringTask {
  return {
    ...raw,
    published: raw.published ?? true,
  };
}

export function loadRengoringTasks(): RengoringTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as RengoringTask[]).map(normalizeTask);
  } catch {
    return [];
  }
}

function saveTasks(tasks: RengoringTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  emitUpdate();
}

export function createRengoringTask(
  input: Omit<RengoringTask, "id" | "createdAt" | "completed" | "published"> & {
    published?: boolean;
  },
): RengoringTask {
  const task: RengoringTask = {
    ...input,
    id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    completed: false,
    published: input.published ?? true,
    publishedAt: input.published ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };
  const all = loadRengoringTasks();
  all.push(task);
  saveTasks(all);
  return task;
}

export function upsertRengoringAssignment(input: {
  date: string;
  type: RengoringTask["type"];
  targetKey: string;
  label: string;
  assigneeUserId: string;
}): RengoringTask | void {
  const all = loadRengoringTasks();
  const key = taskKey(input.date, input.type, input.targetKey);
  const idx = all.findIndex(
    (t) => taskKey(t.date, t.type, t.targetKey) === key,
  );

  if (!input.assigneeUserId) {
    if (idx >= 0) {
      all.splice(idx, 1);
      saveTasks(all);
    }
    return;
  }

  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      assigneeUserId: input.assigneeUserId,
      label: input.label,
      published: false,
      publishedAt: undefined,
      completed: false,
    };
    saveTasks(all);
    return all[idx];
  }

  const task: RengoringTask = {
    id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    assigneeUserId: input.assigneeUserId,
    date: input.date,
    type: input.type,
    targetKey: input.targetKey,
    label: input.label,
    completed: false,
    published: false,
    createdAt: new Date().toISOString(),
  };
  all.push(task);
  saveTasks(all);
  return task;
}

export function publishAssignmentsForDate(date: string): number {
  const now = new Date().toISOString();
  let count = 0;
  const all = loadRengoringTasks().map((t) => {
    if (t.date !== date || !t.assigneeUserId) return t;
    if (t.published) return t;
    count += 1;
    return { ...t, published: true, publishedAt: now };
  });
  saveTasks(all);
  return count;
}

export function getAssignmentForTarget(
  date: string,
  type: RengoringTask["type"],
  targetKey: string,
): RengoringTask | null {
  const key = taskKey(date, type, targetKey);
  return (
    loadRengoringTasks().find(
      (t) => taskKey(t.date, t.type, t.targetKey) === key,
    ) ?? null
  );
}

export function getAssignmentsForDate(date: string): RengoringTask[] {
  return loadRengoringTasks()
    .filter((t) => t.date === date && t.assigneeUserId)
    .sort((a, b) => a.label.localeCompare(b.label, "da"));
}

export function countUnpublishedAssignments(date: string): number {
  return loadRengoringTasks().filter(
    (t) => t.date === date && t.assigneeUserId && !t.published,
  ).length;
}

export function updateRengoringTask(
  id: string,
  patch: Partial<
    Pick<
      RengoringTask,
      "assigneeUserId" | "date" | "label" | "note" | "completed" | "published"
    >
  >,
): void {
  const all = loadRengoringTasks().map((t) =>
    t.id === id ? { ...t, ...patch } : t,
  );
  saveTasks(all);
}

export function deleteRengoringTask(id: string): void {
  saveTasks(loadRengoringTasks().filter((t) => t.id !== id));
}

export function getTasksForAssignee(userId: string, date?: string): RengoringTask[] {
  return loadRengoringTasks()
    .filter(
      (t) =>
        t.assigneeUserId === userId &&
        t.published &&
        (!date || t.date === date),
    )
    .sort((a, b) => a.label.localeCompare(b.label, "da"));
}

export function getTasksForDate(date: string): RengoringTask[] {
  return loadRengoringTasks()
    .filter((t) => t.date === date)
    .sort((a, b) => a.label.localeCompare(b.label, "da"));
}

export function getIncompleteTasksForAssignee(
  userId: string,
  date: string,
): RengoringTask[] {
  return getTasksForAssignee(userId, date).filter((t) => !t.completed);
}
