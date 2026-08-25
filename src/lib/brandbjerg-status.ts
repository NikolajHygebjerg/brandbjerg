import type { Course, CourseStatus } from "./mock-data";
import { defaultChecklist } from "./mock-data";
import {
  brandbjerg2026Courses,
  type BrandbjergPlannedCourse,
} from "./brandbjerg-arshjul";

/** Mock tilmeldte: bruger 2025-realiseret hvis tilgængelig, ellers ~45% af budget */
function mockEnrolled(c: BrandbjergPlannedCourse): number {
  const lastYear = c.history[2025];
  if (lastYear != null && lastYear > 0) {
    return Math.min(lastYear, c.maxStudents ?? lastYear);
  }
  if (c.budgetStudents > 0) {
    return Math.round(c.budgetStudents * 0.45);
  }
  return 0;
}

function mockStatus(c: BrandbjergPlannedCourse, enrolled: number): CourseStatus {
  const cap = c.maxStudents ?? c.budgetStudents;
  if (cap > 0 && enrolled >= cap) return "fuldt";
  if (enrolled > 0) return "aaben";
  if (c.startDate && new Date(c.startDate) < new Date()) return "afvikles";
  return "markedsfoeres";
}

const RESPONSIBLE_MAP: Record<string, string> = {
  CZ: "lar-04",
  MLL: "lar-01",
  AG: "lar-03",
  KALC: "lar-02",
};

export function brandbjergToCourse(c: BrandbjergPlannedCourse): Course {
  const enrolled = mockEnrolled(c);
  const capacity = (c.maxStudents ?? c.budgetStudents) || 20;
  const leaderId = RESPONSIBLE_MAP[c.responsible] ?? "lar-01";

  return {
    id: c.id,
    title: c.title,
    category: c.type || "Kort kursus",
    startDate: c.startDate ?? `${c.weekNumber}-W`,
    endDate: c.endDate ?? c.startDate ?? "",
    price: 5_995,
    capacity,
    enrolled,
    paid: Math.round(enrolled * 0.85),
    status: mockStatus(c, enrolled),
    instructor: c.responsible || "—",
    location: "Brandbjerg Højskole",
    department: "Planlægning",
    weekNumber: c.weekNumber,
    courseLeaderId: leaderId,
    hostIds: [],
    budget: capacity * 6_000,
    marketingBudget: 3_000,
    planStatus: "godkendt",
    days: c.startDate
      ? [
          {
            id: `${c.id}-d1`,
            date: c.startDate,
            label: "Dag 1",
            modules: [],
          },
        ]
      : [],
    checklist: defaultChecklist(),
  };
}

export const statusarkCourses2026 = brandbjerg2026Courses
  .filter((c) => c.title && c.title !== "-")
  .map(brandbjergToCourse)
  .sort((a, b) => a.weekNumber - b.weekNumber || a.title.localeCompare(b.title, "da"));

export function getBrandbjergCourse(id: string): Course | undefined {
  const raw = brandbjerg2026Courses.find((c) => c.id === id);
  return raw ? brandbjergToCourse(raw) : undefined;
}
