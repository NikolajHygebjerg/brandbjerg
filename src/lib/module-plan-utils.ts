import type { CourseDay, CourseModule } from "./mock-data";
import type { ProgramTemplate } from "./program-templates/liv-i-haven-5dage";
import { templateRowToModule } from "./program-templates/liv-i-haven-5dage";

export function countInclusiveDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return diff >= 0 ? diff + 1 : 0;
}

export function dateForDayOffset(startDate: string, offset: number): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function buildDaysFromTemplate(
  template: ProgramTemplate,
  startDate: string,
): CourseDay[] {
  return template.days.map((rows, i) => ({
    id: `day-${i + 1}`,
    date: dateForDayOffset(startDate, i),
    label: `${template.weekdayLabels[i] ?? `Dag ${i + 1}`}`,
    modules: rows.map((row, j) => templateRowToModule(row, i * 100 + j)),
  }));
}

export function buildEmptyDays(startDate: string, dayCount: number): CourseDay[] {
  const labels = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];
  return Array.from({ length: dayCount }, (_, i) => ({
    id: `day-${i + 1}`,
    date: dateForDayOffset(startDate, i),
    label: labels[i] ?? `Dag ${i + 1}`,
    modules: [],
  }));
}

export interface ProgramTotals {
  uvMinutter: number;
  ubakMinutter: number;
  ftMinutter: number;
  ptsMinutter: number;
  bhMinutter: number;
  ftPct: number;
  bhPct: number;
}

export function computeProgramTotals(days: CourseDay[]): ProgramTotals {
  let ubakMinutter = 0;
  let ftMinutter = 0;
  let ptsMinutter = 0;
  let bhMinutter = 0;

  for (const day of days) {
    for (const mod of day.modules) {
      if (mod.erMaltid) continue;
      ubakMinutter += mod.timing.ubak;
      ftMinutter += mod.timing.ft;
      ptsMinutter += mod.timing.pts;
      bhMinutter += mod.timing.bh;
    }
  }

  const uvMinutter = ubakMinutter + ftMinutter;
  const ftPct = uvMinutter > 0 ? (ftMinutter / uvMinutter) * 100 : 0;
  const totalMinutes = uvMinutter + ptsMinutter + bhMinutter;
  const bhPct = totalMinutes > 0 ? (bhMinutter / totalMinutes) * 100 : 0;

  return {
    uvMinutter,
    ubakMinutter,
    ftMinutter,
    ptsMinutter,
    bhMinutter,
    ftPct,
    bhPct,
  };
}

export function allModules(days: CourseDay[]): CourseModule[] {
  return days.flatMap((d) => d.modules);
}

export function minToHours(min: number): string {
  return (min / 60).toFixed(2).replace(".", ",");
}
