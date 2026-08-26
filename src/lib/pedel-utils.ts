import type { Course, LokaleSpecifikation } from "./mock-data";
import { defaultLokaleSpec } from "./mock-data";
import { mergeCoursePlan } from "./course-plan-storage";

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

  return rows.sort(
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
