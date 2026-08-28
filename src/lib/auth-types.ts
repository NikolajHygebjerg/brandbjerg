export type UserRole = "hojskolelaerer" | "tap" | "kontor" | "kursist";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export const userRoleLabels: Record<UserRole, string> = {
  hojskolelaerer: "Højskolelærer",
  tap: "TAP",
  kontor: "Kontor",
  kursist: "Kursist",
};

export const staffRoles: UserRole[] = ["hojskolelaerer", "tap", "kontor"];

export function isStaffRole(role: UserRole): boolean {
  return staffRoles.includes(role);
}

export function isBrandbjergEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@brandbjerg.dk");
}

export function canAccessStaffPages(role: UserRole): boolean {
  return isStaffRole(role);
}

export function canAccessKursistPages(role: UserRole): boolean {
  return role === "kursist";
}
