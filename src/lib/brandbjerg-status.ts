import { brandbjerg2026Courses } from "./brandbjerg-arshjul";
import { defaultLeaderForInitials, getStaffByInitials } from "./brandbjerg-staff";
import type { Course, CourseStatus } from "./mock-data";
import { defaultChecklist } from "./mock-data";
import {
  statusarkCourses,
  type StatusarkCourse,
} from "./brandbjerg-statusark";
import { netEnrolled } from "./statusark-utils";

function deriveStatus(c: StatusarkCourse): CourseStatus {
  const cap = c.maxStudents ?? c.budgetStudents;
  const enrolled = netEnrolled(c.totalEnrolled, c.paidCancellations);
  if (cap > 0 && enrolled >= cap) return "fuldt";
  if (enrolled > 0) return "aaben";
  if (c.startDate && new Date(c.startDate) < new Date()) return "afvikles";
  return "markedsfoeres";
}

function findResponsibleInitials(title: string, week: number): string {
  const match = brandbjerg2026Courses.find(
    (c) =>
      c.weekNumber === week &&
      c.title.toLowerCase().trim() === title.toLowerCase().trim(),
  );
  return match?.responsible || "";
}

export function statusarkToCourse(c: StatusarkCourse): Course {
  const enrolled = netEnrolled(c.totalEnrolled, c.paidCancellations);
  const capacity = (c.maxStudents ?? c.budgetStudents) || 20;
  const staff = getStaffByInitials(
    findResponsibleInitials(c.title, c.courseWeekNumber),
  );

  return {
    id: c.id,
    title: c.title,
    category: c.type || "Kort kursus",
    startDate: c.startDate ?? "",
    endDate: c.endDate ?? c.startDate ?? "",
    price: 5_995,
    capacity,
    enrolled,
    paid: Math.max(0, enrolled - (c.paidCancellations || 0)),
    status: deriveStatus(c),
    instructor: staff?.name ?? "—",
    location: "Brandbjerg Højskole",
    department: "Planlægning",
    weekNumber: c.courseWeekNumber,
    courseLeaderId: staff
      ? staff.id
      : defaultLeaderForInitials("AG"),
    hostIds: [],
    budget: c.budgetStudents * 6_000,
    marketingBudget: 3_000,
    planStatus: "godkendt",
    days: c.startDate
      ? [{ id: `${c.id}-d1`, date: c.startDate, label: "Dag 1", modules: [] }]
      : [],
    checklist: defaultChecklist(),
  };
}

export { statusarkCourses };

export function getStatusarkCourse(id: string): StatusarkCourse | undefined {
  return statusarkCourses.find((c) => c.id === id);
}

export function getStatusarkCourseAsDetail(id: string): Course | undefined {
  const raw = getStatusarkCourse(id);
  return raw ? statusarkToCourse(raw) : undefined;
}

/** @deprecated use statusarkCourses */
export const statusarkCourses2026 = statusarkCourses.map(statusarkToCourse);

/** @deprecated use getStatusarkCourseAsDetail */
export function getBrandbjergCourse(id: string): Course | undefined {
  return getStatusarkCourseAsDetail(id);
}
