import type { Course, CourseModule, LokaleSpecifikation } from "./mock-data";
import { defaultLokaleSpec } from "./mock-data";

export function isKitchenModule(mod: CourseModule): boolean {
  return Boolean(mod.erMaltid);
}

export function hasCourseLokaleSpecConfigured(
  spec?: LokaleSpecifikation,
): boolean {
  if (!spec) return false;
  return Boolean(
    spec.lokale.trim() ||
      spec.antalPersoner > 0 ||
      spec.bordopstilling !== "Normal" ||
      spec.skalBrugesFlereDage ||
      spec.klarFraUgedag ||
      spec.klarFraKl ||
      spec.ledigFraUgedag ||
      spec.ledigFraKl ||
      spec.dug ||
      spec.levendeLys ||
      spec.blomster ||
      spec.storWhiteboard ||
      spec.flipoverWhiteboard ||
      spec.projektor ||
      spec.mobilLaerredProjektor ||
      spec.mobilLydanlaeg,
  );
}

/** Effektiv lokalespec for et modul — kursus-standard eller manuel override */
export function resolveModuleLokaleSpec(
  course: Pick<Course, "courseLokaleSpec">,
  mod: CourseModule,
): LokaleSpecifikation {
  if (isKitchenModule(mod)) {
    return defaultLokaleSpec();
  }

  if (mod.lokaleSpecManuallySet && mod.lokaleSpec) {
    return mod.lokaleSpec;
  }

  if (hasCourseLokaleSpecConfigured(course.courseLokaleSpec)) {
    const base = defaultLokaleSpec(course.courseLokaleSpec);
    if (mod.lokaleSpec?.noter.trim()) {
      return { ...base, noter: mod.lokaleSpec.noter };
    }
    return base;
  }

  return mod.lokaleSpec ?? defaultLokaleSpec();
}

export function countNonKitchenModules(course: Pick<Course, "days">): number {
  return course.days.reduce(
    (sum, day) => sum + day.modules.filter((m) => !isKitchenModule(m)).length,
    0,
  );
}

export function countModulesUsingCourseLokaleSpec(course: Course): {
  total: number;
  inherited: number;
  manual: number;
} {
  const nonKitchen = course.days.flatMap((d) =>
    d.modules.filter((m) => !isKitchenModule(m)),
  );
  const manual = nonKitchen.filter((m) => m.lokaleSpecManuallySet).length;
  return {
    total: nonKitchen.length,
    inherited: nonKitchen.length - manual,
    manual,
  };
}
