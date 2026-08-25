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
  sendesTilKoekken: boolean;
}

export function getMealRowsFromCourse(course: Course): KitchenMealRow[] {
  const merged = mergeCoursePlan(course);
  const rows: KitchenMealRow[] = [];

  for (const day of merged.days) {
    for (const mod of day.modules) {
      if (mod.erMaltid && mod.maltid) {
        if (!mod.maltid.sendesTilKoekken) continue;
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
          sendesTilKoekken: mod.maltid.sendesTilKoekken,
        });
      }

      if (isHeldagsturModule(mod) && mod.heldagstur) {
        for (const punkt of mod.heldagstur.punkter) {
          if (punkt.type !== "maltid" || !punkt.maltid) continue;
          if (!punkt.maltid.sendesTilKoekken) continue;
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
            sendesTilKoekken: punkt.maltid.sendesTilKoekken,
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
  return Boolean(mod.erMaltid && mod.maltid?.sendesTilKoekken);
}
