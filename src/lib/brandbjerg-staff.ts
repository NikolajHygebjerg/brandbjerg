import type { Teacher } from "./mock-data";

/** Medarbejdere fra https://brandbjerg.dk/medarbejdere (feb. 2026) */
export interface BrandbjergStaff extends Teacher {
  initials: string;
  email: string;
  subjects: string;
  group: "kort_kursus" | "hojskolelaerer" | "both";
}

export const brandbjergStaff: BrandbjergStaff[] = [
  // Højskolelærere — korte kurser (kursusledere)
  {
    id: "bb-ag",
    name: "Annette Grønhøj",
    initials: "AG",
    email: "ag@brandbjerg.dk",
    subjects: "Kursusleder, Konferenceansvarlig",
    type: "intern",
    group: "kort_kursus",
  },
  {
    id: "bb-cz",
    name: "Charlotte Zeberg",
    initials: "CZ",
    email: "czj@brandbjerg.dk",
    subjects: "Kursusleder",
    type: "intern",
    group: "kort_kursus",
  },
  {
    id: "bb-kalc",
    name: "Kristian-Alberto Lykke Cobos",
    initials: "KALC",
    email: "kalc@brandbjerg.dk",
    subjects: "Filosofi, politik og samfund · kursusleder korte kurser",
    type: "intern",
    group: "both",
  },
  {
    id: "bb-ml",
    name: "Maria Lya Leerbeck",
    initials: "MLL",
    email: "ml@brandbjerg.dk",
    subjects: "Kursusleder",
    type: "intern",
    group: "kort_kursus",
  },
  {
    id: "bb-nh",
    name: "Nikolaj Hygebjerg",
    initials: "NH",
    email: "nh@brandbjerg.dk",
    subjects: "Korte kurser, Politik og Samfund",
    type: "intern",
    group: "kort_kursus",
  },
  // Højskolelærere
  {
    id: "bb-bl",
    name: "Brian Lauersen",
    initials: "BL",
    email: "bl@brandbjerg.dk",
    subjects: "Viceforstander, Boldspil, Vandring, Multisport",
    type: "intern",
    group: "hojskolelaerer",
  },
  {
    id: "bb-cj",
    name: "Carsten Jørgensen",
    initials: "CJ",
    email: "cj@brandbjerg.dk",
    subjects: "Keramik, Kunst og Håndværk",
    type: "intern",
    group: "hojskolelaerer",
  },
  {
    id: "bb-cbm",
    name: "Casper Borch Madsen",
    initials: "CBM",
    email: "cbm@brandbjerg.dk",
    subjects: "Ski & Idræt, Friluftsliv, Havkajak",
    type: "intern",
    group: "hojskolelaerer",
  },
  {
    id: "bb-gm",
    name: "Gro Mygind",
    initials: "GM",
    email: "gm@brandbjerg.dk",
    subjects: "Festival & Projektledelse, Teater, Eventdesign",
    type: "intern",
    group: "hojskolelaerer",
  },
  {
    id: "bb-ja",
    name: "Jacob Andersen",
    initials: "JA",
    email: "ja@brandbjerg.dk",
    subjects: "Mindful, Personlig Udvikling, Friluftsliv",
    type: "intern",
    group: "hojskolelaerer",
  },
  {
    id: "bb-jm",
    name: "Johanne Mellergaard",
    initials: "JM",
    email: "jm@brandbjerg.dk",
    subjects: "Linoleumstryk, Tekstildesign & Upcycling",
    type: "intern",
    group: "hojskolelaerer",
  },
  {
    id: "bb-kft",
    name: "Kristoffer Fynbo Thorning",
    initials: "KFT",
    email: "kft@brandbjerg.dk",
    subjects: "Musik, Dans",
    type: "intern",
    group: "hojskolelaerer",
  },
  {
    id: "bb-kkn",
    name: "Kristoffer Korshøj Nielsen",
    initials: "KKN",
    email: "kkn@brandbjerg.dk",
    subjects: "Havebrug, Biavl, Life Skills, Svampedyrkning",
    type: "intern",
    group: "hojskolelaerer",
  },
  {
    id: "bb-lrs",
    name: "Lasse Riis Svendsen",
    initials: "LRS",
    email: "lrs@brandbjerg.dk",
    subjects: "Højskolelærer praktikant",
    type: "intern",
    group: "hojskolelaerer",
  },
  {
    id: "bb-ncb",
    name: "Nana Cecilie Bøvling",
    initials: "NCB",
    email: "ncb@brandbjerg.dk",
    subjects: "Musik & Dans",
    type: "intern",
    group: "hojskolelaerer",
  },
  {
    id: "bb-nd",
    name: "Niklas Dahl-Nielsen",
    initials: "ND",
    email: "nd@brandbjerg.dk",
    subjects: "Friluftsliv, Bouldering, Havkajak",
    type: "intern",
    group: "hojskolelaerer",
  },
  {
    id: "bb-nn",
    name: "Nina Neckelmann",
    initials: "NN",
    email: "nn@brandbjerg.dk",
    subjects: "Personlig Udvikling, Studievejledning",
    type: "intern",
    group: "hojskolelaerer",
  },
];

/** Til dropdowns — samme som brandbjergStaff */
export const teachers: Teacher[] = brandbjergStaff;

export const kortKursusLedere = brandbjergStaff.filter(
  (s) => s.group === "kort_kursus" || s.group === "both",
);

export const hojskolelaerere = brandbjergStaff.filter(
  (s) => s.group === "hojskolelaerer" || s.group === "both",
);

const byInitials = new Map(
  brandbjergStaff.map((s) => [s.initials.toUpperCase(), s.id]),
);

export function staffIdFromInitials(initials: string): string | undefined {
  return byInitials.get(initials.trim().toUpperCase());
}

export function getStaff(id: string): BrandbjergStaff | undefined {
  return brandbjergStaff.find((s) => s.id === id);
}

export function getStaffByInitials(initials: string): BrandbjergStaff | undefined {
  const id = staffIdFromInitials(initials);
  return id ? getStaff(id) : undefined;
}

export function defaultLeaderForInitials(initials: string): string {
  return staffIdFromInitials(initials) ?? "bb-ag";
}
