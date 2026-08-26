import type { Course, CourseModule } from "./mock-data";
import { mergeCoursePlan } from "./course-plan-storage";
import { isHeldagsturModule } from "./mock-data";

export interface KitchenMealRow {
  moduleId: string;
  dayLabel: string;
  dayDate: string;
  forplejning: string;
  specifikation: string;
  tidFra: string;
  tidTil: string;
  lokale: string;
  note: string;
  antalPersoner: number;
}

function defaultPersonCount(course: Course): number {
  return course.enrolled > 0 ? course.enrolled : course.capacity;
}

function mealPersonCount(
  antalPersoner: number | undefined,
  course: Course,
): number {
  return antalPersoner && antalPersoner > 0
    ? antalPersoner
    : defaultPersonCount(course);
}

export function getMealRowsFromCourse(course: Course): KitchenMealRow[] {
  const merged = mergeCoursePlan(course);
  const rows: KitchenMealRow[] = [];

  for (const day of merged.days) {
    for (const mod of day.modules) {
      if (mod.erMaltid && mod.maltid) {
        rows.push({
          moduleId: mod.id,
          dayLabel: day.label,
          dayDate: day.date,
          forplejning: mod.maltid.forplejning,
          specifikation: mod.maltid.specifikation,
          tidFra: mod.tidFra,
          tidTil: mod.tidTil,
          lokale: mod.maltid.lokale,
          note: mod.maltid.note,
          antalPersoner: mealPersonCount(mod.maltid.antalPersoner, merged),
        });
      }

      if (isHeldagsturModule(mod) && mod.heldagstur) {
        for (const punkt of mod.heldagstur.punkter) {
          if (punkt.type !== "maltid" || !punkt.maltid) continue;
          rows.push({
            moduleId: `${mod.id}-${punkt.id}`,
            dayLabel: day.label,
            dayDate: day.date,
            forplejning: punkt.maltid.forplejning,
            specifikation: punkt.maltid.specifikation,
            tidFra: punkt.tidFra,
            tidTil: punkt.tidTil,
            lokale: punkt.maltid.lokale,
            note: punkt.maltid.note || mod.overskrift,
            antalPersoner: mealPersonCount(punkt.maltid.antalPersoner, merged),
          });
        }
      }
    }
  }

  return rows.sort(
    (a, b) =>
      a.dayDate.localeCompare(b.dayDate) ||
      a.tidFra.localeCompare(b.tidFra),
  );
}

export function countKitchenMeals(course: Course): number {
  return getMealRowsFromCourse(course).length;
}

export function isMealModule(mod: CourseModule): boolean {
  return Boolean(mod.erMaltid && mod.maltid);
}
