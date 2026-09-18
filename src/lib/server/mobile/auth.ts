import { createHmac, timingSafeEqual } from "crypto";
import type { User, UserRole } from "@/lib/auth-types";
import { canAccessAdminPortal } from "@/lib/auth-types";
import { SEED_PASSWORD, SEED_USERS } from "@/lib/auth-seed";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function apiSecret(): string {
  return process.env.MOBILE_API_SECRET ?? "brandbjerg-mobile-dev-secret";
}

export interface MobileSessionPayload {
  sub: string;
  email: string;
  role: UserRole;
  exp: number;
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

export function signMobileToken(user: User): string {
  const payload: MobileSessionPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", apiSecret()).update(body).digest();
  return `${body}.${b64url(sig)}`;
}

export function verifyMobileToken(
  token: string,
): MobileSessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = createHmac("sha256", apiSecret()).update(body).digest();
  const actual = fromB64url(sig);
  if (expected.length !== actual.length) return null;
  if (!timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(
      fromB64url(body).toString("utf8"),
    ) as MobileSessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.sub || !payload.email || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

export function loginWithSeedCredentials(
  email: string,
  password: string,
): { ok: true; user: User; token: string } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  const pwd = password.trim();
  if (!normalized || !pwd) {
    return { ok: false, error: "E-mail og adgangskode er påkrævet." };
  }
  if (pwd !== SEED_PASSWORD) {
    return { ok: false, error: "Forkert adgangskode." };
  }

  const seed = SEED_USERS.find((u) => u.email.toLowerCase() === normalized);
  if (!seed) {
    return { ok: false, error: "Bruger findes ikke i demo-systemet." };
  }

  const user: User = {
    id: seed.id,
    name: seed.name,
    email: seed.email,
    role: seed.role,
    createdAt: new Date().toISOString(),
  };

  return { ok: true, user, token: signMobileToken(user) };
}

export function bearerFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
}

export function requireMobileUser(
  request: Request,
): { ok: true; user: User } | { ok: false; status: number; error: string } {
  const token = bearerFromRequest(request);
  if (!token) {
    return { ok: false, status: 401, error: "Manglende adgangstoken." };
  }
  const payload = verifyMobileToken(token);
  if (!payload) {
    return { ok: false, status: 401, error: "Ugyldigt eller udløbet token." };
  }
  const seed = SEED_USERS.find((u) => u.id === payload.sub);
  const user: User = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    name: seed?.name ?? payload.email.split("@")[0],
    createdAt: new Date().toISOString(),
  };
  return { ok: true, user };
}

export function isStaffUser(role: UserRole): boolean {
  return canAccessAdminPortal(role);
}
