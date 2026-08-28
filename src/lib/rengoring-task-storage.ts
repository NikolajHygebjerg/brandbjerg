import { setLokaleKlar, setVaerelseKlar } from "./rengoring-storage";

export interface RengoringTask {
  id: string;
  assigneeUserId: string;
  date: string;
  type: "vaerelse" | "lokale";
  targetKey: string;
  label: string;
  note?: string;
  /** Composite lokale-id til klar-markering */
  lokaleId?: string;
  completed: boolean;
  /** Assistenter ser kun publicerede opgaver med tildeling */
  published: boolean;
  publishedAt?: string;
  source?: "auto" | "manual";
  dueBy?: string;
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
    assigneeUserId: raw.assigneeUserId ?? "",
    published: raw.published ?? true,
    source: raw.source ?? "manual",
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

export function saveRengoringTasks(tasks: RengoringTask[]) {
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
    assigneeUserId: input.assigneeUserId ?? "",
    id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    completed: false,
    published: input.published ?? true,
    publishedAt: input.published ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };
  const all = loadRengoringTasks();
  all.push(task);
  saveRengoringTasks(all);
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
      if (all[idx].source === "auto") {
        all[idx] = {
          ...all[idx],
          assigneeUserId: "",
          published: false,
          publishedAt: undefined,
        };
        saveRengoringTasks(all);
        return all[idx];
      }
      all.splice(idx, 1);
      saveRengoringTasks(all);
    }
    return;
  }

  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      assigneeUserId: input.assigneeUserId,
      label: input.label,
      source: all[idx].source ?? "manual",
      published: false,
      publishedAt: undefined,
      completed: false,
    };
    saveRengoringTasks(all);
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
    source: "manual",
    createdAt: new Date().toISOString(),
  };
  all.push(task);
  saveRengoringTasks(all);
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
  saveRengoringTasks(all);
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
      | "assigneeUserId"
      | "date"
      | "label"
      | "note"
      | "completed"
      | "published"
      | "publishedAt"
      | "dueBy"
      | "lokaleId"
    >
  >,
): void {
  const all = loadRengoringTasks().map((t) =>
    t.id === id ? { ...t, ...patch } : t,
  );
  saveRengoringTasks(all);
}

export function assignLeaderTask(taskId: string, assigneeUserId: string): void {
  const now = new Date().toISOString();
  const all = loadRengoringTasks().map((t) => {
    if (t.id !== taskId) return t;
    return {
      ...t,
      assigneeUserId,
      published: Boolean(assigneeUserId),
      publishedAt: assigneeUserId ? now : undefined,
    };
  });
  saveRengoringTasks(all);
}

export function completeRengoringTask(task: RengoringTask): void {
  updateRengoringTask(task.id, { completed: true });
  if (task.type === "vaerelse") {
    setVaerelseKlar(task.targetKey, task.date, true);
  } else if (task.lokaleId) {
    setLokaleKlar(task.lokaleId, true);
  }
}

export function deleteRengoringTask(id: string): void {
  saveRengoringTasks(loadRengoringTasks().filter((t) => t.id !== id));
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

export function getLeaderTasksForDate(date: string): RengoringTask[] {
  return loadRengoringTasks()
    .filter((t) => t.date === date && !t.completed)
    .sort((a, b) => {
      const aUnassigned = !a.assigneeUserId ? 0 : 1;
      const bUnassigned = !b.assigneeUserId ? 0 : 1;
      if (aUnassigned !== bUnassigned) return aUnassigned - bUnassigned;
      return a.label.localeCompare(b.label, "da");
    });
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

export function mergeSyncedAutoTasks(tasks: RengoringTask[]): boolean {
  const existing = loadRengoringTasks();
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
        source: current.source ?? "auto",
        dueBy: task.dueBy ?? current.dueBy,
        label: task.label,
        note: task.note ?? current.note,
        lokaleId: task.lokaleId ?? current.lokaleId,
        assigneeUserId: assignee,
        published: Boolean(assignee),
        publishedAt: assignee
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
    saveRengoringTasks(Array.from(byKey.values()));
  }
  return changed;
}

export function countUnassignedLeaderTasks(date: string): number {
  return getLeaderTasksForDate(date).filter((t) => !t.assigneeUserId).length;
}
