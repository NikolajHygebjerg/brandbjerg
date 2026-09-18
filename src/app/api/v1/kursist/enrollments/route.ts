import { canAccessKursistPages } from "@/lib/auth-types";
import { requireMobileUser } from "@/lib/server/mobile/auth";
import { findServerEnrollmentsByEmail } from "@/lib/server/mobile/courses";
import { formatDate } from "@/lib/mock-data";
import { jsonResponse, optionsResponse } from "@/lib/server/mobile/http";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const auth = requireMobileUser(request);
  if (!auth.ok) {
    return jsonResponse({ error: auth.error }, { status: auth.status });
  }

  if (!canAccessKursistPages(auth.user.role)) {
    return jsonResponse(
      { error: "Kun kursist-konti kan hente tilmeldinger her." },
      { status: 403 },
    );
  }

  const enrollments = findServerEnrollmentsByEmail(auth.user.email).map(
    ({ participant, course }) => ({
      courseId: course.id,
      title: course.title,
      startDate: course.startDate,
      endDate: course.endDate,
      dateLabel: `${formatDate(course.startDate)} – ${formatDate(course.endDate)}`,
      weekNumber: course.weekNumber,
      participantStatus: participant.status,
      roomNumber: participant.roomNumber,
    }),
  );

  return jsonResponse({ enrollments });
}
