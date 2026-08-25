import type { Course, CourseStatus } from "./mock-data";
import { defaultChecklist } from "./mock-data";
import {
  brandbjerg2026Courses,
  defaultAnnualPlans,
  type AnnualPlan,
  type BrandbjergPlannedCourse,
} from "./brandbjerg-arshjul";
import {
  getStatusarkCourseAsDetail,
  statusarkToCourse,
} from "./brandbjerg-status";
import {
  statusarkCourses,
  statusarkYear,
  type StatusarkCourse,
} from "./brandbjerg-statusark";
import {
  loadActiveYearFromStorage,
  loadPlansFromStorage,
} from "./arshjul-utils";
import { defaultLeaderForInitials, getStaffByInitials } from "./brandbjerg-staff";
import { netEnrolled } from "./statusark-utils";
import {
  buildEmptyDays,
  countInclusiveDays,
} from "./module-plan-utils";

export interface CourseListEntry {
  id: string;
  year: number;
  title: string;
  type: string;
  responsible: string;
  weekNumber: number;
  startDate: string | null;
  endDate: string | null;
  budgetStudents: number;
  enrolled: number;
  capacity: number;
  status: CourseStatus;
}

function mergePlans(stored: AnnualPlan[]): AnnualPlan[] {
  const byYear = new Map<number, AnnualPlan>();
  for (const d of defaultAnnualPlans) byYear.set(d.year, d);
  for (const s of stored) byYear.set(s.year, s);
  return Array.from(byYear.values());
}

function plannedToListEntry(
  c: BrandbjergPlannedCourse,
  year: number,
  planStatus: AnnualPlan["planStatus"],
): CourseListEntry {
  const capacity = (c.maxStudents ?? c.budgetStudents) || 20;
  const status: CourseStatus =
    planStatus === "godkendt" ? "godkendt" : "udkast";

  return {
    id: c.id,
    year,
    title: c.title,
    type: c.type || "—",
    responsible: c.responsible || "—",
    weekNumber: c.weekNumber,
    startDate: c.startDate,
    endDate: c.endDate,
    budgetStudents: c.budgetStudents,
    enrolled: 0,
    capacity,
    status,
  };
}

function statusarkToListEntry(c: StatusarkCourse): CourseListEntry {
  const course = statusarkToCourse(c);
  return {
    id: c.id,
    year: statusarkYear,
    title: c.title,
    type: c.type || "—",
    responsible: findResponsible(c.title, c.courseWeekNumber),
    weekNumber: c.courseWeekNumber,
    startDate: c.startDate,
    endDate: c.endDate,
    budgetStudents: c.budgetStudents,
    enrolled: netEnrolled(c.totalEnrolled, c.paidCancellations),
    capacity: course.capacity,
    status: course.status,
  };
}

function findResponsible(title: string, week: number): string {
  const match = brandbjerg2026Courses.find(
    (c) =>
      c.weekNumber === week &&
      c.title.toLowerCase().trim() === title.toLowerCase().trim(),
  );
  return match?.responsible || "—";
}

export function getAvailableCourseYears(): number[] {
  if (typeof window === "undefined") {
    return [statusarkYear, ...defaultAnnualPlans.map((p) => p.year)]
      .filter((y, i, a) => a.indexOf(y) === i)
      .sort((a, b) => b - a);
  }
  const stored = loadPlansFromStorage() ?? [];
  const plans = mergePlans(stored);
  const years = new Set<number>([
    statusarkYear,
    ...plans.map((p) => p.year),
    2025,
    2024,
  ]);
  return Array.from(years).sort((a, b) => b - a);
}

export function getCoursesForYear(year: number): CourseListEntry[] {
  if (year === statusarkYear) {
    return statusarkCourses
      .map(statusarkToListEntry)
      .sort(
        (a, b) =>
          a.weekNumber - b.weekNumber ||
          a.title.localeCompare(b.title, "da"),
      );
  }

  if (typeof window === "undefined") {
    const plan = defaultAnnualPlans.find((p) => p.year === year);
    if (!plan) return [];
    return plan.courses
      .filter((c) => c.title && c.title !== "-")
      .map((c) => plannedToListEntry(c, year, plan.planStatus))
      .sort(
        (a, b) =>
          a.weekNumber - b.weekNumber ||
          a.title.localeCompare(b.title, "da"),
      );
  }

  const stored = loadPlansFromStorage() ?? [];
  const plans = mergePlans(stored);
  const plan = plans.find((p) => p.year === year);
  if (!plan) return [];

  return plan.courses
    .filter((c) => c.title && c.title !== "-")
    .map((c) => plannedToListEntry(c, year, plan.planStatus))
    .sort(
      (a, b) =>
        a.weekNumber - b.weekNumber || a.title.localeCompare(b.title, "da"),
    );
}

export function getDefaultCourseYear(): number {
  if (typeof window === "undefined") return statusarkYear;
  const saved = loadActiveYearFromStorage();
  const years = getAvailableCourseYears();
  if (saved && years.includes(saved)) return saved;
  return years[0] ?? statusarkYear;
}

export function plannedCourseToDetail(
  c: BrandbjergPlannedCourse,
  planStatus: AnnualPlan["planStatus"],
): Course {
  const capacity = (c.maxStudents ?? c.budgetStudents) || 20;
  const staff = getStaffByInitials(c.responsible);
  return {
    id: c.id,
    title: c.title,
    category: c.type || "Kort kursus",
    startDate: c.startDate ?? "",
    endDate: c.endDate ?? c.startDate ?? "",
    price: 5_995,
    capacity,
    enrolled: 0,
    paid: 0,
    status: planStatus === "godkendt" ? "godkendt" : "udkast",
    instructor: staff?.name ?? (c.responsible || "—"),
    location: "Brandbjerg Højskole",
    department: "Planlægning",
    weekNumber: c.weekNumber,
    courseLeaderId: staff
      ? staff.id
      : defaultLeaderForInitials(c.responsible || "AG"),
    hostIds: [],
    budget: c.budgetStudents * 6_000,
    marketingBudget: 3_000,
    planStatus: planStatus === "godkendt" ? "godkendt" : "udkast",
    days:
      c.startDate && (c.endDate || c.startDate)
        ? buildEmptyDays(
            c.startDate,
            countInclusiveDays(
              c.startDate,
              c.endDate ?? c.startDate,
            ) ||
              c.dayCount ||
              1,
          ).map((day, i) => ({
            ...day,
            id: `${c.id}-d${i + 1}`,
          }))
        : [],
    checklist: defaultChecklist(),
  };
}

export function getCourseDetailById(id: string): Course | undefined {
  const fromStatusark = getStatusarkCourseAsDetail(id);
  if (fromStatusark) return fromStatusark;

  for (const plan of defaultAnnualPlans) {
    const raw = plan.courses.find((c) => c.id === id);
    if (raw) return plannedCourseToDetail(raw, plan.planStatus);
  }

  if (typeof window !== "undefined") {
    const stored = loadPlansFromStorage() ?? [];
    for (const plan of mergePlans(stored)) {
      const raw = plan.courses.find((c) => c.id === id);
      if (raw) return plannedCourseToDetail(raw, plan.planStatus);
    }
  }

  return undefined;
}
