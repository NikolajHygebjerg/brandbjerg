import { loadAllParticipants } from "./kontor-storage";
import type { KontorParticipant } from "./kontor-types";
import { getCourseDetailById } from "./course-list";
import { mergeCoursePlan } from "./course-plan-storage";
import { formatDate, type Course } from "./mock-data";
import { ensureParticipantsForCourse } from "./kontor-participants";

export interface KursistEnrollment {
  participant: KontorParticipant;
  course: Course;
}

function isActiveEnrollment(p: KontorParticipant): boolean {
  return p.status !== "aflyst";
}

export function findEnrollmentsByEmail(email: string): KursistEnrollment[] {
  const normalized = email.trim().toLowerCase();
  const enrollments: KursistEnrollment[] = [];

  for (const [courseId, participants] of Object.entries(loadAllParticipants())) {
    const participant = participants.find(
      (p) => p.email.toLowerCase() === normalized && isActiveEnrollment(p),
    );
    if (!participant) continue;

    const detail = getCourseDetailById(courseId);
    if (!detail) continue;

    enrollments.push({
      participant,
      course: mergeCoursePlan(detail),
    });
  }

  return enrollments.sort(
    (a, b) =>
      a.course.startDate.localeCompare(b.course.startDate) ||
      a.course.title.localeCompare(b.course.title, "da"),
  );
}

/** Demo: sørg for at deltager0 findes på et kursus med tilmeldinger */
export function ensureDemoKursistEnrollment(courseId: string): KontorParticipant | null {
  const participants = ensureParticipantsForCourse(courseId);
  const demo = participants.find((p) => p.email === "deltager0@example.dk");
  return demo ?? participants[0] ?? null;
}

export function formatEnrollmentDates(course: Course): string {
  return `${formatDate(course.startDate)} – ${formatDate(course.endDate)}`;
}

export function enrollmentStatusLabel(status: KontorParticipant["status"]): string {
  switch (status) {
    case "betalt":
      return "Betalt";
    case "reserveret":
      return "Reserveret";
    case "venteliste":
      return "Venteliste";
    case "aflyst":
      return "Aflyst";
  }
}
