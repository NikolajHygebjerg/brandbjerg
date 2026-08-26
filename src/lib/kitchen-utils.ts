import type { Course, CourseModule } from "./mock-data";
import { mergeCoursePlan } from "./course-plan-storage";
import { isHeldagsturModule } from "./mock-data";
import type { HeldagsturPunkt } from "./heldagstur-utils";
import { formatDate } from "./mock-data";

export interface KitchenModuleRef {
  id: string;
  dayLabel: string;
  title: string;
  klar: boolean;
  kind: "maltid" | "heldagstur-maltid";
}

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

function heldagsturMealTitle(punkt: HeldagsturPunkt): string {
  return punkt.maltid?.forplejning || "Madpakker";
}

/** Alle køkkenmoduler: måltidsmoduler + måltidspunkter på heldagsture */
export function getKitchenModuleRefs(course: Course): KitchenModuleRef[] {
  const merged = mergeCoursePlan(course);
  const refs: KitchenModuleRef[] = [];

  for (const day of merged.days) {
    for (const mod of day.modules) {
      if (mod.erMaltid && mod.maltid) {
        refs.push({
          id: mod.id,
          dayLabel: day.label,
          title: mod.maltid.forplejning || mod.overskrift || "Måltid",
          klar: mod.klar,
          kind: "maltid",
        });
      }

      if (isHeldagsturModule(mod) && mod.heldagstur) {
        for (const punkt of mod.heldagstur.punkter) {
          if (punkt.type !== "maltid" || !punkt.maltid) continue;
          refs.push({
            id: `${mod.id}-${punkt.id}`,
            dayLabel: day.label,
            title: heldagsturMealTitle(punkt),
            klar: punkt.klar,
            kind: "heldagstur-maltid",
          });
        }
      }
    }
  }

  return refs;
}

export function getUnreadyKitchenModules(course: Course): KitchenModuleRef[] {
  return getKitchenModuleRefs(course).filter((m) => !m.klar);
}

export function allKitchenModulesReady(course: Course): boolean {
  const refs = getKitchenModuleRefs(course);
  return refs.length > 0 && refs.every((m) => m.klar);
}

export function buildKitchenPlanSummary(course: Course): string {
  const rows = getMealRowsFromCourse(course);
  if (rows.length === 0) return "";

  const byDay = new Map<string, string[]>();
  for (const row of rows) {
    const key = `${row.dayLabel} · ${formatDate(row.dayDate)}`;
    const line = `${row.forplejning} ${row.tidFra}–${row.tidTil} (${row.antalPersoner} pers.) — ${row.specifikation}${row.lokale ? ` · ${row.lokale}` : ""}`;
    const list = byDay.get(key) ?? [];
    list.push(line);
    byDay.set(key, list);
  }

  return Array.from(byDay.entries())
    .map(([day, lines]) => `${day}\n${lines.map((l) => `  · ${l}`).join("\n")}`)
    .join("\n\n");
}
