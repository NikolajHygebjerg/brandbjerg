import { getCourseDetailById } from "./course-list";
import {
  createDefaultSurveyQuestions,
  DEFAULT_SURVEY_INTRODUCTION,
} from "./kursusleder-survey-default";
import type {
  CourseSurveyConfig,
  SurveyQuestion,
  SurveyResponseRecord,
} from "./kursusleder-survey-types";

const CONFIG_KEY = "brandbjerg-kursusleder-survey-configs";
const RESPONSES_KEY = "brandbjerg-kursusleder-survey-responses";
export const KURSUSLEDER_SURVEY_UPDATED_EVENT =
  "brandbjerg-kursusleder-survey-updated";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(KURSUSLEDER_SURVEY_UPDATED_EVENT));
  }
}

function loadConfigs(): Record<string, CourseSurveyConfig> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, CourseSurveyConfig>>(
    localStorage.getItem(CONFIG_KEY),
  ) ?? {};
}

function saveConfigs(configs: Record<string, CourseSurveyConfig>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configs));
  emitUpdate();
}

function loadResponses(): SurveyResponseRecord[] {
  if (typeof window === "undefined") return [];
  return safeParse<SurveyResponseRecord[]>(localStorage.getItem(RESPONSES_KEY)) ?? [];
}

function saveResponses(records: SurveyResponseRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(records));
  emitUpdate();
}

export function getSurveyConfig(courseId: string): CourseSurveyConfig | null {
  const stored = loadConfigs()[courseId];
  if (stored) return stored;

  const course = getCourseDetailById(courseId);
  if (!course) return null;

  return {
    courseId,
    courseTitle: course.title,
    introduction: DEFAULT_SURVEY_INTRODUCTION,
    questions: createDefaultSurveyQuestions(),
    published: false,
    updatedAt: new Date().toISOString(),
  };
}

export function ensureSurveyConfig(courseId: string): CourseSurveyConfig {
  const existing = loadConfigs()[courseId];
  if (existing) return existing;

  const course = getCourseDetailById(courseId);
  const config: CourseSurveyConfig = {
    courseId,
    courseTitle: course?.title ?? "Kursus",
    introduction: DEFAULT_SURVEY_INTRODUCTION,
    questions: createDefaultSurveyQuestions(),
    published: false,
    updatedAt: new Date().toISOString(),
  };
  saveConfigs({ ...loadConfigs(), [courseId]: config });
  return config;
}

export function saveSurveyConfig(config: CourseSurveyConfig): CourseSurveyConfig {
  const next: CourseSurveyConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  saveConfigs({ ...loadConfigs(), [config.courseId]: next });
  return next;
}

export function resetSurveyToDefault(courseId: string): CourseSurveyConfig {
  const course = getCourseDetailById(courseId);
  const config: CourseSurveyConfig = {
    courseId,
    courseTitle: course?.title ?? "Kursus",
    introduction: DEFAULT_SURVEY_INTRODUCTION,
    questions: createDefaultSurveyQuestions(),
    published: loadConfigs()[courseId]?.published ?? false,
    updatedAt: new Date().toISOString(),
  };
  return saveSurveyConfig(config);
}

export function getEnabledQuestions(config: CourseSurveyConfig): SurveyQuestion[] {
  return config.questions.filter((q) => q.enabled);
}

export function groupQuestionsBySection(
  questions: SurveyQuestion[],
): Array<{ title: string; instruction?: string; questions: SurveyQuestion[] }> {
  const sections: Array<{
    title: string;
    instruction?: string;
    questions: SurveyQuestion[];
  }> = [];
  for (const q of questions) {
    const existing = sections.find((s) => s.title === q.sectionTitle);
    if (existing) {
      existing.questions.push(q);
    } else {
      sections.push({
        title: q.sectionTitle,
        instruction: q.sectionInstruction,
        questions: [q],
      });
    }
  }
  return sections;
}

export function saveSurveyResponse(
  courseId: string,
  courseTitle: string,
  answers: SurveyResponseRecord["answers"],
): SurveyResponseRecord {
  const record: SurveyResponseRecord = {
    id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    courseId,
    courseTitle,
    submittedAt: new Date().toISOString(),
    answers,
  };
  saveResponses([record, ...loadResponses()]);
  return record;
}

export function listSurveyResponses(courseId?: string): SurveyResponseRecord[] {
  let records = loadResponses();
  if (courseId) {
    records = records.filter((r) => r.courseId === courseId);
  }
  return records.sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export function countSurveyResponses(courseId: string): number {
  return loadResponses().filter((r) => r.courseId === courseId).length;
}

export function getSurveyPublicUrl(courseId: string): string {
  if (typeof window === "undefined") {
    return `/evaluering/${courseId}`;
  }
  return `${window.location.origin}/evaluering/${courseId}`;
}
