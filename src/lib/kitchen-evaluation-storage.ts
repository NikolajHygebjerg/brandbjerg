import {
  getBudgetAntal,
  getRealiseretAntal,
} from "./course-enrollment-counts";
import type { CourseListEntry } from "./course-list";
import { getApprovedKitchenCourses } from "./kitchen-week-calendar";
import type { KitchenWeekMealRow } from "./kitchen-utils";
import type { KitchenMealSlotPlan } from "./kitchen-meal-plan-storage";
import { KITCHEN_UPDATED_EVENT } from "./kitchen-storage";

const KEY = "brandbjerg-kitchen-evaluations";
export const KITCHEN_EVALUATION_UPDATED_EVENT = "brandbjerg-kitchen-evaluation-updated";

export type KitchenEvaluationKind = "week" | "meal";

export type GuestSmileyScore = 1 | 2 | 3 | 4 | 5;

export interface KitchenGuestSmileyRating {
  id: string;
  score: GuestSmileyScore;
  createdAt: string;
  source: "spisesal";
}

export interface KitchenEvaluationCourseContext {
  courseId: string;
  courseTitle: string;
  weekNumber: number;
  startDate: string | null;
  endDate: string | null;
  budgetStudents: number;
  enrolled: number;
  responsible: string;
  type: string;
}

export interface KitchenEvaluationMealCourseRow {
  courseId: string;
  courseTitle: string;
  moduleId: string;
  antalPersoner: number;
  specifikation: string;
  lokale: string;
  note: string;
}

export interface KitchenEvaluationRecord {
  id: string;
  kind: KitchenEvaluationKind;
  text: string;
  createdAt: string;
  updatedAt: string;
  year: number;
  weekNumber: number;
  date: string | null;
  dayName: string | null;
  slotId: string | null;
  forplejning: string | null;
  slotLabel: string | null;
  plannedMenu: string | null;
  courses: KitchenEvaluationCourseContext[];
  weekStats: {
    budgetTotal: number;
    enrolledTotal: number;
    staffOnDuty: number;
    courseCount: number;
    mealCount: number;
  } | null;
  mealCourses: KitchenEvaluationMealCourseRow[] | null;
  /** Smiley-evalueringer fra gæster i spisesalen (iPad) */
  guestRatings?: KitchenGuestSmileyRating[];
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
    window.dispatchEvent(new CustomEvent(KITCHEN_EVALUATION_UPDATED_EVENT));
    window.dispatchEvent(new CustomEvent(KITCHEN_UPDATED_EVENT));
  }
}

function loadRecords(): KitchenEvaluationRecord[] {
  if (typeof window === "undefined") return [];
  return safeParse<KitchenEvaluationRecord[]>(localStorage.getItem(KEY)) ?? [];
}

function saveRecords(records: KitchenEvaluationRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(records));
  emitUpdate();
}

export function recordLookupKey(
  kind: KitchenEvaluationKind,
  year: number,
  weekNumber: number,
  date?: string | null,
  slotId?: string | null,
): string {
  if (kind === "week") return `${year}-w${weekNumber}-week`;
  return `${year}-w${weekNumber}-${date ?? ""}-${slotId ?? ""}`;
}

export function buildEvaluationCourseContexts(
  courses: CourseListEntry[],
  weekNumber: number,
): KitchenEvaluationCourseContext[] {
  return getApprovedKitchenCourses(
    courses.filter((c) => c.weekNumber === weekNumber),
  ).map((c) => ({
    courseId: c.id,
    courseTitle: c.title,
    weekNumber: c.weekNumber,
    startDate: c.startDate,
    endDate: c.endDate,
    budgetStudents: getBudgetAntal(c),
    enrolled: getRealiseretAntal(c),
    responsible: c.responsible,
    type: c.type,
  }));
}

export function findEvaluation(
  kind: KitchenEvaluationKind,
  year: number,
  weekNumber: number,
  date?: string | null,
  slotId?: string | null,
): KitchenEvaluationRecord | null {
  const key = recordLookupKey(kind, year, weekNumber, date, slotId);
  return (
    loadRecords().find(
      (r) =>
        recordLookupKey(r.kind, r.year, r.weekNumber, r.date, r.slotId) === key,
    ) ?? null
  );
}

export function hasEvaluation(
  kind: KitchenEvaluationKind,
  year: number,
  weekNumber: number,
  date?: string | null,
  slotId?: string | null,
): boolean {
  const record = findEvaluation(kind, year, weekNumber, date, slotId);
  return Boolean(record?.text.trim());
}

export interface SaveWeekEvaluationInput {
  year: number;
  weekNumber: number;
  text: string;
  courses: CourseListEntry[];
  weekStats: NonNullable<KitchenEvaluationRecord["weekStats"]>;
}

export interface SaveMealEvaluationInput {
  year: number;
  weekNumber: number;
  date: string;
  dayName: string;
  slot: KitchenMealSlotPlan;
  text: string;
  courses: CourseListEntry[];
  weekStats: NonNullable<KitchenEvaluationRecord["weekStats"]>;
  matchingMeals: KitchenWeekMealRow[];
}

export function saveWeekEvaluation(input: SaveWeekEvaluationInput): KitchenEvaluationRecord {
  const now = new Date().toISOString();
  const existing = findEvaluation("week", input.year, input.weekNumber);
  const record: KitchenEvaluationRecord = {
    id: existing?.id ?? `kev-${Date.now()}`,
    kind: "week",
    text: input.text.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    year: input.year,
    weekNumber: input.weekNumber,
    date: null,
    dayName: null,
    slotId: null,
    forplejning: null,
    slotLabel: null,
    plannedMenu: null,
    courses: buildEvaluationCourseContexts(input.courses, input.weekNumber),
    weekStats: input.weekStats,
    mealCourses: null,
  };

  upsertRecord(record);
  return record;
}

export function saveMealEvaluation(input: SaveMealEvaluationInput): KitchenEvaluationRecord {
  const now = new Date().toISOString();
  const existing = findEvaluation(
    "meal",
    input.year,
    input.weekNumber,
    input.date,
    input.slot.id,
  );

  const record: KitchenEvaluationRecord = {
    id: existing?.id ?? `kev-${Date.now()}`,
    kind: "meal",
    text: input.text.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    year: input.year,
    weekNumber: input.weekNumber,
    date: input.date,
    dayName: input.dayName,
    slotId: input.slot.id,
    forplejning: input.slot.forplejning,
    slotLabel: input.slot.label,
    plannedMenu: input.slot.menuText || null,
    courses: buildEvaluationCourseContexts(input.courses, input.weekNumber),
    weekStats: input.weekStats,
    mealCourses: input.matchingMeals.map((m) => ({
      courseId: m.courseId,
      courseTitle: m.courseTitle,
      moduleId: m.moduleId,
      antalPersoner: m.antalPersoner,
      specifikation: m.specifikation,
      lokale: m.lokale,
      note: m.note,
    })),
  };

  upsertRecord(record);
  return record;
}

function upsertRecord(record: KitchenEvaluationRecord): void {
  const records = loadRecords();
  const key = recordLookupKey(
    record.kind,
    record.year,
    record.weekNumber,
    record.date,
    record.slotId,
  );
  const idx = records.findIndex(
    (r) =>
      recordLookupKey(r.kind, r.year, r.weekNumber, r.date, r.slotId) === key,
  );
  if (idx >= 0) records[idx] = record;
  else records.unshift(record);
  saveRecords(records);
}

export function listKitchenEvaluations(filters?: {
  year?: number;
  weekNumber?: number;
  kind?: KitchenEvaluationKind;
}): KitchenEvaluationRecord[] {
  let records = loadRecords().filter(
    (r) => r.text.trim().length > 0 || (r.guestRatings?.length ?? 0) > 0,
  );
  if (filters?.year != null) {
    records = records.filter((r) => r.year === filters.year);
  }
  if (filters?.weekNumber != null) {
    records = records.filter((r) => r.weekNumber === filters.weekNumber);
  }
  if (filters?.kind != null) {
    records = records.filter((r) => r.kind === filters.kind);
  }
  return records.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function deleteKitchenEvaluation(id: string): void {
  saveRecords(loadRecords().filter((r) => r.id !== id));
}

export function guestRatingAverage(
  ratings: KitchenGuestSmileyRating[] | undefined,
): number | null {
  if (!ratings?.length) return null;
  const sum = ratings.reduce((s, r) => s + r.score, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export interface SaveGuestSmileyInput {
  year: number;
  weekNumber: number;
  date: string;
  dayName: string;
  slot: KitchenMealSlotPlan;
  score: GuestSmileyScore;
  courses: CourseListEntry[];
  weekStats: NonNullable<KitchenEvaluationRecord["weekStats"]>;
  matchingMeals: KitchenWeekMealRow[];
}

export function saveGuestSmileyRating(
  input: SaveGuestSmileyInput,
): KitchenEvaluationRecord {
  const now = new Date().toISOString();
  const existing = findEvaluation(
    "meal",
    input.year,
    input.weekNumber,
    input.date,
    input.slot.id,
  );

  const rating: KitchenGuestSmileyRating = {
    id: `kgr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    score: input.score,
    createdAt: now,
    source: "spisesal",
  };

  const record: KitchenEvaluationRecord = {
    id: existing?.id ?? `kev-${Date.now()}`,
    kind: "meal",
    text: existing?.text ?? "",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    year: input.year,
    weekNumber: input.weekNumber,
    date: input.date,
    dayName: input.dayName,
    slotId: input.slot.id,
    forplejning: input.slot.forplejning,
    slotLabel: input.slot.label,
    plannedMenu: input.slot.menuText || null,
    courses: buildEvaluationCourseContexts(input.courses, input.weekNumber),
    weekStats: input.weekStats,
    mealCourses:
      existing?.mealCourses ??
      input.matchingMeals.map((m) => ({
        courseId: m.courseId,
        courseTitle: m.courseTitle,
        moduleId: m.moduleId,
        antalPersoner: m.antalPersoner,
        specifikation: m.specifikation,
        lokale: m.lokale,
        note: m.note,
      })),
    guestRatings: [...(existing?.guestRatings ?? []), rating],
  };

  upsertRecord(record);
  return record;
}

export function listGuestRatingsForMeal(
  year: number,
  weekNumber: number,
  date: string,
  slotId: string,
): KitchenGuestSmileyRating[] {
  return findEvaluation("meal", year, weekNumber, date, slotId)?.guestRatings ?? [];
}
