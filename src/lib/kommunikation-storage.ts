import type {
  CourseKommunikationState,
  EnrollmentBenchmark,
  MarketingEffort,
  MarketingEffortType,
  RegistrationAttributionQuestion,
} from "./kommunikation-types";
import { marketingEffortTypeLabels } from "./kommunikation-types";

const STATE_KEY = "brandbjerg-kommunikation-state";
const QUESTIONS_KEY = "brandbjerg-registration-attribution";
export const KOMMUNIKATION_UPDATED_EVENT = "brandbjerg-kommunikation-updated";

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
