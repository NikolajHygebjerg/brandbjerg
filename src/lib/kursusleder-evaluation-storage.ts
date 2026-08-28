import type { CourseDay, CourseModule } from "./mock-data";
import {
  getBudgetAntal,
  getRealiseretAntal,
} from "./course-enrollment-counts";
import type { CourseListEntry } from "./course-list";
import { moduleUnderviserLabel } from "./module-display-utils";

const KEY = "brandbjerg-kursusleder-evaluations";
export const KURSUSLEDER_EVALUATION_UPDATED_EVENT =
  "brandbjerg-kursusleder-evaluation-updated";

export type KursuslederEvaluationKind = "course" | "module";

export interface KursuslederEvaluationRecord {
  id: string;
  kind: KursuslederEvaluationKind;
  text: string;
  createdAt: string;
  updatedAt: string;
  courseId: string;
  courseTitle: string;
  date: string | null;
  dayLabel: string | null;
  moduleId: string | null;
  moduleSnapshot: CourseModule | null;
  courseWeekNumber: number | null;
  budgetStudents: number | null;
  enrolled: number | null;
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
    window.dispatchEvent(new CustomEvent(KURSUSLEDER_EVALUATION_UPDATED_EVENT));
  }
}

function loadRecords(): KursuslederEvaluationRecord[] {
  if (typeof window === "undefined") return [];
  return safeParse<KursuslederEvaluationRecord[]>(localStorage.getItem(KEY)) ?? [];
}

function saveRecords(records: KursuslederEvaluationRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(records));
  emitUpdate();
}

export function recordLookupKey(
  kind: KursuslederEvaluationKind,
  courseId: string,
  moduleId?: string | null,
): string {
  if (kind === "course") return `${courseId}-course`;
  return `${courseId}-${moduleId ?? ""}-module`;
}

export function findKursuslederEvaluation(
  kind: KursuslederEvaluationKind,
  courseId: string,
  moduleId?: string | null,
): KursuslederEvaluationRecord | null {
  const key = recordLookupKey(kind, courseId, moduleId);
  return (
    loadRecords().find(
      (r) => recordLookupKey(r.kind, r.courseId, r.moduleId) === key,
    ) ?? null
  );
}

export function hasKursuslederEvaluation(
  kind: KursuslederEvaluationKind,
  courseId: string,
  moduleId?: string | null,
): boolean {
  const record = findKursuslederEvaluation(kind, courseId, moduleId);
  return Boolean(record?.text.trim());
}

export interface SaveKursuslederEvaluationInput {
  kind: KursuslederEvaluationKind;
  courseId: string;
  courseTitle: string;
  text: string;
  date?: string | null;
  dayLabel?: string | null;
  moduleId?: string | null;
  module?: CourseModule | null;
  courseMeta?: Pick<CourseListEntry, "weekNumber" | "id"> | null;
  enrolled?: number;
  budgetStudents?: number;
}

export function saveKursuslederEvaluation(
  input: SaveKursuslederEvaluationInput,
): KursuslederEvaluationRecord {
  const now = new Date().toISOString();
  const existing = findKursuslederEvaluation(
    input.kind,
    input.courseId,
    input.moduleId,
  );

  const record: KursuslederEvaluationRecord = {
    id: existing?.id ?? `klev-${Date.now()}`,
    kind: input.kind,
    text: input.text.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    date: input.date ?? null,
    dayLabel: input.dayLabel ?? null,
    moduleId: input.moduleId ?? null,
    moduleSnapshot: input.module ?? null,
    courseWeekNumber: input.courseMeta?.weekNumber ?? null,
    budgetStudents: input.budgetStudents ?? null,
    enrolled: input.enrolled ?? null,
  };

  const records = loadRecords();
  const key = recordLookupKey(record.kind, record.courseId, record.moduleId);
  const idx = records.findIndex(
    (r) => recordLookupKey(r.kind, r.courseId, r.moduleId) === key,
  );
  if (idx >= 0) records[idx] = record;
  else records.unshift(record);
  saveRecords(records);
  return record;
}

export function listKursuslederEvaluations(filters?: {
  courseId?: string;
  kind?: KursuslederEvaluationKind;
}): KursuslederEvaluationRecord[] {
  let records = loadRecords().filter((r) => r.text.trim().length > 0);
  if (filters?.courseId) {
    records = records.filter((r) => r.courseId === filters.courseId);
  }
  if (filters?.kind) {
    records = records.filter((r) => r.kind === filters.kind);
  }
  return records.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function buildModuleContextLines(
  day: CourseDay,
  mod: CourseModule,
): string[] {
  const ansvarlig = moduleUnderviserLabel(mod);
  const lines = [
    `${day.label} · ${day.date}`,
    `${mod.tidFra}–${mod.tidTil} · ${mod.overskrift || "Modul"}`,
  ];
  if (ansvarlig) lines.push(`Ansvarlig: ${ansvarlig}`);
  if (mod.erMaltid && mod.maltid) {
    lines.push(
      `Måltid: ${mod.maltid.forplejning} · ${mod.maltid.specifikation}`,
    );
  }
  if (mod.lokaleSpec?.lokale) {
    lines.push(`Lokale: ${mod.lokaleSpec.lokale}`);
  }
  return lines;
}

export function buildCourseContextLines(
  courseTitle: string,
  days: CourseDay[],
  enrolled: number,
  budget: number,
): string[] {
  const moduleCount = days.reduce((sum, d) => sum + d.modules.length, 0);
  return [
    courseTitle,
    `${enrolled} tilmeldte / ${budget} budget`,
    `${days.length} dage · ${moduleCount} punkter i programmet`,
  ];
}
