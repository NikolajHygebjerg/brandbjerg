import { redirect } from "next/navigation";
import {
  getAvailableCourseYears,
  getCourseDetailById,
  getCoursesForYear,
} from "@/lib/course-list";
import { getIsoWeekForDate } from "@/lib/kitchen-active-meal";

function findCourseWeek(id: string): { year: number; weekNumber: number } | null {
  for (const year of getAvailableCourseYears()) {
    const entry = getCoursesForYear(year).find((c) => c.id === id);
    if (entry) {
      return { year, weekNumber: entry.weekNumber };
    }
  }

  const detail = getCourseDetailById(id);
  if (detail?.weekNumber) {
    return { year: getAvailableCourseYears()[0] ?? 2026, weekNumber: detail.weekNumber };
  }

  return null;
}

export default async function PedelLegacyCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = findCourseWeek(id);

  if (match) {
    redirect(`/pedel/uge/${match.year}/${match.weekNumber}`);
  }

  const { year, weekNumber } = getIsoWeekForDate(new Date());
  redirect(`/pedel/uge/${year}/${weekNumber}`);
}
