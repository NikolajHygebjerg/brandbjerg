import { requireMobileUser, isStaffUser } from "@/lib/server/mobile/auth";
import { listStaffCoursesForMobile } from "@/lib/server/mobile/courses";
import { getDefaultCourseYear } from "@/lib/course-list";
import { jsonResponse, optionsResponse } from "@/lib/server/mobile/http";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const auth = requireMobileUser(request);
  if (!auth.ok) {
    return jsonResponse({ error: auth.error }, { status: auth.status });
  }

  if (!isStaffUser(auth.user.role)) {
    return jsonResponse(
      { error: "Kun medarbejder-konti kan hente denne liste." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const yearParam = url.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : getDefaultCourseYear();

  return jsonResponse({
    year,
    courses: listStaffCoursesForMobile(year),
  });
}
