import type {
  Course,
  CourseChecklist,
  CourseDay,
  LokaleSpecifikation,
} from "./mock-data";
import type { CourseHostEntry } from "./course-host-types";
import type { BudgetManualLines, CourseBudgetInput } from "./budget/budget-types";
import { defaultBudgetManualLines } from "./budget/budget-calculator";

export type ProgramSaveStatus = "kladde" | "faerdig";

export interface StoredCoursePlan {
  days: CourseDay[];
  modulePlanMode?: "skabelon" | "bunden";
  moduleTemplateName?: string;
  checklist?: CourseChecklist;
  programStatus: ProgramSaveStatus;
  budgetManual?: BudgetManualLines;
  budgetInput?: Partial<CourseBudgetInput>;
  courseLokaleSpec?: LokaleSpecifikation;
  pedelGenerelleNoter?: string;
  kursetsHovedsigte?: string;
  manualHosts?: CourseHostEntry[];
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
      budgetManual: parsed.budgetManual,
      budgetInput: parsed.budgetInput,
      courseLokaleSpec: parsed.courseLokaleSpec,
      pedelGenerelleNoter: parsed.pedelGenerelleNoter,
      kursetsHovedsigte: parsed.kursetsHovedsigte,
      manualHosts: parsed.manualHosts,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export type PlanSnapshotInput = Pick<
  Course,
  | "days"
  | "modulePlanMode"
  | "moduleTemplateName"
  | "checklist"
  | "courseLokaleSpec"
  | "pedelGenerelleNoter"
  | "kursetsHovedsigte"
  | "manualHosts"
> & {
  budgetManual?: BudgetManualLines;
  budgetInput?: Partial<CourseBudgetInput>;
};

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
    budgetManual: course.budgetManual,
    budgetInput: course.budgetInput,
    courseLokaleSpec: course.courseLokaleSpec,
    pedelGenerelleNoter: course.pedelGenerelleNoter,
    kursetsHovedsigte: course.kursetsHovedsigte,
    manualHosts: course.manualHosts,
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
    courseLokaleSpec: stored.courseLokaleSpec ?? course.courseLokaleSpec,
    pedelGenerelleNoter: stored.pedelGenerelleNoter ?? course.pedelGenerelleNoter,
    kursetsHovedsigte: stored.kursetsHovedsigte ?? course.kursetsHovedsigte,
    manualHosts: stored.manualHosts ?? course.manualHosts,
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
