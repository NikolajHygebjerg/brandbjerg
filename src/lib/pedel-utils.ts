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
