export type QuestionDepartment = "koekken" | "pedel";

export interface ModuleQuestion {
  id: string;
  department: QuestionDepartment;
  moduleId: string;
  text: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
}

const STORAGE_KEY = "brandbjerg-module-questions";
export const QUESTIONS_UPDATED_EVENT = "brandbjerg-questions-updated";

type QuestionsByCourse = Record<string, ModuleQuestion[]>;

function readAll(): QuestionsByCourse {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as QuestionsByCourse;
  } catch {
    return {};
  }
}

function writeAll(data: QuestionsByCourse) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function notify(courseId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(QUESTIONS_UPDATED_EVENT, { detail: { courseId } }),
  );
}

export function loadModuleQuestions(courseId: string): ModuleQuestion[] {
  return readAll()[courseId] ?? [];
}

function saveModuleQuestions(courseId: string, questions: ModuleQuestion[]) {
  const all = readAll();
  all[courseId] = questions;
  writeAll(all);
  notify(courseId);
}

export function isQuestionUnanswered(q: ModuleQuestion): boolean {
  return !q.reply?.trim();
}

export function getUnansweredQuestions(
  courseId: string,
  options: { department?: QuestionDepartment; moduleId?: string } = {},
): ModuleQuestion[] {
  return loadModuleQuestions(courseId).filter((q) => {
    if (!isQuestionUnanswered(q)) return false;
    if (options.department && q.department !== options.department) return false;
    if (options.moduleId && q.moduleId !== options.moduleId) return false;
    return true;
  });
}

export function countUnansweredQuestions(
  courseId: string,
  department?: QuestionDepartment,
): number {
  return getUnansweredQuestions(courseId, { department }).length;
}

export function countUnansweredForModule(
  courseId: string,
  moduleId: string,
): number {
  return getUnansweredQuestions(courseId, { moduleId }).length;
}

export function addModuleQuestion(
  courseId: string,
  department: QuestionDepartment,
  moduleId: string,
  text: string,
): ModuleQuestion {
  const question: ModuleQuestion = {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    department,
    moduleId,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  const questions = [...loadModuleQuestions(courseId), question];
  saveModuleQuestions(courseId, questions);
  return question;
}

export function replyToModuleQuestion(
  courseId: string,
  questionId: string,
  reply: string,
): void {
  const questions = loadModuleQuestions(courseId).map((q) =>
    q.id === questionId
      ? {
          ...q,
          reply: reply.trim(),
          repliedAt: new Date().toISOString(),
        }
      : q,
  );
  saveModuleQuestions(courseId, questions);
}

export function departmentLabel(department: QuestionDepartment): string {
  return department === "koekken" ? "Køkken" : "Pedel og rengøring";
}

export function formatQuestionTime(iso: string): string {
  return new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
