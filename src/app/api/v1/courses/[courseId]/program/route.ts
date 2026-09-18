import { canAccessKursistPages } from "@/lib/auth-types";
import { requireMobileUser, isStaffUser } from "@/lib/server/mobile/auth";
import {
  findServerEnrollmentsByEmail,
  resolveCourseForMobile,
  serializeProgramDay,
} from "@/lib/server/mobile/courses";
import { jsonResponse, optionsResponse } from "@/lib/server/mobile/http";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  const auth = requireMobileUser(request);
  if (!auth.ok) {
    return jsonResponse({ error: auth.error }, { status: auth.status });
  }

  const { courseId } = await context.params;
  const course = resolveCourseForMobile(courseId);
  if (!course) {
    return jsonResponse({ error: "Kursus ikke fundet." }, { status: 404 });
  }

  if (canAccessKursistPages(auth.user.role)) {
    const enrolled = findServerEnrollmentsByEmail(auth.user.email).some(
      (e) => e.course.id === courseId,
    );
    if (!enrolled) {
      return jsonResponse({ error: "Ingen adgang til dette kursus." }, { status: 403 });
    }
  } else if (!isStaffUser(auth.user.role)) {
    return jsonResponse({ error: "Ingen adgang." }, { status: 403 });
  }

  return jsonResponse({
    course: {
      id: course.id,
      title: course.title,
      startDate: course.startDate,
      endDate: course.endDate,
      weekNumber: course.weekNumber,
    },
    days: course.days.map(serializeProgramDay),
  });
}
