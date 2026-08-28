import type { UserRole } from "./auth-types";
import { listAllUsers } from "./auth-storage";
import type { User } from "./auth-types";

export interface Department {
  id: string;
  label: string;
  roles: UserRole[];
}

const STAFF_ROLES: UserRole[] = [
  "superadmin",
  "admin",
  "kursusleder",
  "hojskolelaerer",
  "koekkenleder",
  "koekkenassistent",
  "rengoringsleder",
  "rengoringsassistent",
  "pedelleder",
  "pedelassistent",
  "kontor",
];

export const DEPARTMENTS: Department[] = [
  {
    id: "alle-medarbejdere",
    label: "Alle medarbejdere",
    roles: STAFF_ROLES,
  },
  {
    id: "administration",
    label: "Administration",
    roles: ["admin", "superadmin"],
  },
  {
    id: "kursusleder",
    label: "Kursusledere",
    roles: ["kursusleder"],
  },
  {
    id: "kontor",
    label: "Kontor",
    roles: ["kontor"],
  },
  {
    id: "koekken",
    label: "Køkken",
    roles: ["koekkenleder", "koekkenassistent"],
  },
  {
    id: "rengoring",
    label: "Rengøring",
    roles: ["rengoringsleder", "rengoringsassistent"],
  },
  {
    id: "pedel",
    label: "Pedel",
    roles: ["pedelleder", "pedelassistent"],
  },
  {
    id: "hojskolelaerer",
    label: "Højskolelærer",
    roles: ["hojskolelaerer"],
  },
  {
    id: "kursist",
    label: "Kursister",
    roles: ["kursist"],
  },
];

export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

export function userBelongsToDepartment(role: UserRole, departmentId: string): boolean {
  const dept = getDepartmentById(departmentId);
  if (!dept) return false;
  return dept.roles.includes(role);
}

export function getDepartmentsForRole(role: UserRole): Department[] {
  return DEPARTMENTS.filter((d) => d.roles.includes(role));
}

export function getUsersInDepartment(departmentId: string): User[] {
  const dept = getDepartmentById(departmentId);
  if (!dept) return [];
  return listAllUsers().filter((u) => dept.roles.includes(u.role));
}

export function formatRecipientLabel(message: {
  recipientType: "user" | "department";
  recipientUserName?: string;
  recipientDepartmentName?: string;
}): string {
  if (message.recipientType === "user") {
    return message.recipientUserName ?? "Bruger";
  }
  return message.recipientDepartmentName ?? "Afdeling";
}
