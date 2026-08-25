import type { CourseDay, CourseModule } from "./mock-data";
import type {
  ProgramTemplate,
  TemplateModuleRow,
} from "./program-templates/liv-i-haven-5dage";
import { templateRowToModule } from "./program-templates/liv-i-haven-5dage";

export function moduleToTemplateRow(mod: CourseModule): TemplateModuleRow {
  return {
    tidFra: mod.tidFra,
    tidTil: mod.tidTil,
    overskrift: mod.overskrift,
    rolle: mod.rolle,
    underviserType: mod.underviserType,
    timing: { ...mod.timing },
    lon: mod.lon,
    erMaltid: mod.erMaltid,
    erHeldagstur: mod.erHeldagstur,
    broedtekst: mod.broedtekst.trim() ? mod.broedtekst : undefined,
  };
}

export function templateToCourseDays(template: ProgramTemplate): CourseDay[] {
  return template.days.map((rows, i) => ({
    id: `${template.id}-day-${i + 1}`,
    date: `2026-08-${String(24 + i).padStart(2, "0")}`,
    label: template.weekdayLabels[i] ?? `Dag ${i + 1}`,
    modules: rows.map((row, j) =>
      templateRowToModule(row, i * 100 + j + template.id.length),
    ),
  }));
}

export function courseDaysToTemplate(
  base: ProgramTemplate,
  days: CourseDay[],
): ProgramTemplate {
  return {
    ...base,
    days: days.map((day) => day.modules.map(moduleToTemplateRow)),
  };
}

export function countTemplateModules(template: ProgramTemplate): number {
  return template.days.reduce((sum, day) => sum + day.length, 0);
}
