import type { UserRole } from "./auth-types";

export const SEED_PASSWORD = "Brandbjerg1234";

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Forudoprettede Brandbjerg-brugere til demo */
export const SEED_USERS: SeedUser[] = [
  {
    id: "user-admin",
    name: "Platform Admin",
    email: "admin@brandbjerg.dk",
    role: "admin",
  },
  {
    id: "user-nh",
    name: "Nikolaj Hygebjerg",
    email: "nh@brandbjerg.dk",
    role: "superadmin",
  },
  {
    id: "user-kalc",
    name: "Kristian-Alberto Lykke Cobos",
    email: "kalc@brandbjerg.dk",
    role: "kursusleder",
  },
  {
    id: "user-ml",
    name: "Maria Lya Leerbeck",
    email: "ml@brandbjerg.dk",
    role: "kursusleder",
  },
  {
    id: "user-czj",
    name: "Charlotte Zeberg",
    email: "czj@brandbjerg.dk",
    role: "kursusleder",
  },
  {
    id: "user-ag",
    name: "Annette Grønhøj",
    email: "ag@brandbjerg.dk",
    role: "kursusleder",
  },
  {
    id: "user-tj",
    name: "Tine Johansen",
    email: "tj@brandbjerg.dk",
    role: "kontor",
  },
  {
    id: "user-jw",
    name: "Jesper Winther",
    email: "jw@brandbjerg.dk",
    role: "kontor",
  },
  {
    id: "user-hl",
    name: "Henrik Larsen",
    email: "hl@brandbjerg.dk",
    role: "hojskolelaerer",
  },
  {
    id: "user-hlu",
    name: "Hanne Lund",
    email: "hlu@brandbjerg.dk",
    role: "rengoringsleder",
  },
  {
    id: "user-rga1",
    name: "Lise Pedersen",
    email: "lise@brandbjerg.dk",
    role: "rengoringsassistent",
  },
  {
    id: "user-rga2",
    name: "Sofie Nielsen",
    email: "sofie@brandbjerg.dk",
    role: "rengoringsassistent",
  },
  {
    id: "user-kursist-demo",
    name: "Mette Hansen",
    email: "deltager0@example.dk",
    role: "kursist",
  },
];

/** Initialer → seed-bruger (kursusleder fra statusark) */
export const LEADER_ID_BY_INITIALS: Record<string, string> = {
  NH: "user-nh",
  KALC: "user-kalc",
  ML: "user-ml",
  MLL: "user-ml",
  CZ: "user-czj",
  CZJ: "user-czj",
  AG: "user-ag",
};

/** Migrér gamle roller fra tidligere versioner */
const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  tap: "kontor",
};

export function normalizeStoredRole(role: string): UserRole {
  if (role in LEGACY_ROLE_MAP) {
    return LEGACY_ROLE_MAP[role];
  }
  return role as UserRole;
}
