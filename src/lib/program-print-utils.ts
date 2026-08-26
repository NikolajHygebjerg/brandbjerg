import type { Course } from "./mock-data";
import { formatDate } from "./mock-data";
import { mergeCoursePlan } from "./course-plan-storage";
import { resolveModuleLokaleSpec } from "./lokale-spec-utils";
import { moduleUnderviserLabel } from "./module-display-utils";

export interface ProgramPrintRow {
  dayLabel: string;
  dayDate: string;
  tidFra: string;
  tidTil: string;
  overskrift: string;
  lokale: string;
  underviser: string;
  broedtekst: string;
  erMaltid: boolean;
}

export function getProgramPrintRows(course: Course): ProgramPrintRow[] {
  const merged = mergeCoursePlan(course);
  const rows: ProgramPrintRow[] = [];

  for (const day of merged.days) {
    for (const mod of day.modules) {
      const lokale = mod.erMaltid
        ? mod.maltid?.lokale ?? ""
        : resolveModuleLokaleSpec(merged, mod).lokale;

      rows.push({
        dayLabel: day.label,
        dayDate: day.date,
        tidFra: mod.tidFra,
        tidTil: mod.tidTil,
        overskrift: mod.erMaltid
          ? mod.maltid?.forplejning || mod.overskrift || "Måltid"
          : mod.overskrift || "Modul",
        lokale,
        underviser: moduleUnderviserLabel(mod),
        broedtekst: mod.broedtekst,
        erMaltid: Boolean(mod.erMaltid),
      });
    }
  }

  return rows;
}

export function programDayHeading(row: ProgramPrintRow): string {
  return `${row.dayLabel} · ${formatDate(row.dayDate)}`;
}
