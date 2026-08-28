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
const SEED_KEY = `brandbjerg-demo-seed-week3-${SEED_VERSION}`;

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

function ensureCourseProgram(): void {
  const course = getCourseDetailById(WEEK3_DEMO_COURSE_ID);
  if (!course?.startDate) return;
  if (hasProgramContent(WEEK3_DEMO_COURSE_ID)) return;

  const days = buildDaysFromTemplate(programUbak5Dage, course.startDate).map(
    (day, dayIndex) => ({
      ...day,
      id: `${WEEK3_DEMO_COURSE_ID}-d${dayIndex + 1}`,
      modules: day.modules.map((mod, modIndex) =>
        enrichModuleLokale(mod, dayIndex * 20 + modIndex),
      ),
    }),
  );

  saveCoursePlan(WEEK3_DEMO_COURSE_ID, {
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
      websiteText:
        "Personlig Power — et intensivt 5-dages forløb med fokus på selvværd, kommunikation og personlig styrke.",
      pedelPlanSent: true,
      pedelPlan: "Demo lokaleplan: H1 og Fordragssalen bruges dagligt. Drama onsdag eftermiddag.",
      welcomeLetterSent: true,
    }),
    courseLokaleSpec: defaultLokaleSpec({
      lokale: "H1",
      antalPersoner: 25,
      bordopstilling: "Grupper",
      flipoverWhiteboard: true,
    }),
    pedelGenerelleNoter:
      "Ekstra stole i H1 mandag. Flipover i Fordragssalen tirsdag. Pejsestuen kun onsdag aften.",
    kursetsHovedsigte:
      "Kurset giver deltagerne redskaber til personlig udvikling, kommunikation og livsmestring.",
  });
}

function ensureKitchenPlanSent(): void {
  if (isKitchenPlanSent(WEEK3_DEMO_COURSE_ID)) return;

  const course = getCourseDetailById(WEEK3_DEMO_COURSE_ID);
  if (!course) return;

  const merged = mergeCoursePlan(course);
  if (!canSendKitchenPlan(merged)) return;

  sendKitchenPlan(merged);

  const plan = loadCoursePlan(WEEK3_DEMO_COURSE_ID);
  if (plan) {
    saveCoursePlan(WEEK3_DEMO_COURSE_ID, {
      ...plan,
      checklist: {
        ...(plan.checklist ?? defaultChecklist()),
        kitchenPlanSent: true,
        kitchenPlan: buildKitchenPlanSummary(merged),
      },
    });
  }
}

function ensureMarketingDemo(): void {
  const existing = loadKommunikationState(WEEK3_DEMO_COURSE_ID);
  if (existing && existing.efforts.length > 0) return;

  const efforts: MarketingEffort[] = [
    {
      id: "mkt-w3-facebook",
      courseId: WEEK3_DEMO_COURSE_ID,
      type: "facebook",
      startDate: "2025-09-08",
      endDate: "2025-09-22",
      price: 6_000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "mkt-w3-avis",
      courseId: WEEK3_DEMO_COURSE_ID,
      type: "avis",
      startDate: "2025-10-15",
      endDate: "2025-10-15",
      price: 4_500,
      createdAt: new Date().toISOString(),
    },
    {
      id: "mkt-w3-some",
      courseId: WEEK3_DEMO_COURSE_ID,
      type: "some",
      startDate: "2025-11-10",
      endDate: "2025-11-17",
      price: 3_500,
      createdAt: new Date().toISOString(),
    },
  ];

  saveKommunikationState(WEEK3_DEMO_COURSE_ID, {
    benchmarks: existing?.benchmarks ?? [],
    benchmarksFromHistory: existing?.benchmarksFromHistory ?? false,
    efforts,
  });

  for (const effort of efforts) {
    addRegistrationQuestionForEffort(WEEK3_DEMO_COURSE_ID, effort);
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

function hasWeek3Delegation(): boolean {
  return loadRengoringTasks().some(
    (t) =>
      t.date >= "2026-01-12" &&
      t.date <= "2026-01-16" &&
      t.assigneeUserId &&
      t.source !== "auto",
  );
}

function ensureDelegationDemo(): void {
  if (hasWeek3Delegation()) return;

  const participants = loadParticipantsForCourse(WEEK3_DEMO_COURSE_ID);
  const occupiedRooms = [
    ...new Set(
      participants
        .map((p) => p.roomNumber)
        .filter((room): room is string => Boolean(room)),
    ),
  ].slice(0, 6);

  const lokalerByDate: Array<{ date: string; lokaler: string[]; userId: string }> =
    [
      {
        date: "2026-01-12",
        lokaler: ["H1", "H2", "Fordragssalen"],
        userId: LISE_ID,
      },
      {
        date: "2026-01-13",
        lokaler: ["Drama", "Kompas"],
        userId: SOFIE_ID,
      },
      {
        date: "2026-01-14",
        lokaler: ["H3", "Pejsestuen"],
        userId: LISE_ID,
      },
    ];

  for (const row of lokalerByDate) {
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
    const date = index % 2 === 0 ? "2026-01-12" : "2026-01-13";
    const userId = index % 2 === 0 ? LISE_ID : SOFIE_ID;
    upsertRengoringAssignment({
      date,
      type: "vaerelse",
      targetKey: vaerelseTargetKey(room),
      label: `Værelse ${room}`,
      assigneeUserId: userId,
    });
  });

  publishAssignmentsForDate("2026-01-12");
  publishAssignmentsForDate("2026-01-13");
}

function ensureStaffBookingDemo(): void {
  const bookings = loadAnsatVaerelseBookings();
  const hasHlBooking = bookings.some(
    (b) =>
      b.userId === HL_ID &&
      b.fromDate <= "2026-01-16" &&
      b.toDate >= "2026-01-12",
  );
  if (hasHlBooking) return;

  createAnsatVaerelseBooking({
    userId: HL_ID,
    userName: "Henrik Larsen",
    userEmail: "hl@brandbjerg.dk",
    roomNumber: "205",
    fromDate: "2026-01-12",
    toDate: "2026-01-16",
    needsBedding: true,
  });
}

function ensureDepartureTasks(): void {
  syncAutoRengoringTasksForDate("2026-01-17");
}

/**
 * Demo-data til uge 3 2026 (Personlig Power, sa26-1) så alle afdelinger
 * kan se hvordan funktionerne virker.
 */
export function ensureWeek3DemoData(): void {
  if (typeof window === "undefined") return;

  ensureCourseProgram();
  ensureParticipantsForCourse(WEEK3_DEMO_COURSE_ID);
  ensureDemoKursistEnrollment(WEEK3_DEMO_COURSE_ID);
  ensureKitchenPlanSent();
  ensureMarketingDemo();
  ensureStaffBookingDemo();
  ensureDelegationDemo();
  ensureDepartureTasks();

  localStorage.setItem(SEED_KEY, new Date().toISOString());
}
