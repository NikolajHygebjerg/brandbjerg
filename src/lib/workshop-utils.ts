import type { Course, CourseModule } from "./mock-data";
import type { KontorParticipant } from "./kontor-types";
import { mergeCoursePlan } from "./course-plan-storage";
import type { WorkshopOption } from "./workshop-types";

export function isWorkshopModule(mod: CourseModule): boolean {
  return Boolean(mod.erWorkshops);
}

export function visibleWorkshopOptions(mod: CourseModule): WorkshopOption[] {
  if (!isWorkshopModule(mod)) return [];
  return (mod.workshops ?? []).filter((w) => w.overskrift.trim());
}

export function getWorkshopModulesFromCourse(course: Course): CourseModule[] {
  const merged = mergeCoursePlan(course);
  return merged.days.flatMap((d) => d.modules).filter(isWorkshopModule);
}

export function getRegistrationWorkshopModules(
  course: Course,
): CourseModule[] {
  return getWorkshopModulesFromCourse(course).filter(
    (m) => visibleWorkshopOptions(m).length > 0,
  );
}

export function activeParticipants(
  participants: KontorParticipant[],
): KontorParticipant[] {
  return participants.filter((p) => p.status !== "aflyst");
}

export function countWorkshopEnrollments(
  participants: KontorParticipant[],
  moduleId: string,
  optionId: string,
): number {
  return activeParticipants(participants).filter(
    (p) => p.workshopChoices?.[moduleId] === optionId,
  ).length;
}

export function isWorkshopOptionFull(
  participants: KontorParticipant[],
  moduleId: string,
  option: WorkshopOption,
): boolean {
  if (option.maxDeltagere <= 0) return false;
  return (
    countWorkshopEnrollments(participants, moduleId, option.id) >=
    option.maxDeltagere
  );
}

export function getAvailableWorkshopOptions(
  participants: KontorParticipant[],
  mod: CourseModule,
): WorkshopOption[] {
  return visibleWorkshopOptions(mod).filter(
    (o) => !isWorkshopOptionFull(participants, mod.id, o),
  );
}

export interface WorkshopEnrollmentRow {
  moduleId: string;
  moduleTitle: string;
  option: WorkshopOption;
  enrolled: number;
  max: number;
  full: boolean;
  participants: KontorParticipant[];
}

export function buildWorkshopEnrollmentOverview(
  course: Course,
  participants: KontorParticipant[],
): WorkshopEnrollmentRow[] {
  const rows: WorkshopEnrollmentRow[] = [];
  for (const mod of getWorkshopModulesFromCourse(course)) {
    for (const option of visibleWorkshopOptions(mod)) {
      const enrolled = countWorkshopEnrollments(
        participants,
        mod.id,
        option.id,
      );
      const max = option.maxDeltagere;
      rows.push({
        moduleId: mod.id,
        moduleTitle: mod.overskrift || "Workshops",
        option,
        enrolled,
        max,
        full: max > 0 && enrolled >= max,
        participants: activeParticipants(participants).filter(
          (p) => p.workshopChoices?.[mod.id] === option.id,
        ),
      });
    }
  }
  return rows;
}

export { createWorkshopOption } from "./workshop-types";
export type { WorkshopOption } from "./workshop-types";
