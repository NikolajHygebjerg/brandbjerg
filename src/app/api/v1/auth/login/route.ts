import { loginWithSeedCredentials } from "@/lib/server/mobile/auth";
import { isStaffUser } from "@/lib/server/mobile/auth";
import { jsonResponse, optionsResponse } from "@/lib/server/mobile/http";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return jsonResponse({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const result = loginWithSeedCredentials(body.email ?? "", body.password ?? "");
  if (!result.ok) {
    return jsonResponse({ error: result.error }, { status: 401 });
  }

  const { user, token } = result;
  return jsonResponse({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isStaff: isStaffUser(user.role),
    },
  });
}
