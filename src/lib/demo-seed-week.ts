import { statusarkCourses, statusarkYear } from "./brandbjerg-statusark";
import { getCourseDetailById } from "./course-list";
import {
  loadCoursePlan,
  mergeCoursePlan,
  saveCoursePlan,
} from "./course-plan-storage";
import { defaultChecklist, defaultLokaleSpec, type CourseModule } from "./mock-data";
import { buildDaysFromTemplate } from "./module-plan-utils";
import { programUbak5Dage } from "./program-templates/liv-i-haven-5dage";
import { ensureParticipantsForCourse } from "./kontor-participants";
import { loadParticipantsForCourse } from "./kontor-storage";
import { canSendKitchenPlan } from "./kitchen-plan-rules";
import { buildKitchenPlanSummary } from "./kitchen-utils";
import { isKitchenPlanSent, sendKitchenPlan } from "./kitchen-storage";
import {
  addRegistrationQuestionForEffort,
  loadAttributionCounts,
  loadKommunikationState,
  saveKommunikationState,
} from "./kommunikation-storage";
import type { MarketingEffort } from "./kommunikation-types";
import {
  lokaleTargetKey,
  vaerelseTargetKey,
} from "./rengoring-delegation-utils";
import {
  loadRengoringTasks,
  publishAssignmentsForDate,
  upsertRengoringAssignment,
} from "./rengoring-task-storage";
import { syncAutoRengoringTasksForDate } from "./rengoring-auto-tasks";
import {
  createAnsatVaerelseBooking,
  loadAnsatVaerelseBookings,
} from "./ansat-vaerelse-booking-storage";
import { ensureDemoKursistEnrollment } from "./kursist-enrollments";

export const WEEK3_DEMO_COURSE_ID = "sa26-1";

const SEED_VERSION = "v1";

const DEMO_LOKALER = [
  "H1",
  "H2",
  "Fordragssalen",
  "Drama",
  "Kompas",
  "H3",
  "Pejsestuen",
  "Friluftliv",
];

const LISE_ID = "user-rga1";
const SOFIE_ID = "user-rga2";
const HL_ID = "user-hl";

interface DemoCourseCopy {
  websiteText: string;
  pedelPlan: string;
  pedelGenerelleNoter: string;
  kursetsHovedsigte: string;
}

const DEMO_COPY: Record<string, DemoCourseCopy> = {
  "sa26-1": {
    websiteText:
      "Personlig Power — et intensivt 5-dages forløb med fokus på selvværd, kommunikation og personlig styrke.",
    pedelPlan:
      "Demo lokaleplan: H1 og Fordragssalen bruges dagligt. Drama onsdag eftermiddag.",
    pedelGenerelleNoter:
      "Ekstra stole i H1 mandag. Flipover i Fordragssalen tirsdag. Pejsestuen kun onsdag aften.",
    kursetsHovedsigte:
      "Kurset giver deltagerne redskaber til personlig udvikling, kommunikation og livsmestring.",
  },
  "sa26-49": {
    websiteText:
      "Liv i haven — et 5-dages forløb med fokus på natur, nærvær og hverdagens små glæder i haven.",
    pedelPlan:
      "Demo lokaleplan: Friluftliv og H2 bruges dagligt. Fordragssalen onsdag formiddag.",
    pedelGenerelleNoter:
      "Havebord og stole til Friluftliv mandag. Ekstra flipover i H2 tirsdag.",
    kursetsHovedsigte:
      "Kurset giver deltagerne inspiration til at finde ro og glæde gennem havearbejde og natur.",
  },
  "sa26-50": {
    websiteText:
      "Et smil fra en jeg ikke kender — et 5-dages forløb om nærvær, fællesskab og livsglæde.",
    pedelPlan:
      "Demo lokaleplan: Pejsestuen og Kompas bruges dagligt. Drama torsdag eftermiddag.",
    pedelGenerelleNoter:
      "Hyggelig belysning i Pejsestuen mandag aften. Ekstra stole i Kompas onsdag.",
    kursetsHovedsigte:
      "Kurset giver deltagerne redskaber til at møde verden med åbenhed og varme.",
  },
};

function defaultDemoCopy(title: string): DemoCourseCopy {
  return {
    websiteText: `${title} — demo-kursus med fuldt program og deltagere.`,
    pedelPlan: "Demo lokaleplan: H1 og Fordragssalen bruges dagligt.",
    pedelGenerelleNoter: "Standard demo-noter til pedel.",
    kursetsHovedsigte: `Kurset giver deltagerne en meningsfuld oplevelse med fokus på ${title.toLowerCase()}.`,
  };
}

function seedKeyForCourse(courseId: string): string {
  return `brandbjerg-demo-seed-${courseId}-${SEED_VERSION}`;
}

/** ISO-uge (mandag = ugestart) */
export function getISOWeekInfo(date: Date = new Date()): { year: number; week: number } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return {
    year: target.getFullYear(),
    week: 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000),
  };
}

/** Kursus-id'er i en given ISO-uge (statusark-år) */
export function getCourseIdsForWeek(weekNumber: number): string[] {
  return statusarkCourses
    .filter(
      (c) =>
        c.courseWeekNumber === weekNumber &&
        c.startDate != null &&
        c.endDate != null,
    )
    .map((c) => c.id);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function enrichModuleLokale(mod: CourseModule, index: number): CourseModule {
  if (mod.erMaltid) return mod;

  const lokale = DEMO_LOKALER[index % DEMO_LOKALER.length];
  return {
    ...mod,
    lokaleSpecManuallySet: true,
    lokaleSpec: defaultLokaleSpec({
      lokale,
      antalPersoner: 25,
      bordopstilling: lokale.includes("sal") ? "Skoleborde" : "Grupper",
      flipoverWhiteboard: lokale.startsWith("H"),
      projektor: lokale === "Fordragssalen",
    }),
  };
}

function hasProgramContent(courseId: string): boolean {
  const stored = loadCoursePlan(courseId);
  return Boolean(
    stored?.days.some((day) => day.modules.some((mod) => !mod.erMaltid)),
  );
}

function ensureCourseProgram(courseId: string): void {
  const course = getCourseDetailById(courseId);
  if (!course?.startDate) return;
  if (hasProgramContent(courseId)) return;

  const copy = DEMO_COPY[courseId] ?? defaultDemoCopy(course.title);

  const days = buildDaysFromTemplate(programUbak5Dage, course.startDate).map(
    (day, dayIndex) => ({
      ...day,
      id: `${courseId}-d${dayIndex + 1}`,
      modules: day.modules.map((mod, modIndex) =>
        enrichModuleLokale(mod, dayIndex * 20 + modIndex),
      ),
    }),
  );

  saveCoursePlan(courseId, {
    days,
    modulePlanMode: "skabelon",
    moduleTemplateName: `${programUbak5Dage.sheetName} (${programUbak5Dage.sourceFile})`,
    programStatus: "faerdig",
    checklist: defaultChecklist({
      programPlanned: true,
      economyStatus: "approved",
      kmrImagesUploaded: true,
      kmrImageCount: 3,
      websiteTextDone: true,
      websiteText: copy.websiteText,
      pedelPlanSent: true,
      pedelPlan: copy.pedelPlan,
      welcomeLetterSent: true,
    }),
    courseLokaleSpec: defaultLokaleSpec({
      lokale: "H1",
      antalPersoner: 25,
      bordopstilling: "Grupper",
      flipoverWhiteboard: true,
    }),
    pedelGenerelleNoter: copy.pedelGenerelleNoter,
    kursetsHovedsigte: copy.kursetsHovedsigte,
  });
}

function ensureKitchenPlanSent(courseId: string): void {
  if (isKitchenPlanSent(courseId)) return;

  const course = getCourseDetailById(courseId);
  if (!course) return;

  const merged = mergeCoursePlan(course);
  if (!canSendKitchenPlan(merged)) return;

  sendKitchenPlan(merged);

  const plan = loadCoursePlan(courseId);
  if (plan) {
    saveCoursePlan(courseId, {
      ...plan,
      checklist: {
        ...(plan.checklist ?? defaultChecklist()),
        kitchenPlanSent: true,
        kitchenPlan: buildKitchenPlanSummary(merged),
      },
    });
  }
}

function ensureMarketingDemo(courseId: string): void {
  const existing = loadKommunikationState(courseId);
  if (existing && existing.efforts.length > 0) return;

  const efforts: MarketingEffort[] = [
    {
      id: `mkt-${courseId}-facebook`,
      courseId,
      type: "facebook",
      startDate: "2025-09-08",
      endDate: "2025-09-22",
      price: 6_000,
      createdAt: new Date().toISOString(),
    },
    {
      id: `mkt-${courseId}-avis`,
      courseId,
      type: "avis",
      startDate: "2025-10-15",
      endDate: "2025-10-15",
      price: 4_500,
      createdAt: new Date().toISOString(),
    },
    {
      id: `mkt-${courseId}-some`,
      courseId,
      type: "some",
      startDate: "2025-11-10",
      endDate: "2025-11-17",
      price: 3_500,
      createdAt: new Date().toISOString(),
    },
  ];

  saveKommunikationState(courseId, {
    benchmarks: existing?.benchmarks ?? [],
    benchmarksFromHistory: existing?.benchmarksFromHistory ?? false,
    efforts,
  });

  for (const effort of efforts) {
    addRegistrationQuestionForEffort(courseId, effort);
  }

  const attribution = loadAttributionCounts();
  attribution[efforts[0].id] = 15;
  attribution[efforts[1].id] = 6;
  attribution[efforts[2].id] = 4;
  localStorage.setItem(
    "brandbjerg-marketing-attribution",
    JSON.stringify(attribution),
  );
}

function hasDelegationInRange(startDate: string, endDate: string): boolean {
  return loadRengoringTasks().some(
    (t) =>
      t.date >= startDate &&
      t.date <= endDate &&
      t.assigneeUserId &&
      t.source !== "auto",
  );
}

function ensureDelegationDemo(startDate: string, endDate: string, courseId: string): void {
  if (hasDelegationInRange(startDate, endDate)) return;

  const participants = loadParticipantsForCourse(courseId);
  const occupiedRooms = [
    ...new Set(
      participants
        .map((p) => p.roomNumber)
        .filter((room): room is string => Boolean(room)),
    ),
  ].slice(0, 6);

  const day1 = startDate;
  const day2 = addDays(startDate, 1);
  const day3 = addDays(startDate, 2);

  const lokalerByDate: Array<{ date: string; lokaler: string[]; userId: string }> =
    [
      {
        date: day1,
        lokaler: ["H1", "H2", "Fordragssalen"],
        userId: LISE_ID,
      },
      {
        date: day2,
        lokaler: ["Drama", "Kompas"],
        userId: SOFIE_ID,
      },
      {
        date: day3,
        lokaler: ["H3", "Pejsestuen"],
        userId: LISE_ID,
      },
    ];

  for (const row of lokalerByDate) {
    if (row.date > endDate) continue;
    for (const lokale of row.lokaler) {
      upsertRengoringAssignment({
        date: row.date,
        type: "lokale",
        targetKey: lokaleTargetKey(lokale),
        label: lokale,
        assigneeUserId: row.userId,
      });
    }
  }

  occupiedRooms.forEach((room, index) => {
    const date = index % 2 === 0 ? day1 : day2;
    if (date > endDate) return;
    const userId = index % 2 === 0 ? LISE_ID : SOFIE_ID;
    upsertRengoringAssignment({
      date,
      type: "vaerelse",
      targetKey: vaerelseTargetKey(room),
      label: `Værelse ${room}`,
      assigneeUserId: userId,
    });
  });

  publishAssignmentsForDate(day1);
  if (day2 <= endDate) publishAssignmentsForDate(day2);
}

function ensureStaffBookingDemo(fromDate: string, toDate: string): void {
  const bookings = loadAnsatVaerelseBookings();
  const hasHlBooking = bookings.some(
    (b) =>
      b.userId === HL_ID &&
      b.fromDate <= toDate &&
      b.toDate >= fromDate,
  );
  if (hasHlBooking) return;

  createAnsatVaerelseBooking({
    userId: HL_ID,
    userName: "Henrik Larsen",
    userEmail: "hl@brandbjerg.dk",
    roomNumber: "205",
    fromDate,
    toDate,
    needsBedding: true,
  });
}

function ensureDepartureTasks(endDate: string): void {
  syncAutoRengoringTasksForDate(addDays(endDate, 1));
}

/** Seed demo-data for ét kursus — springer over hvis bruger allerede har redigeret */
function ensureDemoDataForCourse(courseId: string): void {
  const course = getCourseDetailById(courseId);
  if (!course?.startDate || !course.endDate) return;

  ensureCourseProgram(courseId);
  ensureParticipantsForCourse(courseId);
  ensureDemoKursistEnrollment(courseId);
  ensureKitchenPlanSent(courseId);
  ensureMarketingDemo(courseId);
  ensureStaffBookingDemo(course.startDate, course.endDate);
  ensureDelegationDemo(course.startDate, course.endDate, courseId);
  ensureDepartureTasks(course.endDate);

  localStorage.setItem(seedKeyForCourse(courseId), new Date().toISOString());
}

function ensureDemoDataForWeek(weekNumber: number): void {
  for (const courseId of getCourseIdsForWeek(weekNumber)) {
    ensureDemoDataForCourse(courseId);
  }
}

/**
 * Demo-data til uge 3 2026 (Personlig Power, sa26-1) så alle afdelinger
 * kan se hvordan funktionerne virker.
 */
export function ensureWeek3DemoData(): void {
  if (typeof window === "undefined") return;
  ensureDemoDataForWeek(3);
}

/**
 * Demo-data til kurser i den aktuelle ISO-uge (statusark 2026).
 */
export function ensureCurrentWeekDemoData(): void {
  if (typeof window === "undefined") return;

  const { year, week } = getISOWeekInfo();
  if (year !== statusarkYear) return;

  ensureDemoDataForWeek(week);
}

/** Seed både uge 3 og aktuel uge (uden duplikering) */
export function ensureAllDemoWeekData(): void {
  if (typeof window === "undefined") return;

  const seeded = new Set<string>();
  for (const week of [3, getISOWeekInfo().week]) {
    for (const courseId of getCourseIdsForWeek(week)) {
      if (seeded.has(courseId)) continue;
      seeded.add(courseId);
      ensureDemoDataForCourse(courseId);
    }
  }
}
