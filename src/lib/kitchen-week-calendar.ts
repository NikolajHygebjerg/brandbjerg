import { getWeekDates } from "./arshjul-utils";
import {
  getBudgetAntal,
  getRealiseretAntal,
} from "./course-enrollment-counts";
import type { CourseListEntry } from "./course-list";
import { getCourseDetailById } from "./course-list";
import { mergeCoursePlan } from "./course-plan-storage";
import {
  collectKitchenWeekMeals,
  getKitchenMealsForCourse,
  type KitchenWeekMealRow,
} from "./kitchen-utils";
import { loadKitchenSent } from "./kitchen-storage";
import { isMellemmaltid } from "./kitchen-plan-rules";

export const ISO_WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

export const DANISH_DAY_NAMES = [
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
  "Søndag",
] as const;

export interface IsoWeekDay {
  date: string;
  dayName: (typeof DANISH_DAY_NAMES)[number];
  dayIndex: number;
}

export interface KitchenWeekStats {
  courseCount: number;
  budgetTotal: number;
  enrolledTotal: number;
  staffOnDuty: number;
  mealCount: number;
}

export interface KitchenDayStats {
  date: string;
  dayName: string;
  budgetTotal: number;
  enrolledTotal: number;
  courseCount: number;
  mealCount: number;
}

/** Mandag–søndag for ISO-uge */
export function getIsoWeekDays(year: number, weekNumber: number): IsoWeekDay[] {
  const { startDate } = getWeekDates(year, weekNumber, 1);
  const start = new Date(`${startDate}T12:00:00Z`);

  return DANISH_DAY_NAMES.map((dayName, dayIndex) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + dayIndex);
    return {
      date: d.toISOString().slice(0, 10),
      dayName,
      dayIndex,
    };
  });
}

export function dateInRange(
  date: string,
  startDate: string | null,
  endDate: string | null,
): boolean {
  if (!startDate) return false;
  const end = endDate ?? startDate;
  return date >= startDate && date <= end;
}

export function getCoursesForKitchenWeek(
  courses: CourseListEntry[],
  weekNumber: number,
): CourseListEntry[] {
  return courses.filter((c) => c.weekNumber === weekNumber);
}

export function getApprovedKitchenCourses(
  courses: CourseListEntry[],
): CourseListEntry[] {
  return courses.filter((c) => Boolean(loadKitchenSent(c.id)));
}

export function collectApprovedWeekMeals(
  courses: CourseListEntry[],
  weekNumber: number,
): KitchenWeekMealRow[] {
  const approved = getApprovedKitchenCourses(
    courses.filter((c) => c.weekNumber === weekNumber),
  );
  return collectKitchenWeekMeals(approved, weekNumber, (id) => {
    const detail = getCourseDetailById(id);
    return detail ?? undefined;
  });
}

function uniqueCourseIdsOnDate(
  meals: KitchenWeekMealRow[],
  date: string,
): Set<string> {
  return new Set(
    meals.filter((m) => m.dayDate === date).map((m) => m.courseId),
  );
}

export function getKitchenWeekStats(
  courses: CourseListEntry[],
  weekNumber: number,
  staffOverride?: number,
): KitchenWeekStats {
  const weekCourses = getCoursesForKitchenWeek(courses, weekNumber);
  const meals = collectApprovedWeekMeals(courses, weekNumber);
  const approvedIds = new Set(getApprovedKitchenCourses(weekCourses).map((c) => c.id));

  let budgetTotal = 0;
  let enrolledTotal = 0;
  for (const c of weekCourses) {
    if (!approvedIds.has(c.id)) continue;
    budgetTotal += getBudgetAntal(c);
    enrolledTotal += getRealiseretAntal(c);
  }

  const leaders = new Set(
    weekCourses
      .filter((c) => approvedIds.has(c.id))
      .map((c) => c.responsible)
      .filter((r) => r && r !== "—"),
  );

  return {
    courseCount: approvedIds.size,
    budgetTotal,
    enrolledTotal,
    staffOnDuty: staffOverride ?? 3 + leaders.size,
    mealCount: meals.length,
  };
}

export function getKitchenDayStats(
  courses: CourseListEntry[],
  weekNumber: number,
  date: string,
  dayName: string,
): KitchenDayStats {
  const meals = collectApprovedWeekMeals(courses, weekNumber);
  const dayMeals = meals.filter((m) => m.dayDate === date);
  const courseIds = uniqueCourseIdsOnDate(meals, date);

  let budgetTotal = 0;
  let enrolledTotal = 0;
  for (const c of courses) {
    if (!courseIds.has(c.id)) continue;
    budgetTotal += getBudgetAntal(c);
    enrolledTotal += getRealiseretAntal(c);
  }

  return {
    date,
    dayName,
    budgetTotal,
    enrolledTotal,
    courseCount: courseIds.size,
    mealCount: dayMeals.length,
  };
}

export function groupMealsByForplejning(
  meals: KitchenWeekMealRow[],
  date: string,
): Map<string, KitchenWeekMealRow[]> {
  const byType = new Map<string, KitchenWeekMealRow[]>();
  for (const meal of meals.filter((m) => m.dayDate === date)) {
    const key = meal.forplejning || "Andet";
    const list = byType.get(key) ?? [];
    list.push(meal);
    byType.set(key, list);
  }
  return byType;
}

export function mealSlotCategory(forplejning: string): "hovedmaltid" | "mellemmaltid" {
  return isMellemmaltid(forplejning) ? "mellemmaltid" : "hovedmaltid";
}

export const DEFAULT_DAY_MEAL_SLOTS = [
  { id: "morgenmad", forplejning: "Morgenmad", label: "Morgenmad" },
  { id: "formiddag", forplejning: "Formiddag", label: "Formiddag" },
  { id: "frokost", forplejning: "Frokost", label: "Frokost" },
  { id: "eftermiddag", forplejning: "Eftermiddag", label: "Eftermiddag" },
  { id: "aftensmad", forplejning: "Aftensmad", label: "Aftensmad" },
  { id: "aften", forplejning: "Aften", label: "Aften" },
] as const;

export function normalizeForplejningKey(value: string): string {
  return value.trim().toLowerCase();
}

export function slotMatchesForplejning(
  slotForplejning: string,
  mealForplejning: string,
): boolean {
  return (
    normalizeForplejningKey(slotForplejning) ===
    normalizeForplejningKey(mealForplejning)
  );
}

/** Kurser med godkendt forplejning der overlapper en given dag */
export function getCoursesActiveOnDate(
  courses: CourseListEntry[],
  weekNumber: number,
  date: string,
): CourseListEntry[] {
  return getApprovedKitchenCourses(
    courses.filter(
      (c) =>
        c.weekNumber === weekNumber &&
        dateInRange(date, c.startDate, c.endDate),
    ),
  );
}

export function courseHasMealOnDate(courseId: string, date: string): boolean {
  const detail = getCourseDetailById(courseId);
  if (!detail) return false;
  const merged = mergeCoursePlan(detail);
  const meals = getKitchenMealsForCourse(courseId, merged);
  return meals.some((m) => m.dayDate === date);
}
