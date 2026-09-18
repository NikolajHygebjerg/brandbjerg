import { statusarkCourses, statusarkYear } from "@/lib/brandbjerg-statusark";
import { getCourseDetailById, getCoursesForYear } from "@/lib/course-list";
import { generateParticipantsForCourse } from "@/lib/kontor-participants";
import { buildDaysFromTemplate } from "@/lib/module-plan-utils";
import { programUbak5Dage } from "@/lib/program-templates/liv-i-haven-5dage";
import type { Course, CourseDay, CourseModule } from "@/lib/mock-data";
import { formatDate } from "@/lib/mock-data";
import type { KontorParticipant } from "@/lib/kontor-types";

export function findServerEnrollmentsByEmail(email: string): Array<{
  participant: KontorParticipant;
  course: Course;
}> {
  const normalized = email.trim().toLowerCase();
  const results: Array<{ participant: KontorParticipant; course: Course }> =
    [];

  for (const entry of statusarkCourses) {
    const participants = generateParticipantsForCourse(entry.id);
    const participant = participants.find(
      (p) => p.email.toLowerCase() === normalized && p.status !== "aflyst",
    );
    if (!participant) continue;
    const course = resolveCourseForMobile(entry.id);
    if (!course) continue;
    results.push({ participant, course });
  }

  return results.sort(
    (a, b) =>
      a.course.startDate.localeCompare(b.course.startDate) ||
      a.course.title.localeCompare(b.course.title, "da"),
  );
}

/** Demo-program på server når plan kun ligger i browser-localStorage. */
export function resolveCourseForMobile(courseId: string): Course | undefined {
  const detail = getCourseDetailById(courseId);
  if (!detail) return undefined;
  if (detail.days.some((d) => d.modules.length > 0)) return detail;

  const dayCount =
    detail.startDate && detail.endDate
      ? Math.max(
          1,
          Math.round(
            (new Date(detail.endDate).getTime() -
              new Date(detail.startDate).getTime()) /
              86_400_000,
          ) + 1,
        )
      : 0;

  if (dayCount !== 5 || !detail.startDate) return detail;

  const days = buildDaysFromTemplate(programUbak5Dage, detail.startDate).map(
    (day, i) => ({
      ...day,
      id: `${courseId}-d${i + 1}`,
    }),
  );

  return { ...detail, days };
}

export function serializeProgramDay(day: CourseDay) {
  return {
    id: day.id,
    label: day.label,
    date: day.date,
    dateLabel: formatDate(day.date),
    modules: day.modules.map(serializeProgramModule),
  };
}

function serializeProgramModule(mod: CourseModule) {
  return {
    id: mod.id,
    tidFra: mod.tidFra,
    tidTil: mod.tidTil,
    overskrift: mod.erMaltid
      ? mod.maltid?.forplejning || mod.overskrift || "Måltid"
      : mod.overskrift,
    erMaltid: Boolean(mod.erMaltid),
    underviser: mod.underviser,
    broedtekst: mod.broedtekst,
  };
}

export function listStaffCoursesForMobile(year = statusarkYear) {
  return getCoursesForYear(year).map((c) => ({
    id: c.id,
    title: c.title,
    weekNumber: c.weekNumber,
    startDate: c.startDate,
    endDate: c.endDate,
    enrolled: c.enrolled,
    capacity: c.capacity,
  }));
}
