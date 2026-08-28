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
  createdAt: string;
}

const STORAGE_KEY = "brandbjerg-rengoring-tasks";
export const RENGORING_TASKS_UPDATED_EVENT = "brandbjerg-rengoring-tasks-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(RENGORING_TASKS_UPDATED_EVENT));
  }
}

export function loadRengoringTasks(): RengoringTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RengoringTask[];
  } catch {
    return [];
  }
}

function saveTasks(tasks: RengoringTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  emitUpdate();
}

export function createRengoringTask(
  input: Omit<RengoringTask, "id" | "createdAt" | "completed">,
): RengoringTask {
  const task: RengoringTask = {
    ...input,
    id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  const all = loadRengoringTasks();
  all.push(task);
  saveTasks(all);
  return task;
}

export function updateRengoringTask(
  id: string,
  patch: Partial<Pick<RengoringTask, "assigneeUserId" | "date" | "label" | "note" | "completed">>,
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
    .filter((t) => t.assigneeUserId === userId && (!date || t.date === date))
    .sort((a, b) => a.label.localeCompare(b.label, "da"));
}

export function getTasksForDate(date: string): RengoringTask[] {
  return loadRengoringTasks()
    .filter((t) => t.date === date)
    .sort((a, b) => a.label.localeCompare(b.label, "da"));
}

export function getIncompleteTasksForAssignee(userId: string, date: string): RengoringTask[] {
  return getTasksForAssignee(userId, date).filter((t) => !t.completed);
}
