import type { Course, CourseModule } from "./mock-data";
import { mergeCoursePlan } from "./course-plan-storage";
import { computeProgramTotals, minToHours } from "./module-plan-utils";
import { formatDate } from "./mock-data";
import { moduleUnderviserLabel } from "./module-display-utils";

/** UBAK-tekst pr. modul (nyt felt; falder tilbage til ældre ubakBeskrivelse). */
export function moduleUbakTekst(mod: CourseModule): string {
  return (mod.ubakTekst ?? mod.ubakBeskrivelse ?? "").trim();
}

export interface UbakProgramModule {
  dayLabel: string;
  dayDate: string;
  tidFra: string;
  tidTil: string;
  overskrift: string;
  underviser: string;
  ubakMinutter: number;
  ubakTekst: string;
}

export interface UbakProgramDay {
  heading: string;
  modules: UbakProgramModule[];
}

export function getUbakProgramDays(course: Course): UbakProgramDay[] {
  const merged = mergeCoursePlan(course);
  const days: UbakProgramDay[] = [];

  for (const day of merged.days) {
    const modules: UbakProgramModule[] = [];
    for (const mod of day.modules) {
      if (mod.erMaltid || mod.timing.ubak <= 0) continue;
      modules.push({
        dayLabel: day.label,
        dayDate: day.date,
        tidFra: mod.tidFra,
        tidTil: mod.tidTil,
        overskrift: mod.overskrift || "Modul",
        underviser: moduleUnderviserLabel(mod),
        ubakMinutter: mod.timing.ubak,
        ubakTekst: moduleUbakTekst(mod),
      });
    }
    if (modules.length > 0) {
      days.push({
        heading: `${day.label} · ${formatDate(day.date)}`,
        modules,
      });
    }
  }

  return days;
}

export function getUbakProgramTotals(course: Course) {
  const merged = mergeCoursePlan(course);
  return computeProgramTotals(merged.days);
}
