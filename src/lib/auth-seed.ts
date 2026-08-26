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
    id: "user-nh",
    name: "Nikolaj Hygebjerg",
    email: "nh@brandbjerg.dk",
    role: "hojskolelaerer",
  },
  {
    id: "user-kalc",
    name: "Kristian-Alberto Lykke Cobos",
    email: "kalc@brandbjerg.dk",
    role: "hojskolelaerer",
  },
  {
    id: "user-ml",
    name: "Maria Lya Leerbeck",
    email: "ml@brandbjerg.dk",
    role: "hojskolelaerer",
  },
  {
    id: "user-czj",
    name: "Charlotte Zeberg",
    email: "czj@brandbjerg.dk",
    role: "hojskolelaerer",
  },
  {
    id: "user-ag",
    name: "Annette Grønhøj",
    email: "ag@brandbjerg.dk",
    role: "hojskolelaerer",
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
