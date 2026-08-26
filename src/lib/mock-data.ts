export type CourseStatus =
  | "udkast"
  | "godkendt"
  | "markedsfoeres"
  | "aaben"
  | "fuldt"
  | "afvikles"
  | "afsluttet";

export type PlanStatus = "udkast" | "afventer_godkendelse" | "godkendt";

export type Department =
  | "Planlægning"
  | "Kommunikation"
  | "Salg"
  | "Afvikling"
  | "Regnskab"
  | "Ledelse";

export type TeacherType = "intern" | "ekstern";

export interface Teacher {
  id: string;
  name: string;
  type: TeacherType;
}

/** Minutter fordelt på UBAK-kategorier (Program_UBAK) */
export interface ModuleTiming {
  ubak: number;
  ft: number;
  pts: number;
  bh: number;
}

export type ModuleLon = "A" | "B" | "";

export interface MealDetails {
  forplejning: string;
  specifikation: string;
  lokale: string;
  note: string;
  antalPersoner: number;
}

export type { HeldagsturPlan } from "./heldagstur-utils";
import { anyHeldagsturPunktUklar } from "./heldagstur-utils";
import type { HeldagsturPlan } from "./heldagstur-utils";

/** Lokalespecifikation — som i Pedel-arket (praktisk seddel) */
export interface LokaleSpecifikation {
  lokale: string;
  skalBrugesFlereDage: boolean;
  klarFraUgedag: string;
  klarFraKl: string;
  ledigFraUgedag: string;
  ledigFraKl: string;
  antalPersoner: number;
  bordopstilling: string;
  dug: boolean;
  levendeLys: boolean;
  blomster: boolean;
  storWhiteboard: boolean;
  flipoverWhiteboard: boolean;
  projektor: boolean;
  mobilLaerredProjektor: boolean;
  mobilLydanlaeg: boolean;
  noter: string;
}

export interface CourseModule {
  id: string;
  source: "skabelon" | "liste" | "manuel";
  underviser: string;
  underviserType: TeacherType;
  rolle: string;
  pris: number;
  overskrift: string;
  broedtekst: string;
  tidFra: string;
  tidTil: string;
  interneNoter: string;
  timing: ModuleTiming;
  lon: ModuleLon;
  erMaltid?: boolean;
  maltid?: MealDetails;
  erHeldagstur?: boolean;
  heldagstur?: HeldagsturPlan;
  lokaleSpec?: LokaleSpecifikation;
  /** Modul har egen lokalespec — ellers arves kursus-standard */
  lokaleSpecManuallySet?: boolean;
  klar: boolean;
}

export type EconomyChecklistStatus = "pending" | "sent" | "approved";

export interface CourseChecklist {
  programPlanned: boolean;
  economyStatus: EconomyChecklistStatus;
  kmrImagesUploaded: boolean;
  kmrImageCount: number;
  websiteText: string;
  websiteTextDone: boolean;
  kitchenPlan: string;
  kitchenPlanSent: boolean;
  pedelPlan: string;
  pedelPlanSent: boolean;
  welcomeLetterSent: boolean;
  welcomeLetterDraft: string;
}

export interface CourseDay {
  id: string;
  date: string;
  label: string;
  modules: CourseModule[];
}

export interface PlannedWeekCourse {
  id: string;
  title: string;
  targetStudents: number;
  weekNumber: number;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  price: number;
  capacity: number;
  enrolled: number;
  paid: number;
  status: CourseStatus;
  instructor: string;
  location: string;
  department: Department;
  weekNumber: number;
  courseLeaderId: string;
  hostIds: string[];
  budget: number;
  marketingBudget: number;
  planStatus: PlanStatus;
  days: CourseDay[];
  modulePlanMode?: "skabelon" | "bunden";
  moduleTemplateName?: string;
  checklist: CourseChecklist;
  /** Standard lokalespec for alle ikke-køkken-moduler i programmet */
  courseLokaleSpec?: LokaleSpecifikation;
  /** Generelle noter til pedel/rengøring for hele kurset */
  pedelGenerelleNoter?: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  name: string;
  email: string;
  status: "reserveret" | "betalt" | "venteliste" | "aflyst";
  registeredAt: string;
  amount: number;
}

export interface Campaign {
  id: string;
  title: string;
  courses: string[];
  channel: string;
  startDate: string;
  endDate: string;
  budget: number;
  leads: number;
  conversions: number;
  owner: string;
}

export interface Activity {
  id: string;
  courseId: string;
  department: Department;
  message: string;
  time: string;
}

export {
  teachers,
  brandbjergStaff,
  getStaff as getTeacher,
} from "./brandbjerg-staff";

export const moduleLibrary = [
  { id: "mod-lib-1", title: "Velkomst og introduktion", duration: 90 },
  { id: "mod-lib-2", title: "Fællesspisning", duration: 60 },
  { id: "mod-lib-3", title: "Workshop — praktisk øvelse", duration: 120 },
  { id: "mod-lib-4", title: "Refleksion i gruppe", duration: 45 },
  { id: "mod-lib-5", title: "Afslutning og evaluering", duration: 30 },
];

export const annualTargetDefault = 750;

// Legacy dummy plan removed — use brandbjerg-arshjul.ts
export const initialWeekPlan: PlannedWeekCourse[] = [];

export function emptyTiming(): ModuleTiming {
  return { ubak: 0, ft: 0, pts: 0, bh: 0 };
}

export function defaultMealDetails(
  overrides?: Partial<MealDetails>,
): MealDetails {
  return {
    forplejning: "Morgenmad",
    specifikation: "Almindelig",
    lokale: "L. spisesal",
    note: "",
    antalPersoner: 0,
    ...overrides,
  };
}

export function defaultLokaleSpec(
  overrides?: Partial<LokaleSpecifikation>,
): LokaleSpecifikation {
  return {
    lokale: "",
    skalBrugesFlereDage: false,
    klarFraUgedag: "",
    klarFraKl: "",
    ledigFraUgedag: "",
    ledigFraKl: "",
    antalPersoner: 0,
    bordopstilling: "Normal",
    dug: false,
    levendeLys: false,
    blomster: false,
    storWhiteboard: false,
    flipoverWhiteboard: false,
    projektor: false,
    mobilLaerredProjektor: false,
    mobilLydanlaeg: false,
    noter: "",
    ...overrides,
  };
}

function sampleModules(
  dayLabel: string,
  opts?: { firstReady?: boolean; secondReady?: boolean },
): CourseModule[] {
  const firstReady = opts?.firstReady ?? true;
  const secondReady = opts?.secondReady ?? false;
  return [
    {
      id: `${dayLabel}-m1`,
      source: "skabelon",
      underviser: "Lise Møller",
      underviserType: "intern",
      rolle: "Kursusleder",
      pris: 0,
      overskrift: "Velkomst og introduktion",
      broedtekst: "Vi starter med en fælles introduktion til kursets tema.",
      tidFra: "09:00",
      tidTil: "10:30",
      interneNoter: "Husk flipover og kaffe",
      timing: { ubak: 45, ft: 15, pts: 0, bh: 0 },
      lon: "A",
      lokaleSpec: defaultLokaleSpec({
        lokale: "H1",
        antalPersoner: 16,
        flipoverWhiteboard: true,
      }),
      klar: firstReady,
    },
    {
      id: `${dayLabel}-m2`,
      source: "liste",
      underviser: "Ken Hartmann",
      underviserType: "ekstern",
      rolle: "Foredragsholder",
      pris: 150,
      overskrift: "Gæsteforedrag — akvarelt teknik",
      broedtekst: "Deltagerne arbejder hands-on med teknikker og materialer.",
      tidFra: "10:45",
      tidTil: "12:30",
      interneNoter: "Ken bookes via sekretariat",
      timing: { ubak: 30, ft: 60, pts: 0, bh: 0 },
      lon: "B",
      lokaleSpec: defaultLokaleSpec({ lokale: "Atelier", projektor: true }),
      klar: secondReady,
    },
  ];
}

export function defaultChecklist(overrides?: Partial<CourseChecklist>): CourseChecklist {
  return {
    programPlanned: false,
    economyStatus: "pending",
    kmrImagesUploaded: false,
    kmrImageCount: 0,
    websiteText: "",
    websiteTextDone: false,
    kitchenPlan: "",
    kitchenPlanSent: false,
    pedelPlan: "",
    pedelPlanSent: false,
    welcomeLetterSent: false,
    welcomeLetterDraft:
      "Kære kursist\n\nVelkommen til kurset! Vi glæder os til at se dig.\n\nMed venlig hilsen\nKursuslederen",
    ...overrides,
  };
}

export function isHeldagsturModule(mod: CourseModule): boolean {
  return Boolean(
    mod.erHeldagstur ||
      mod.overskrift.trim().toLowerCase() === "heldagstur",
  );
}

export function isModuleFilled(mod: CourseModule) {
  if (isHeldagsturModule(mod)) {
    const punkter = mod.heldagstur?.punkter ?? [];
    if (punkter.length === 0) return false;
    return punkter.every((p) => {
      if (p.type === "bus") return true;
      if (p.type === "besoeg") return Boolean(p.besoeg?.overskrift.trim());
      if (p.type === "maltid") return Boolean(p.maltid?.forplejning);
      return false;
    });
  }
  return Boolean(
    mod.overskrift.trim() && mod.underviser.trim() && mod.tidFra && mod.tidTil,
  );
}

export function getAllModules(course: Course) {
  return course.days.flatMap((day) =>
    day.modules.map((mod) => ({ ...mod, dayLabel: day.label, dayId: day.id })),
  );
}

export function getUnreadyModules(course: Course) {
  const unready: ReturnType<typeof getAllModules> = [];
  for (const mod of getAllModules(course)) {
    if (isHeldagsturModule(mod)) {
      const punkter = mod.heldagstur?.punkter ?? [];
      if (punkter.length === 0 || anyHeldagsturPunktUklar(punkter)) {
        unready.push(mod);
      }
    } else if (!mod.klar) {
      unready.push(mod);
    }
  }
  return unready;
}

export function getIncompleteModules(course: Course) {
  return getAllModules(course).filter((m) => !isModuleFilled(m));
}

export const statusLabels: Record<CourseStatus, string> = {
  udkast: "Udkast",
  godkendt: "Godkendt",
  markedsfoeres: "Markedsføres",
  aaben: "Åben tilmelding",
  fuldt: "Fuldt booket",
  afvikles: "Afvikles",
  afsluttet: "Afsluttet",
};

export const planStatusLabels: Record<PlanStatus, string> = {
  udkast: "Udkast",
  afventer_godkendelse: "Afventer godkendelse",
  godkendt: "Godkendt — statusark aktivt",
};

export const statusColors: Record<CourseStatus, string> = {
  udkast: "bg-slate-100 text-slate-700",
  godkendt: "bg-blue-100 text-blue-800",
  markedsfoeres: "bg-purple-100 text-purple-800",
  aaben: "bg-emerald-100 text-emerald-800",
  fuldt: "bg-amber-100 text-amber-800",
  afvikles: "bg-orange-100 text-orange-800",
  afsluttet: "bg-gray-100 text-gray-600",
};

export const courses: Course[] = [
  {
    id: "kur-001",
    title: "Akvarelmaleri for begyndere",
    category: "Kreativt",
    startDate: "2026-03-14",
    endDate: "2026-03-15",
    price: 1_450,
    capacity: 16,
    enrolled: 14,
    paid: 12,
    status: "aaben",
    instructor: "Lise Møller",
    location: "Atelier Øst",
    department: "Planlægning",
    weekNumber: 11,
    courseLeaderId: "bb-ml",
    hostIds: ["bb-ncb"],
    budget: 28_000,
    marketingBudget: 4_500,
    planStatus: "godkendt",
    moduleTemplateName: "weekendkursus-2dage.csv",
    days: [
      {
        id: "d1",
        date: "2026-03-14",
        label: "Dag 1",
        modules: sampleModules("d1", { firstReady: true, secondReady: false }),
      },
      {
        id: "d2",
        date: "2026-03-15",
        label: "Dag 2",
        modules: sampleModules("d2", { firstReady: true, secondReady: true }),
      },
    ],
    checklist: defaultChecklist({
      websiteText:
        "Et inspirerende weekendkursus i akvarelmaleri for begyndere og let øvede. Vi arbejder med farver, komposition og teknik i et trygt og kreativt miljø.",
      websiteTextDone: true,
      economyStatus: "sent",
      kmrImagesUploaded: true,
      kmrImageCount: 3,
    }),
  },
  {
    id: "kur-002",
    title: "Nordisk mad & fermentering",
    category: "Mad",
    startDate: "2026-04-10",
    endDate: "2026-04-12",
    price: 2_950,
    capacity: 12,
    enrolled: 12,
    paid: 11,
    status: "fuldt",
    instructor: "Thomas Berg",
    location: "Køkkenlaboratoriet",
    department: "Planlægning",
    weekNumber: 15,
    courseLeaderId: "bb-kkn",
    hostIds: ["bb-jm"],
    budget: 45_000,
    marketingBudget: 6_000,
    planStatus: "godkendt",
    moduleTemplateName: "madkursus-3dage.csv",
    days: [
      { id: "d1", date: "2026-04-10", label: "Dag 1", modules: sampleModules("k2d1") },
      { id: "d2", date: "2026-04-11", label: "Dag 2", modules: [] },
      { id: "d3", date: "2026-04-12", label: "Dag 3", modules: [] },
    ],
    checklist: defaultChecklist({ economyStatus: "approved", kitchenPlanSent: true }),
  },
  {
    id: "kur-003",
    title: "Stille retreat – mindfulness",
    category: "Wellness",
    startDate: "2026-05-02",
    endDate: "2026-05-04",
    price: 3_200,
    capacity: 20,
    enrolled: 6,
    paid: 4,
    status: "markedsfoeres",
    instructor: "Anna Krogh",
    location: "Skovhytten",
    department: "Kommunikation",
    weekNumber: 18,
    courseLeaderId: "bb-nn",
    hostIds: [],
    budget: 38_000,
    marketingBudget: 8_000,
    planStatus: "godkendt",
    days: [
      { id: "d1", date: "2026-05-02", label: "Dag 1", modules: [] },
      { id: "d2", date: "2026-05-03", label: "Dag 2", modules: [] },
      { id: "d3", date: "2026-05-04", label: "Dag 3", modules: [] },
    ],
    checklist: defaultChecklist(),
  },
  {
    id: "kur-004",
    title: "Digital fortælling & podcast",
    category: "Medier",
    startDate: "2026-06-06",
    endDate: "2026-06-07",
    price: 1_750,
    capacity: 18,
    enrolled: 3,
    paid: 1,
    status: "godkendt",
    instructor: "Mikkel Sørensen",
    location: "Medieværksted",
    department: "Planlægning",
    weekNumber: 23,
    courseLeaderId: "bb-nd",
    hostIds: ["bb-cbm"],
    budget: 22_000,
    marketingBudget: 3_500,
    planStatus: "afventer_godkendelse",
    days: [
      { id: "d1", date: "2026-06-06", label: "Dag 1", modules: [] },
      { id: "d2", date: "2026-06-07", label: "Dag 2", modules: [] },
    ],
    checklist: defaultChecklist(),
  },
  {
    id: "kur-005",
    title: "Sommerkursus: Keramik",
    category: "Kreativt",
    startDate: "2026-07-13",
    endDate: "2026-07-17",
    price: 4_500,
    capacity: 14,
    enrolled: 0,
    paid: 0,
    status: "udkast",
    instructor: "Sofie Lind",
    location: "Keramikværksted",
    department: "Planlægning",
    weekNumber: 28,
    courseLeaderId: "bb-cj",
    hostIds: [],
    budget: 52_000,
    marketingBudget: 5_000,
    planStatus: "udkast",
    days: [],
    checklist: defaultChecklist(),
  },
  {
    id: "kur-006",
    title: "Vinterlæseklub & litteratur",
    category: "Kultur",
    startDate: "2026-01-24",
    endDate: "2026-01-25",
    price: 950,
    capacity: 24,
    enrolled: 22,
    paid: 22,
    status: "afsluttet",
    instructor: "Helle Vang",
    location: "Biblioteket",
    department: "Afvikling",
    weekNumber: 4,
    courseLeaderId: "bb-jm",
    hostIds: [],
    budget: 15_000,
    marketingBudget: 2_000,
    planStatus: "godkendt",
    days: [
      { id: "d1", date: "2026-01-24", label: "Dag 1", modules: sampleModules("k6d1") },
      { id: "d2", date: "2026-01-25", label: "Dag 2", modules: sampleModules("k6d2") },
    ],
    checklist: defaultChecklist({
      programPlanned: true,
      economyStatus: "approved",
      kmrImagesUploaded: true,
      kmrImageCount: 5,
      websiteTextDone: true,
      kitchenPlanSent: true,
      pedelPlanSent: true,
      welcomeLetterSent: true,
    }),
  },
];

export const enrollments: Enrollment[] = [
  { id: "til-101", courseId: "kur-001", name: "Mette Hansen", email: "mette@example.dk", status: "betalt", registeredAt: "2026-02-10", amount: 1_450 },
  { id: "til-102", courseId: "kur-001", name: "Jens Pedersen", email: "jens@example.dk", status: "betalt", registeredAt: "2026-02-11", amount: 1_450 },
  { id: "til-103", courseId: "kur-001", name: "Camilla Olsen", email: "camilla@example.dk", status: "reserveret", registeredAt: "2026-02-18", amount: 1_450 },
  { id: "til-104", courseId: "kur-002", name: "Peter Nielsen", email: "peter@example.dk", status: "venteliste", registeredAt: "2026-02-20", amount: 2_950 },
  { id: "til-105", courseId: "kur-003", name: "Louise Frandsen", email: "louise@example.dk", status: "betalt", registeredAt: "2026-02-15", amount: 3_200 },
];

export const campaigns: Campaign[] = [
  { id: "kam-01", title: "Forårskampagne – kreative kurser", courses: ["kur-001", "kur-005"], channel: "Nyhedsbrev + SoMe", startDate: "2026-02-01", endDate: "2026-03-01", budget: 8_000, leads: 340, conversions: 28, owner: "Kommunikation" },
  { id: "kam-02", title: "Mad & wellness push", courses: ["kur-002", "kur-003"], channel: "Facebook + lokale aviser", startDate: "2026-03-15", endDate: "2026-04-15", budget: 12_500, leads: 210, conversions: 15, owner: "Kommunikation" },
];

export const activities: Activity[] = [
  { id: "act-1", courseId: "kur-001", department: "Salg", message: "Ny tilmelding: Mette Hansen (betalt)", time: "I dag 09:14" },
  { id: "act-2", courseId: "kur-001", department: "Kommunikation", message: "SoMe-post planlagt til torsdag", time: "I dag 08:30" },
  { id: "act-3", courseId: "kur-002", department: "Salg", message: "Kurset er nu fuldt – venteliste aktiveret", time: "I går 16:45" },
  { id: "act-4", courseId: "kur-003", department: "Regnskab", message: "Bogføringskladde klar til KOMiT-import", time: "I går 11:20" },
  { id: "act-5", courseId: "kur-001", department: "Afvikling", message: "Lokalebookning bekræftet: Atelier Øst", time: "20. feb 14:00" },
];

export function getCourse(id: string) {
  return courses.find((c) => c.id === id);
}

export function weekLabel(weekNumber: number) {
  return `Uge ${weekNumber}`;
}

export function sumPlannedStudents(items: PlannedWeekCourse[]) {
  return items.reduce((sum, c) => sum + c.targetStudents, 0);
}

export function createEmptyModule(): CourseModule {
  return {
    id: `mod-${Date.now()}`,
    source: "manuel",
    underviser: "",
    underviserType: "intern",
    rolle: "",
    pris: 0,
    overskrift: "",
    broedtekst: "",
    tidFra: "09:00",
    tidTil: "10:00",
    interneNoter: "",
    timing: emptyTiming(),
    lon: "",
    lokaleSpec: defaultLokaleSpec(),
    klar: false,
  };
}

export function moduleDurationMinutes(mod: CourseModule) {
  const [fh, fm] = mod.tidFra.split(":").map(Number);
  const [th, tm] = mod.tidTil.split(":").map(Number);
  return th * 60 + tm - (fh * 60 + fm);
}

export function timingTotal(mod: CourseModule) {
  return mod.timing.ubak + mod.timing.ft + mod.timing.pts + mod.timing.bh;
}

export function formatDKK(amount: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
