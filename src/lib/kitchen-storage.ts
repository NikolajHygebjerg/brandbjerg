import type { Course } from "./mock-data";
import {
  buildKitchenPlanSummary,
  getMealRowsFromCourse,
  type KitchenMealRow,
} from "./kitchen-utils";

const KEY = "brandbjerg-kitchen-sent";
export const KITCHEN_UPDATED_EVENT = "brandbjerg-kitchen-updated";

export interface KitchenSentRecord {
  courseId: string;
  sentAt: string;
  mealCount: number;
  summary: string;
  meals: KitchenMealRow[];
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(KITCHEN_UPDATED_EVENT));
  }
}

function loadAll(): Record<string, KitchenSentRecord> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, KitchenSentRecord>>(localStorage.getItem(KEY)) ?? {};
}

function saveAll(all: Record<string, KitchenSentRecord>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(all));
  emitUpdate();
}

export function loadKitchenSent(courseId: string): KitchenSentRecord | null {
  return loadAll()[courseId] ?? null;
}

export function isKitchenPlanSent(courseId: string): boolean {
  return Boolean(loadKitchenSent(courseId));
}

export function listSentKitchenCourseIds(): string[] {
  return Object.keys(loadAll());
}

export function sendKitchenPlan(course: Course): KitchenSentRecord {
  const meals = getMealRowsFromCourse(course);
  const record: KitchenSentRecord = {
    courseId: course.id,
    sentAt: new Date().toISOString(),
    mealCount: meals.length,
    summary: buildKitchenPlanSummary(course),
    meals,
  };
  const all = loadAll();
  all[course.id] = record;
  saveAll(all);
  return record;
}

export function revokeKitchenPlan(courseId: string): void {
  const all = loadAll();
  delete all[courseId];
  saveAll(all);
}
