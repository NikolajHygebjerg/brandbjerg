import { getCourseDetailById, getCoursesForYear } from "./course-list";
import {
  getPedelDayRooms,
  timeSpanForRoom,
  type PedelDayRoom,
} from "./pedel-utils";
import { mergeCoursePlan } from "./course-plan-storage";
import type { Course } from "./mock-data";
import { isLokaleKlar } from "./rengoring-storage";
import {
  getVaerelserForRengoringDate,
  type RengoringVaerelseRow,
} from "./rengoring-room-utils";

export interface RengoringLokaleRow {
  id: string;
  lokale: string;
  courseId: string;
  courseTitle: string;
  dayDate: string;
  timeSpan: string;
  klar: boolean;
}

function courseActiveOnDate(
  course: { startDate: string | null; endDate: string | null },
  date: string,
): boolean {
  if (!course.startDate || !course.endDate) return false;
  return course.startDate <= date && course.endDate >= date;
}

function getCoursesForDate(date: string): Course[] {
  const year = parseInt(date.slice(0, 4), 10);
  return getCoursesForYear(year)
    .filter((entry) => courseActiveOnDate(entry, date))
    .map((entry) => getCourseDetailById(entry.id))
    .filter((c): c is Course => Boolean(c))
    .map((c) => mergeCoursePlan(c));
}

export function getLokalerForRengoringDate(date: string): RengoringLokaleRow[] {
  const rows: RengoringLokaleRow[] = [];
  const seen = new Set<string>();

  for (const course of getCoursesForDate(date)) {
    const dayRooms = getPedelDayRooms(course).filter((r) => r.dayDate === date);

    for (const room of dayRooms) {
      const id = `${course.id}|${room.dayDate}|${room.lokale}`;
      if (seen.has(id)) continue;
      seen.add(id);

      rows.push({
        id,
        lokale: room.lokale,
        courseId: course.id,
        courseTitle: course.title,
        dayDate: room.dayDate,
        timeSpan: timeSpanForRoom(room.entries),
        klar: isLokaleKlar(id),
      });
    }
  }

  return rows.sort(
    (a, b) =>
      a.lokale.localeCompare(b.lokale, "da") ||
      a.courseTitle.localeCompare(b.courseTitle, "da"),
  );
}

export function countLokalerNeedingCleaning(date: string): number {
  return getLokalerForRengoringDate(date).filter((r) => !r.klar).length;
}

export function getDagensRengoringOpgaver(date: string): {
  vaerelser: RengoringVaerelseRow[];
  lokaler: RengoringLokaleRow[];
} {
  return {
    vaerelser: getVaerelserForRengoringDate(date).filter((r) => r.needsCleaning),
    lokaler: getLokalerForRengoringDate(date).filter((r) => !r.klar),
  };
}
