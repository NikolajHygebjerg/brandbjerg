import { getStatusarkCourse } from "./brandbjerg-status";
import type { Course } from "./mock-data";
import type { CourseListEntry } from "./course-list";
import { netEnrolled } from "./statusark-utils";

/** Planlagt budget antal kursister (fra statusark eller kapacitet) */
export function getBudgetAntal(
  course: Pick<Course, "id" | "capacity"> | CourseListEntry,
): number {
  if ("budgetStudents" in course && course.budgetStudents > 0) {
    return course.budgetStudents;
  }
  const sa = getStatusarkCourse(course.id);
  if (sa?.budgetStudents) return sa.budgetStudents;
  return course.capacity || 0;
}

/** Faktisk tilmeldte kursister (realiseret antal) */
export function getRealiseretAntal(
  course: Pick<Course, "id" | "enrolled"> | CourseListEntry,
): number {
  const sa = getStatusarkCourse(course.id);
  if (sa) {
    return netEnrolled(sa.totalEnrolled, sa.paidCancellations);
  }
  return course.enrolled || 0;
}

export function formatBudgetOgRealiseret(
  course: Pick<Course, "id" | "capacity" | "enrolled"> | CourseListEntry,
): string {
  const budget = getBudgetAntal(course);
  const realiseret = getRealiseretAntal(course);
  return `${budget} budget · ${realiseret} realiseret`;
}
