import type {
  CourseKommunikationState,
  EnrollmentBenchmark,
  MarketingEffectivenessGoals,
  MarketingEffort,
  MarketingEffortType,
  RegistrationAttributionQuestion,
} from "./kommunikation-types";
import { marketingEffortTypeLabels } from "./kommunikation-types";

const STATE_KEY = "brandbjerg-kommunikation-state";
const QUESTIONS_KEY = "brandbjerg-registration-attribution";
const GOALS_KEY = "brandbjerg-marketing-goals";
const ATTRIBUTION_KEY = "brandbjerg-marketing-attribution";
export const KOMMUNIKATION_UPDATED_EVENT = "brandbjerg-kommunikation-updated";

export const defaultMarketingGoals: MarketingEffectivenessGoals = {
  goodCostPerEnrollment: 2500,
  maxCostPerEnrollment: 5000,
  minEnrollmentsPerEffort: 1,
  followUpDays: 7,
};

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(KOMMUNIKATION_UPDATED_EVENT));
  }
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadAllStates(): Record<string, CourseKommunikationState> {
  if (typeof window === "undefined") return {};
  return (
    safeParse<Record<string, CourseKommunikationState>>(
      localStorage.getItem(STATE_KEY),
    ) ?? {}
  );
}

function saveAllStates(all: Record<string, CourseKommunikationState>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATE_KEY, JSON.stringify(all));
  emit();
}

export function loadKommunikationState(
  courseId: string,
): CourseKommunikationState | null {
  return loadAllStates()[courseId] ?? null;
}

export function saveKommunikationState(
  courseId: string,
  state: CourseKommunikationState,
): void {
  const all = loadAllStates();
  all[courseId] = state;
  saveAllStates(all);
}

export function updateBenchmarks(
  courseId: string,
  benchmarks: EnrollmentBenchmark[],
  fromHistory: boolean,
): CourseKommunikationState {
  const existing = loadKommunikationState(courseId) ?? emptyState();
  const next = {
    ...existing,
    benchmarks,
    benchmarksFromHistory: fromHistory,
  };
  saveKommunikationState(courseId, next);
  return next;
}

export function addMarketingEffort(
  courseId: string,
  effort: Omit<MarketingEffort, "id" | "createdAt" | "courseId">,
): { state: CourseKommunikationState; effort: MarketingEffort } {
  const existing = loadKommunikationState(courseId) ?? emptyState();
  const created: MarketingEffort = {
    ...effort,
    id: `mkt-${Date.now()}`,
    courseId,
    createdAt: new Date().toISOString(),
  };
  const next = {
    ...existing,
    efforts: [...existing.efforts, created],
  };
  saveKommunikationState(courseId, next);
  addRegistrationQuestionForEffort(courseId, created);
  return { state: next, effort: created };
}

function emptyState(): CourseKommunikationState {
  return { benchmarks: [], benchmarksFromHistory: false, efforts: [] };
}

function loadAllQuestions(): RegistrationAttributionQuestion[] {
  if (typeof window === "undefined") return [];
  return (
    safeParse<RegistrationAttributionQuestion[]>(
      localStorage.getItem(QUESTIONS_KEY),
    ) ?? []
  );
}

function saveAllQuestions(questions: RegistrationAttributionQuestion[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  emit();
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function registrationPromptForType(type: MarketingEffortType): string {
  if (type === "facebook") return "Facebook";
  if (type === "avis") return "avisannoncen";
  return "SoMe";
}

export function addRegistrationQuestionForEffort(
  courseId: string,
  effort: MarketingEffort,
): RegistrationAttributionQuestion {
  const label = marketingEffortTypeLabels[effort.type];
  const prompt = registrationPromptForType(effort.type);
  const question: RegistrationAttributionQuestion = {
    id: `raq-${effort.id}`,
    courseId,
    effortId: effort.id,
    questionText: `Har du set os i ${prompt} (${label}, ${formatShortDate(effort.startDate)}–${formatShortDate(effort.endDate)})?`,
    createdAt: new Date().toISOString(),
  };
  const all = loadAllQuestions().filter((q) => q.effortId !== effort.id);
  all.push(question);
  saveAllQuestions(all);
  return question;
}

export function loadRegistrationQuestionsForCourse(
  courseId: string,
): RegistrationAttributionQuestion[] {
  return loadAllQuestions().filter((q) => q.courseId === courseId);
}

export function loadAllRegistrationQuestions(): RegistrationAttributionQuestion[] {
  return loadAllQuestions();
}

export function loadAllMarketingEfforts(): MarketingEffort[] {
  const all = loadAllStates();
  return Object.values(all).flatMap((s) => s.efforts);
}

export function loadMarketingGoals(): MarketingEffectivenessGoals {
  if (typeof window === "undefined") return defaultMarketingGoals;
  return (
    safeParse<MarketingEffectivenessGoals>(localStorage.getItem(GOALS_KEY)) ??
    defaultMarketingGoals
  );
}

export function saveMarketingGoals(
  goals: MarketingEffectivenessGoals,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  emit();
}

export function loadAttributionCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};
  return (
    safeParse<Record<string, number>>(localStorage.getItem(ATTRIBUTION_KEY)) ??
    {}
  );
}

export function setAttributionCount(effortId: string, count: number): void {
  if (typeof window === "undefined") return;
  const all = loadAttributionCounts();
  all[effortId] = count;
  localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(all));
  emit();
}

export function getAttributionCountForEffort(effortId: string): number {
  return loadAttributionCounts()[effortId] ?? 0;
}

/** Demo-data til Liv i haven — kun hvis kurset endnu ingen indsatser har */
export function ensureDemoMarketingData(courseId: string): void {
  if (typeof window === "undefined") return;
  if (courseId !== "sa26-49") return;

  const existing = loadKommunikationState(courseId);
  if (existing && existing.efforts.length > 0) return;

  const avis: MarketingEffort = {
    id: "mkt-demo-avis",
    courseId,
    type: "avis",
    startDate: "2026-05-14",
    endDate: "2026-05-14",
    price: 5000,
    createdAt: new Date().toISOString(),
  };
  const facebook: MarketingEffort = {
    id: "mkt-demo-facebook",
    courseId,
    type: "facebook",
    startDate: "2026-07-24",
    endDate: "2026-08-01",
    price: 5000,
    createdAt: new Date().toISOString(),
  };

  saveKommunikationState(courseId, {
    benchmarks: existing?.benchmarks ?? [],
    benchmarksFromHistory: existing?.benchmarksFromHistory ?? false,
    efforts: [avis, facebook],
  });

  addRegistrationQuestionForEffort(courseId, avis);
  addRegistrationQuestionForEffort(courseId, facebook);

  const attribution = loadAttributionCounts();
  attribution[avis.id] = 1;
  attribution[facebook.id] = 0;
  localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
}

/** Demo markedsføring på afholdte HL-kurser — til historisk læringsanalyse */
export function ensureHistoricalMarketingDemoData(): void {
  if (typeof window === "undefined") return;

  seedHistoricalCourse("sa26-23", [
    {
      id: "mkt-hist-lyse-avis",
      type: "avis" as const,
      startDate: "2026-03-10",
      endDate: "2026-03-10",
      price: 4500,
    },
    {
      id: "mkt-hist-lyse-fb",
      type: "facebook" as const,
      startDate: "2026-05-15",
      endDate: "2026-05-22",
      price: 6000,
    },
  ], { "mkt-hist-lyse-avis": 3, "mkt-hist-lyse-fb": 0 });

  seedHistoricalCourse("sa26-5", [
    {
      id: "mkt-hist-skriv-avis",
      type: "avis" as const,
      startDate: "2025-11-20",
      endDate: "2025-11-20",
      price: 4000,
    },
    {
      id: "mkt-hist-skriv-some",
      type: "some" as const,
      startDate: "2026-01-08",
      endDate: "2026-01-15",
      price: 3500,
    },
  ], { "mkt-hist-skriv-avis": 2, "mkt-hist-skriv-some": 1 });
}

function seedHistoricalCourse(
  courseId: string,
  efforts: Array<{
    id: string;
    type: "facebook" | "some" | "avis";
    startDate: string;
    endDate: string;
    price: number;
  }>,
  attribution: Record<string, number>,
): void {
  const existing = loadKommunikationState(courseId);
  if (existing && existing.efforts.length > 0) return;

  const created = efforts.map((e) => ({
    id: e.id,
    courseId,
    type: e.type,
    startDate: e.startDate,
    endDate: e.endDate,
    price: e.price,
    createdAt: new Date().toISOString(),
  }));

  saveKommunikationState(courseId, {
    benchmarks: existing?.benchmarks ?? [],
    benchmarksFromHistory: existing?.benchmarksFromHistory ?? false,
    efforts: created,
  });

  for (const e of created) {
    addRegistrationQuestionForEffort(courseId, e);
  }

  const counts = loadAttributionCounts();
  for (const [id, count] of Object.entries(attribution)) {
    counts[id] = count;
  }
  localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(counts));
}
