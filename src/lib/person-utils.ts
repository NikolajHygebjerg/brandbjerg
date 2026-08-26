import { getStaff, getStaffByInitials } from "./brandbjerg-staff";
import {
  findUserByEmail,
  getUserById,
  listCourseLeaderCandidates,
  listStaffUsers,
} from "./auth-storage";
import { LEADER_ID_BY_INITIALS } from "./auth-seed";
import { userRoleLabels } from "./auth-types";

export interface PersonRef {
  id: string;
  name: string;
  email: string;
  roleLabel?: string;
  detail?: string;
}

export function resolvePersonId(id: string): string {
  if (getUserById(id)) return id;

  const staff = getStaff(id);
  if (staff) {
    const user = findUserByEmail(staff.email);
    if (user) return user.id;
  }

  return id;
}

export function getPersonById(id: string): PersonRef | null {
  const resolvedId = resolvePersonId(id);
  const user = getUserById(resolvedId);
  if (user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleLabel: userRoleLabels[user.role],
    };
  }

  const staff = getStaff(id);
  if (staff) {
    return {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      detail: staff.subjects,
    };
  }

  return null;
}

export function defaultLeaderUserId(initials: string): string {
  const key = initials.trim().toUpperCase();
  if (LEADER_ID_BY_INITIALS[key]) return LEADER_ID_BY_INITIALS[key];

  const staff = getStaffByInitials(initials);
  if (staff) {
    const user = findUserByEmail(staff.email);
    if (user) return user.id;
  }

  return "user-ag";
}

export function leaderIdForInitials(initials: string): string {
  return defaultLeaderUserId(initials);
}

export {
  listCourseLeaderCandidates,
  listStaffUsers,
};
