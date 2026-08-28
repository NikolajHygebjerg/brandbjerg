import type { User, UserRole } from "./auth-types";
import {
  canAccessAdminPortal,
  isBrandbjergEmail,
  requiresBrandbjergEmail,
} from "./auth-types";
import { SEED_PASSWORD, SEED_USERS, normalizeStoredRole } from "./auth-seed";

const USERS_KEY = "brandbjerg-auth-users";
const SESSION_KEY = "brandbjerg-auth-session";
export const AUTH_UPDATED_EVENT = "brandbjerg-auth-updated";

interface StoredUserRecord {
  user: User;
  password: string;
}

function notifyAuthUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
  }
}

function loadUsers(): Record<string, StoredUserRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredUserRecord>;
    for (const record of Object.values(parsed)) {
      record.user.role = normalizeStoredRole(record.user.role as string);
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, StoredUserRecord>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  notifyAuthUpdated();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Opret/opdater foruddefinerede Brandbjerg-brugere */
export function ensureSeedUsers(): void {
  if (typeof window === "undefined") return;
  const users = loadUsers();
  let changed = false;

  for (const seed of SEED_USERS) {
    const email = normalizeEmail(seed.email);
    const existing = users[email];
    const user: User = {
      id: seed.id,
      email,
      name: seed.name,
      role: seed.role,
      createdAt: existing?.user.createdAt ?? new Date().toISOString(),
    };

    if (
      !existing ||
      existing.user.name !== user.name ||
      existing.user.role !== user.role ||
      existing.user.id !== user.id ||
      existing.password !== SEED_PASSWORD
    ) {
      users[email] = { user, password: SEED_PASSWORD };
      changed = true;
    }
  }

  if (changed) saveUsers(users);
}

export function listAllUsers(): User[] {
  ensureSeedUsers();
  return Object.values(loadUsers())
    .map((r) => r.user)
    .sort((a, b) => a.name.localeCompare(b.name, "da"));
}

export function listStaffUsers(): User[] {
  return listAllUsers().filter((u) => canAccessAdminPortal(u.role));
}

export function listCourseLeaderCandidates(): User[] {
  return listAllUsers().filter((u) => u.role === "kursusleder");
}

export function listUsersByRole(role: UserRole): User[] {
  return listAllUsers().filter((u) => u.role === role);
}

export function getUserById(userId: string): User | null {
  ensureSeedUsers();
  for (const record of Object.values(loadUsers())) {
    if (record.user.id === userId) return record.user;
  }
  return null;
}

export function findUserByEmail(email: string): User | null {
  ensureSeedUsers();
  return loadUsers()[normalizeEmail(email)]?.user ?? null;
}

export function validateRoleEmail(role: UserRole, email: string): string | null {
  if (requiresBrandbjergEmail(role) && !isBrandbjergEmail(email)) {
    return "Medarbejdere skal bruge en @brandbjerg.dk-mail.";
  }
  return null;
}

function createUserRecord(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  autoLogin?: boolean;
}): { ok: true; user: User } | { ok: false; error: string } {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const password = input.password;

  if (!email || !password || !name) {
    return { ok: false, error: "Udfyld navn, e-mail og adgangskode." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Adgangskoden skal være mindst 6 tegn." };
  }

  const roleError = validateRoleEmail(input.role, email);
  if (roleError) return { ok: false, error: roleError };

  const users = loadUsers();
  if (users[email]) {
    return { ok: false, error: "Der findes allerede en bruger med den e-mail." };
  }

  const user: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    email,
    name,
    role: input.role,
    phone: input.phone?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  users[email] = { user, password };
  saveUsers(users);

  if (input.autoLogin !== false) {
    setSessionUserId(user.id);
  }

  return { ok: true, user };
}

export function registerUser(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}): { ok: true; user: User } | { ok: false; error: string } {
  return createUserRecord({ ...input, autoLogin: true });
}

/** Opret bruger uden at logge ind — til admin-brugersiden */
export function adminCreateUser(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
}): { ok: true; user: User } | { ok: false; error: string } {
  return createUserRecord({ ...input, autoLogin: false });
}

export interface BatchCreateUserInput {
  rowNumber: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export interface BatchCreateUsersResult {
  created: number;
  skipped: number;
  errors: { rowNumber: number; email: string; message: string }[];
}

export function adminBatchCreateUsers(
  rows: BatchCreateUserInput[],
): BatchCreateUsersResult {
  const result: BatchCreateUsersResult = {
    created: 0,
    skipped: 0,
    errors: [],
  };

  for (const row of rows) {
    const existing = findUserByEmail(row.email);
    if (existing) {
      result.skipped += 1;
      result.errors.push({
        rowNumber: row.rowNumber,
        email: row.email,
        message: "E-mail findes allerede — række sprunget over.",
      });
      continue;
    }

    const created = createUserRecord({
      email: row.email,
      password: row.password,
      name: row.name,
      role: row.role,
      phone: row.phone,
      autoLogin: false,
    });

    if (!created.ok) {
      result.skipped += 1;
      result.errors.push({
        rowNumber: row.rowNumber,
        email: row.email,
        message: created.error,
      });
      continue;
    }

    result.created += 1;
  }

  return result;
}

export function loginUser(
  email: string,
  password: string,
): { ok: true; user: User } | { ok: false; error: string } {
  ensureSeedUsers();
  const normalized = normalizeEmail(email);
  const record = loadUsers()[normalized];
  if (!record || record.password !== password) {
    return { ok: false, error: "Forkert e-mail eller adgangskode." };
  }
  setSessionUserId(record.user.id);
  return { ok: true, user: record.user };
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  notifyAuthUpdated();
}

export function setSessionUserId(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, userId);
  notifyAuthUpdated();
}

export function getSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  ensureSeedUsers();
  const sessionId = getSessionUserId();
  if (!sessionId) return null;
  const users = loadUsers();
  for (const record of Object.values(users)) {
    if (record.user.id === sessionId) return record.user;
  }
  return null;
}

export function updateUser(
  userId: string,
  patch: {
    name?: string;
    email?: string;
    role?: UserRole;
    password?: string;
    phone?: string;
  },
): { ok: true; user: User } | { ok: false; error: string } {
  const users = loadUsers();
  let currentEmail: string | null = null;
  let record: StoredUserRecord | null = null;

  for (const [email, entry] of Object.entries(users)) {
    if (entry.user.id === userId) {
      currentEmail = email;
      record = entry;
      break;
    }
  }

  if (!record || !currentEmail) {
    return { ok: false, error: "Bruger ikke fundet." };
  }

  const nextEmail = patch.email ? normalizeEmail(patch.email) : currentEmail;
  const nextRole = patch.role ?? record.user.role;
  const nextName = patch.name?.trim() ?? record.user.name;
  const nextPhone =
    patch.phone !== undefined ? patch.phone.trim() || undefined : record.user.phone;

  if (!nextName) {
    return { ok: false, error: "Navn skal udfyldes." };
  }

  const roleError = validateRoleEmail(nextRole, nextEmail);
  if (roleError) return { ok: false, error: roleError };

  if (nextEmail !== currentEmail && users[nextEmail]) {
    return { ok: false, error: "E-mailen er allerede i brug." };
  }

  if (patch.password && patch.password.length < 6) {
    return { ok: false, error: "Adgangskoden skal være mindst 6 tegn." };
  }

  const updatedUser: User = {
    ...record.user,
    name: nextName,
    email: nextEmail,
    role: nextRole,
    phone: nextPhone,
  };

  const updatedRecord: StoredUserRecord = {
    user: updatedUser,
    password: patch.password ?? record.password,
  };

  delete users[currentEmail];
  users[nextEmail] = updatedRecord;
  saveUsers(users);
  return { ok: true, user: updatedUser };
}

export function adminDeleteUser(
  userId: string,
): { ok: true } | { ok: false; error: string } {
  const users = loadUsers();
  let emailToDelete: string | null = null;

  for (const [email, entry] of Object.entries(users)) {
    if (entry.user.id === userId) {
      emailToDelete = email;
      break;
    }
  }

  if (!emailToDelete) {
    return { ok: false, error: "Bruger ikke fundet." };
  }

  delete users[emailToDelete];
  saveUsers(users);

  const sessionId = getSessionUserId();
  if (sessionId === userId) {
    logoutUser();
  }

  return { ok: true };
}

export function deleteUser(userId: string): { ok: true } | { ok: false; error: string } {
  return adminDeleteUser(userId);
}

export { canAccessAdminPortal as canAccessStaffPages };
