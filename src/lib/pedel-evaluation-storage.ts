import type { PedelDayRoom, PedelLokaleRow } from "./pedel-utils";
import type { LokaleSpecifikation } from "./mock-data";
import {
  getBudgetAntal,
  getRealiseretAntal,
} from "./course-enrollment-counts";
import type { CourseListEntry } from "./course-list";

const KEY = "brandbjerg-pedel-evaluations";
export const PEDEL_EVALUATION_UPDATED_EVENT = "brandbjerg-pedel-evaluation-updated";

export type PedelEvaluationKind = "course" | "day" | "room" | "entry";

export interface PedelEvaluationRecord {
  id: string;
  kind: PedelEvaluationKind;
  text: string;
  createdAt: string;
  updatedAt: string;
  courseId: string;
  courseTitle: string;
  date: string | null;
  dayLabel: string | null;
  lokale: string | null;
  moduleId: string | null;
  entrySnapshot: PedelLokaleRow | null;
  roomSnapshot: PedelDayRoom | null;
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
    window.dispatchEvent(new CustomEvent(PEDEL_EVALUATION_UPDATED_EVENT));
  }
}

function loadRecords(): PedelEvaluationRecord[] {
  if (typeof window === "undefined") return [];
  return safeParse<PedelEvaluationRecord[]>(localStorage.getItem(KEY)) ?? [];
}

function saveRecords(records: PedelEvaluationRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(records));
  emitUpdate();
}

export function recordLookupKey(
  kind: PedelEvaluationKind,
  courseId: string,
  date?: string | null,
  lokale?: string | null,
  moduleId?: string | null,
): string {
  if (kind === "course") return `${courseId}-course`;
  if (kind === "day") return `${courseId}-${date ?? ""}-day`;
  if (kind === "room") return `${courseId}-${date ?? ""}-${lokale ?? ""}-room`;
  return `${courseId}-${moduleId ?? ""}-entry`;
}

export function findPedelEvaluation(
  kind: PedelEvaluationKind,
  courseId: string,
  date?: string | null,
  lokale?: string | null,
  moduleId?: string | null,
): PedelEvaluationRecord | null {
  const key = recordLookupKey(kind, courseId, date, lokale, moduleId);
  return (
    loadRecords().find(
      (r) =>
        recordLookupKey(r.kind, r.courseId, r.date, r.lokale, r.moduleId) ===
        key,
    ) ?? null
  );
}

export function hasPedelEvaluation(
  kind: PedelEvaluationKind,
  courseId: string,
  date?: string | null,
  lokale?: string | null,
  moduleId?: string | null,
): boolean {
  const record = findPedelEvaluation(kind, courseId, date, lokale, moduleId);
  return Boolean(record?.text.trim());
}

export interface SavePedelEvaluationInput {
  kind: PedelEvaluationKind;
  courseId: string;
  courseTitle: string;
  text: string;
  date?: string | null;
  dayLabel?: string | null;
  lokale?: string | null;
  moduleId?: string | null;
  entry?: PedelLokaleRow | null;
  room?: PedelDayRoom | null;
  courseMeta?: Pick<CourseListEntry, "weekNumber" | "id"> | null;
  enrolled?: number;
  budgetStudents?: number;
}

export function savePedelEvaluation(
  input: SavePedelEvaluationInput,
): PedelEvaluationRecord {
  const now = new Date().toISOString();
  const existing = findPedelEvaluation(
    input.kind,
    input.courseId,
    input.date,
    input.lokale,
    input.moduleId,
  );

  const record: PedelEvaluationRecord = {
    id: existing?.id ?? `pev-${Date.now()}`,
    kind: input.kind,
    text: input.text.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    date: input.date ?? null,
    dayLabel: input.dayLabel ?? null,
    lokale: input.lokale ?? null,
    moduleId: input.moduleId ?? null,
    entrySnapshot: input.entry ?? null,
    roomSnapshot: input.room ?? null,
    courseWeekNumber: input.courseMeta?.weekNumber ?? null,
    budgetStudents: input.budgetStudents ?? null,
    enrolled: input.enrolled ?? null,
  };

  const records = loadRecords();
  const key = recordLookupKey(
    record.kind,
    record.courseId,
    record.date,
    record.lokale,
    record.moduleId,
  );
  const idx = records.findIndex(
    (r) =>
      recordLookupKey(r.kind, r.courseId, r.date, r.lokale, r.moduleId) === key,
  );
  if (idx >= 0) records[idx] = record;
  else records.unshift(record);
  saveRecords(records);
  return record;
}

export function listPedelEvaluations(filters?: {
  courseId?: string;
  kind?: PedelEvaluationKind;
}): PedelEvaluationRecord[] {
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

export function buildEntryContextLines(entry: PedelLokaleRow): string[] {
  const spec = entry.spec;
  const lines = [
    `${spec.lokale} · ${entry.tidFra}–${entry.tidTil}`,
    `${spec.antalPersoner || "—"} pers. · ${spec.bordopstilling || "Normal"}`,
  ];
  if (entry.overskrift) lines.push(entry.overskrift);
  if (spec.noter.trim()) lines.push(`Note: ${spec.noter.trim()}`);
  return lines;
}

export function buildRoomContextLines(room: PedelDayRoom): string[] {
  return [
    `${room.lokale} · ${room.dayLabel} ${room.dayDate}`,
    `${room.entries.length} modul${room.entries.length !== 1 ? "er" : ""} i lokalet`,
    ...room.entries.flatMap((e) => buildEntryContextLines(e)),
  ];
}

export function specSummary(spec: LokaleSpecifikation): string {
  const parts = [spec.lokale];
  if (spec.antalPersoner > 0) parts.push(`${spec.antalPersoner} pers.`);
  if (spec.bordopstilling && spec.bordopstilling !== "Normal") {
    parts.push(spec.bordopstilling);
  }
  return parts.filter(Boolean).join(" · ");
}
