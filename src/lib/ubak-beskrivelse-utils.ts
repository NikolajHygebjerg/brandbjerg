import type { Course, CourseModule } from "./mock-data";
import { mergeCoursePlan } from "./course-plan-storage";
import { moduleDurationMinutes } from "./mock-data";
import { parseTime } from "./module-plan-utils";
import { moduleUnderviserLabel } from "./module-display-utils";

export interface UbakBeskrivelseRow {
  dayLabel: string;
  dayNumber: number;
  tidsrum: string;
  beskrivelse: string;
  ubakMinutter: number;
  ubakBeskrivelse: string;
  underviser: string;
  tidFra: string;
  tidTil: string;
}

export interface UbakBeskrivelseStats {
  ubakMinutter: number;
  ugeMinutter: number;
  ubakPct: number;
  ubakTimer: string;
  ugeTimer: string;
}

function inferDayPeriodLabel(tidFra: string): string {
  const mins = parseTime(tidFra);
  if (mins < 10 * 60) return "Morgen";
  if (mins < 12 * 60) return "Formiddag 1";
  if (mins < 14 * 60) return "Formiddag 2";
  if (mins < 17 * 60) return "Eftermiddag 1";
  if (mins < 20 * 60) return "Eftermiddag 2";
  return "Aften";
}

function rowFromModule(
  dayLabel: string,
  dayNumber: number,
  mod: CourseModule,
): UbakBeskrivelseRow {
  return {
    dayLabel,
    dayNumber,
    tidsrum: inferDayPeriodLabel(mod.tidFra),
    beskrivelse: mod.overskrift || "—",
    ubakMinutter: mod.timing.ubak,
    ubakBeskrivelse: mod.ubakBeskrivelse?.trim() ?? "",
    underviser: moduleUnderviserLabel(mod) || "—",
    tidFra: mod.tidFra,
    tidTil: mod.tidTil,
  };
}

export function getUbakBeskrivelseRows(course: Course): UbakBeskrivelseRow[] {
  const merged = mergeCoursePlan(course);
  const rows: UbakBeskrivelseRow[] = [];

  merged.days.forEach((day, index) => {
    for (const mod of day.modules) {
      if (mod.erMaltid) continue;
      rows.push(rowFromModule(day.label, index + 1, mod));
    }
  });

  return rows;
}

function minToTimerLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} t`;
  return `${h} t ${m} min`;
}

export function computeUbakBeskrivelseStats(course: Course): UbakBeskrivelseStats {
  const merged = mergeCoursePlan(course);
  let ubakMinutter = 0;
  let ugeMinutter = 0;

  for (const day of merged.days) {
    for (const mod of day.modules) {
      if (mod.erMaltid) continue;
      const duration = Math.max(0, moduleDurationMinutes(mod));
      ugeMinutter += duration;
      ubakMinutter += mod.timing.ubak;
    }
  }

  const ubakPct =
    ugeMinutter > 0 ? Math.round((ubakMinutter / ugeMinutter) * 1000) / 10 : 0;

  return {
    ubakMinutter,
    ugeMinutter,
    ubakPct,
    ubakTimer: minToTimerLabel(ubakMinutter),
    ugeTimer: minToTimerLabel(ugeMinutter),
  };
}
