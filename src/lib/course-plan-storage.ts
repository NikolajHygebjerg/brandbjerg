import type { Course, CourseChecklist, CourseDay } from "./mock-data";

export type ProgramSaveStatus = "kladde" | "faerdig";

export interface StoredCoursePlan {
  days: CourseDay[];
  modulePlanMode?: "skabelon" | "bunden";
  moduleTemplateName?: string;
  checklist?: CourseChecklist;
  programStatus: ProgramSaveStatus;
  updatedAt: string;
}

const PREFIX = "brandbjerg-course-plan-";

function storageKey(courseId: string) {
  return `${PREFIX}${courseId}`;
}

export function loadCoursePlan(courseId: string): StoredCoursePlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(courseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCoursePlan>;
    return {
      days: parsed.days ?? [],
      modulePlanMode: parsed.modulePlanMode,
      moduleTemplateName: parsed.moduleTemplateName,
      checklist: parsed.checklist,
      programStatus: parsed.programStatus ?? "kladde",
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export type PlanSnapshotInput = Pick<
  Course,
  "days" | "modulePlanMode" | "moduleTemplateName" | "checklist"
>;

export function createPlanSnapshot(
  course: PlanSnapshotInput,
  programStatus: ProgramSaveStatus,
  checklistOverride?: Partial<CourseChecklist>,
): Omit<StoredCoursePlan, "updatedAt"> {
  return {
    days: course.days,
    modulePlanMode: course.modulePlanMode,
    moduleTemplateName: course.moduleTemplateName,
    checklist: checklistOverride
      ? { ...course.checklist, ...checklistOverride }
      : course.checklist,
    programStatus,
  };
}

export function saveCoursePlan(
  courseId: string,
  plan: Omit<StoredCoursePlan, "updatedAt">,
): StoredCoursePlan {
  const payload: StoredCoursePlan = {
    ...plan,
    programStatus: plan.programStatus ?? "kladde",
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey(courseId), JSON.stringify(payload));
  }
  return payload;
}

export function mergeCoursePlan(course: Course): Course {
  const stored = loadCoursePlan(course.id);
  if (!stored) return course;
  return {
    ...course,
    days: stored.days.length > 0 ? stored.days : course.days,
    modulePlanMode: stored.modulePlanMode ?? course.modulePlanMode,
    moduleTemplateName: stored.moduleTemplateName ?? course.moduleTemplateName,
    checklist: stored.checklist ?? course.checklist,
  };
}

export function formatPlanSavedAt(iso: string): string {
  return new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
