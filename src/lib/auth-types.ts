export type UserRole =
  | "admin"
  | "kursusleder"
  | "hojskolelaerer"
  | "kursist"
  | "koekkenleder"
  | "koekkenassistent"
  | "rengoringsleder"
  | "rengoringsassistent"
  | "pedelleder"
  | "pedelassistent"
  | "kontor";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export const userRoleLabels: Record<UserRole, string> = {
  admin: "Admin",
  kursusleder: "Kursusleder",
  hojskolelaerer: "Højskolelærer",
  kursist: "Kursist",
  koekkenleder: "Køkkenleder",
  koekkenassistent: "Køkkenassistent",
  rengoringsleder: "Rengøringsleder",
  rengoringsassistent: "Rengøringsassistent",
  pedelleder: "Pedelleder",
  pedelassistent: "Pedelassistent",
  kontor: "Kontor",
};

export const ALL_USER_ROLES = Object.keys(userRoleLabels) as UserRole[];

export function isBrandbjergEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@brandbjerg.dk");
}

export function requiresBrandbjergEmail(role: UserRole): boolean {
  return role !== "kursist";
}

export function canAccessKursistPages(role: UserRole): boolean {
  return role === "kursist";
}

export function canAccessAdminPortal(role: UserRole): boolean {
  return role !== "kursist";
}

/** @deprecated use canAccessAdminPortal */
export function isStaffRole(role: UserRole): boolean {
  return canAccessAdminPortal(role);
}

/** @deprecated use canAccessAdminPortal */
export function canAccessStaffPages(role: UserRole): boolean {
  return canAccessAdminPortal(role);
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin";
}
