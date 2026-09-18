import { isStaffUser, requireMobileUser } from "@/lib/server/mobile/auth";
import { jsonResponse, optionsResponse } from "@/lib/server/mobile/http";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: Request) {
  const auth = requireMobileUser(request);
  if (!auth.ok) {
    return jsonResponse({ error: auth.error }, { status: auth.status });
  }
  const { user } = auth;
  return jsonResponse({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isStaff: isStaffUser(user.role),
    },
  });
}
