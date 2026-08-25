import type { CourseDay } from "./mock-data";

export interface StoredCoursePlan {
  days: CourseDay[];
  modulePlanMode?: "skabelon" | "bunden";
  moduleTemplateName?: string;
  updatedAt: string;
}

const PREFIX = "brandbjerg-course-plan-";

function key(courseId: string) {
  return `${PREFIX}${courseId}`;
}

export function loadCoursePlan(courseId: string): StoredCoursePlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(courseId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredCoursePlan;
  } catch {
    return null;
  }
}

export function saveCoursePlan(
  courseId: string,
  plan: Omit<StoredCoursePlan, "updatedAt">,
) {
  if (typeof window === "undefined") return;
  const payload: StoredCoursePlan = {
    ...plan,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(key(courseId), JSON.stringify(payload));
}

export function mergeCoursePlan<T extends { id: string; days: CourseDay[] }>(
  course: T,
): T {
  const stored = loadCoursePlan(course.id);
  if (!stored) return course;
  return {
    ...course,
    days: stored.days.length > 0 ? stored.days : course.days,
    ...(stored.modulePlanMode ? { modulePlanMode: stored.modulePlanMode } : {}),
    ...(stored.moduleTemplateName
      ? { moduleTemplateName: stored.moduleTemplateName }
      : {}),
  } as T;
}
