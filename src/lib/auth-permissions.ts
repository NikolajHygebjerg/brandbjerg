import type { UserRole } from "./auth-types";
import { hasFullPlatformAccess } from "./auth-types";

/** Fællessider — tilgængelige for de fleste medarbejderroller */
export const COMMON_ROUTES = ["/katalog", "/overblik"] as const;

const MODULE_PREFIXES: Record<string, string[]> = {
  planlaegning: ["/planlaegning"],
  skabeloner: ["/skabeloner"],
  kursusleder: ["/kursusleder"],
  koekken: ["/koekken"],
  pedel: ["/pedel"],
  rengoring: ["/rengoring"],
  vagtplanlaegning: ["/vagtplanlaegning"],
  vaerelsesbooking: ["/vaerelsesbooking"],
  kontor: ["/kontor"],
  kommunikation: ["/kommunikation"],
  brugere: ["/brugere"],
  kursist: ["/kursist"],
};

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function matchesAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => matchesPrefix(pathname, p));
}

function isCommonRoute(pathname: string): boolean {
  return COMMON_ROUTES.some((r) => matchesPrefix(pathname, r));
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (hasFullPlatformAccess(role)) return true;

  if (matchesPrefix(pathname, "/rengoring/admin")) {
    return role === "rengoringsleder";
  }

  if (isCommonRoute(pathname)) {
    return roleHasCommonAccess(role);
  }

  if (role === "kursist") {
    return matchesPrefix(pathname, "/kursist");
  }

  if (role === "hojskolelaerer") {
    return matchesPrefix(pathname, "/vaerelsesbooking");
  }

  const modules = ROLE_MODULE_ACCESS[role] ?? [];
  for (const module of modules) {
    const prefixes = MODULE_PREFIXES[module];
    if (prefixes && matchesAny(pathname, prefixes)) {
      return true;
    }
  }

  return false;
}

function roleHasCommonAccess(role: UserRole): boolean {
  return ROLE_MODULE_ACCESS[role]?.includes("common") ?? false;
}

const ROLE_MODULE_ACCESS: Record<UserRole, string[]> = {
  superadmin: [],
  admin: [],
  kursusleder: ["kursusleder", "common"],
  hojskolelaerer: ["vaerelsesbooking"],
  kursist: ["kursist"],
  koekkenleder: ["koekken", "vagtplanlaegning", "common"],
  koekkenassistent: ["koekken", "common"],
  rengoringsleder: ["rengoring", "vagtplanlaegning", "common"],
  rengoringsassistent: ["rengoring", "common"],
  pedelleder: ["pedel", "common"],
  pedelassistent: ["pedel", "common"],
  kontor: ["kontor", "common"],
};

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case "superadmin":
    case "admin":
      return "/planlaegning/statusark";
    case "kursusleder":
      return "/kursusleder";
    case "hojskolelaerer":
      return "/vaerelsesbooking";
    case "kursist":
      return "/kursist";
    case "koekkenleder":
    case "koekkenassistent":
      return "/koekken";
    case "rengoringsleder":
    case "rengoringsassistent":
      return "/rengoring";
    case "pedelleder":
    case "pedelassistent":
      return "/pedel";
    case "kontor":
      return "/kontor";
    default:
      return "/ingen-adgang";
  }
}

export function canManageUsers(role: UserRole): boolean {
  return hasFullPlatformAccess(role);
}

export function canAccessRengoringAdmin(role: UserRole): boolean {
  return hasFullPlatformAccess(role) || role === "rengoringsleder";
}

export function isRengoringsassistent(role: UserRole): boolean {
  return role === "rengoringsassistent";
}

export function navEntryVisible(
  roles: UserRole[] | "all",
  userRole: UserRole,
): boolean {
  if (hasFullPlatformAccess(userRole)) return true;
  if (roles === "all") return true;
  return roles.includes(userRole);
}

export function canAccessAdminPortal(role: UserRole): boolean {
  return role !== "kursist";
}
