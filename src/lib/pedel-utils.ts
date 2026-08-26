import type { Course, LokaleSpecifikation } from "./mock-data";
import { defaultLokaleSpec } from "./mock-data";
import { mergeCoursePlan } from "./course-plan-storage";
import { ugedage } from "./lokale-spec-options";

export interface PedelLokaleRow {
  moduleId: string;
  dayLabel: string;
  dayDate: string;
  tidFra: string;
  tidTil: string;
  overskrift: string;
  spec: LokaleSpecifikation;
}

function hasLokaleInfo(spec: LokaleSpecifikation): boolean {
  return Boolean(
    spec.lokale ||
      spec.antalPersoner > 0 ||
      spec.bordopstilling ||
      spec.dug ||
      spec.levendeLys ||
      spec.blomster ||
      spec.storWhiteboard ||
      spec.flipoverWhiteboard ||
      spec.projektor ||
      spec.mobilLaerredProjektor ||
      spec.mobilLydanlaeg ||
      spec.noter.trim() ||
      spec.skalBrugesFlereDage,
  );
}

function weekdayIndex(label: string): number {
  return ugedage.findIndex(
    (u) => u.toLowerCase() === label.trim().toLowerCase(),
  );
}

/** Om en kursusdag (label) ligger i intervallet klarFra → ledigFra */
function isDayInWeekdayRange(
  dayLabel: string,
  fromDay: string,
  toDay: string,
): boolean {
  const dayIdx = weekdayIndex(dayLabel);
  if (dayIdx < 0) return true;

  const fromIdx = weekdayIndex(fromDay);
  const toIdx = weekdayIndex(toDay);

  if (fromIdx < 0 && toIdx < 0) return true;
  if (fromIdx >= 0 && toIdx >= 0) return dayIdx >= fromIdx && dayIdx <= toIdx;
  if (fromIdx >= 0) return dayIdx >= fromIdx;
  if (toIdx >= 0) return dayIdx <= toIdx;
  return true;
}

function expandMultiDayPedelRows(
  course: Course,
  rows: PedelLokaleRow[],
): PedelLokaleRow[] {
  const merged = mergeCoursePlan(course);
  const expanded: PedelLokaleRow[] = [];
  const seen = new Set<string>();

  function push(row: PedelLokaleRow) {
    const key = `${row.dayDate}|${row.moduleId}`;
    if (seen.has(key)) return;
    seen.add(key);
    expanded.push(row);
  }

  for (const row of rows) {
    if (!row.spec.skalBrugesFlereDage || !row.spec.lokale.trim()) {
      push(row);
      continue;
    }

    const fromDay = row.spec.klarFraUgedag;
    const toDay = row.spec.ledigFraUgedag;

    for (const day of merged.days) {
      if (!isDayInWeekdayRange(day.label, fromDay, toDay)) continue;

      const isFirst =
        fromDay &&
        day.label.trim().toLowerCase() === fromDay.trim().toLowerCase();
      const isLast =
        toDay &&
        day.label.trim().toLowerCase() === toDay.trim().toLowerCase();

      push({
        ...row,
        dayLabel: day.label,
        dayDate: day.date,
        tidFra:
          isFirst && row.spec.klarFraKl
            ? row.spec.klarFraKl
            : row.spec.klarFraKl || row.tidFra,
        tidTil:
          isLast && row.spec.ledigFraKl
            ? row.spec.ledigFraKl
            : isLast
              ? row.tidTil
              : row.spec.ledigFraKl || "22:00",
      });
    }
  }

  return expanded;
}

export function getPedelRowsFromCourse(course: Course): PedelLokaleRow[] {
  const merged = mergeCoursePlan(course);
  const rows: PedelLokaleRow[] = [];

  for (const day of merged.days) {
    for (const mod of day.modules) {
      if (mod.erMaltid) continue;
      const spec = mod.lokaleSpec ?? defaultLokaleSpec();
      if (!hasLokaleInfo(spec) && !mod.overskrift.trim()) continue;
      rows.push({
        moduleId: mod.id,
        dayLabel: day.label,
        dayDate: day.date,
        tidFra: mod.tidFra,
        tidTil: mod.tidTil,
        overskrift: mod.overskrift,
        spec,
      });
    }
  }

  return expandMultiDayPedelRows(course, rows).sort(
    (a, b) =>
      a.dayDate.localeCompare(b.dayDate) || a.tidFra.localeCompare(b.tidFra),
  );
}

export function countPedelModules(course: Course): number {
  return getPedelRowsFromCourse(course).length;
}

export function formatLokaleFlags(spec: LokaleSpecifikation): string[] {
  const flags: string[] = [];
  if (spec.dug) flags.push("Dug");
  if (spec.levendeLys) flags.push("Levende lys");
  if (spec.blomster) flags.push("Blomster");
  if (spec.storWhiteboard) flags.push("Stor whiteboard");
  if (spec.flipoverWhiteboard) flags.push("Flipover");
  if (spec.projektor) flags.push("Projektor");
  if (spec.mobilLaerredProjektor) flags.push("Mobil lærred");
  if (spec.mobilLydanlaeg) flags.push("Mobil lyd");
  return flags;
}

/** Et lokale der skal klargøres på en given dag */
export interface PedelDayRoom {
  dayLabel: string;
  dayDate: string;
  lokale: string;
  entries: PedelLokaleRow[];
}

export function getPedelDayRooms(course: Course): PedelDayRoom[] {
  const rows = getPedelRowsFromCourse(course).filter((r) =>
    r.spec.lokale.trim(),
  );
  const map = new Map<string, PedelDayRoom>();

  for (const row of rows) {
    const lokale = row.spec.lokale.trim();
    const key = `${row.dayDate}|${lokale}`;
    const existing = map.get(key);
    if (existing) {
      existing.entries.push(row);
    } else {
      map.set(key, {
        dayLabel: row.dayLabel,
        dayDate: row.dayDate,
        lokale,
        entries: [row],
      });
    }
  }

  for (const room of map.values()) {
    room.entries.sort((a, b) => a.tidFra.localeCompare(b.tidFra));
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      a.dayDate.localeCompare(b.dayDate) ||
      a.lokale.localeCompare(b.lokale, "da"),
  );
}

export function groupPedelDayRoomsByDate(
  rooms: PedelDayRoom[],
): { label: string; date: string; rooms: PedelDayRoom[] }[] {
  const byDate = new Map<string, { label: string; date: string; rooms: PedelDayRoom[] }>();
  for (const room of rooms) {
    const key = room.dayDate;
    if (!byDate.has(key)) {
      byDate.set(key, { label: room.dayLabel, date: room.dayDate, rooms: [] });
    }
    byDate.get(key)!.rooms.push(room);
  }
  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export function countPedelLokaler(course: Course): number {
  return getPedelDayRooms(course).length;
}

export function timeSpanForRoom(entries: PedelLokaleRow[]): string {
  if (entries.length === 0) return "";
  const fra = entries.reduce(
    (min, e) => (e.tidFra < min ? e.tidFra : min),
    entries[0].tidFra,
  );
  const til = entries.reduce(
    (max, e) => (e.tidTil > max ? e.tidTil : max),
    entries[0].tidTil,
  );
  return `${fra}–${til}`;
}
