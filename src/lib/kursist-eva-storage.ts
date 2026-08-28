import type { SmileyScore } from "./smiley-ratings";

const KEY = "brandbjerg-kursist-eva";
export const KURSIST_EVA_UPDATED_EVENT = "brandbjerg-kursist-eva-updated";

export interface KursistModuleEva {
  id: string;
  participantId: string;
  courseId: string;
  moduleId: string;
  score: SmileyScore;
  comment: string;
  moduleTitle: string;
  dayLabel: string;
  dayDate: string;
  tidFra: string;
  tidTil: string;
  createdAt: string;
  updatedAt: string;
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
    window.dispatchEvent(new CustomEvent(KURSIST_EVA_UPDATED_EVENT));
  }
}

function loadAll(): KursistModuleEva[] {
  if (typeof window === "undefined") return [];
  return safeParse<KursistModuleEva[]>(localStorage.getItem(KEY)) ?? [];
}

function saveAll(records: KursistModuleEva[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(records));
  emitUpdate();
}

export function evaLookupKey(
  courseId: string,
  moduleId: string,
  participantId: string,
): string {
  return `${courseId}::${moduleId}::${participantId}`;
}

export function findKursistModuleEva(
  courseId: string,
  moduleId: string,
  participantId: string,
): KursistModuleEva | null {
  const key = evaLookupKey(courseId, moduleId, participantId);
  return (
    loadAll().find(
      (r) => evaLookupKey(r.courseId, r.moduleId, r.participantId) === key,
    ) ?? null
  );
}

export function hasKursistModuleEva(
  courseId: string,
  moduleId: string,
  participantId: string,
): boolean {
  return findKursistModuleEva(courseId, moduleId, participantId) !== null;
}

export function saveKursistSmileyRating(input: {
  participantId: string;
  courseId: string;
  moduleId: string;
  score: SmileyScore;
  moduleTitle: string;
  dayLabel: string;
  dayDate: string;
  tidFra: string;
  tidTil: string;
  comment?: string;
}): KursistModuleEva {
  const now = new Date().toISOString();
  const existing = findKursistModuleEva(
    input.courseId,
    input.moduleId,
    input.participantId,
  );

  const record: KursistModuleEva = {
    id: existing?.id ?? `keva-${Date.now()}`,
    participantId: input.participantId,
    courseId: input.courseId,
    moduleId: input.moduleId,
    score: input.score,
    comment: input.comment ?? existing?.comment ?? "",
    moduleTitle: input.moduleTitle,
    dayLabel: input.dayLabel,
    dayDate: input.dayDate,
    tidFra: input.tidFra,
    tidTil: input.tidTil,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const records = loadAll();
  const key = evaLookupKey(record.courseId, record.moduleId, record.participantId);
  const idx = records.findIndex(
    (r) => evaLookupKey(r.courseId, r.moduleId, r.participantId) === key,
  );
  if (idx >= 0) records[idx] = record;
  else records.unshift(record);
  saveAll(records);
  return record;
}

export function saveKursistModuleComment(
  courseId: string,
  moduleId: string,
  participantId: string,
  comment: string,
): KursistModuleEva | null {
  const existing = findKursistModuleEva(courseId, moduleId, participantId);
  if (!existing) return null;

  const record: KursistModuleEva = {
    ...existing,
    comment: comment.trim(),
    updatedAt: new Date().toISOString(),
  };

  const records = loadAll();
  const key = evaLookupKey(courseId, moduleId, participantId);
  const idx = records.findIndex(
    (r) => evaLookupKey(r.courseId, r.moduleId, r.participantId) === key,
  );
  if (idx >= 0) records[idx] = record;
  saveAll(records);
  return record;
}

export function listKursistEvasForCourse(
  courseId: string,
  participantId?: string,
): KursistModuleEva[] {
  let records = loadAll().filter((r) => r.courseId === courseId);
  if (participantId) {
    records = records.filter((r) => r.participantId === participantId);
  }
  return records.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function averageScoreForModule(
  courseId: string,
  moduleId: string,
): number | null {
  const scores = loadAll()
    .filter((r) => r.courseId === courseId && r.moduleId === moduleId)
    .map((r) => r.score);
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
