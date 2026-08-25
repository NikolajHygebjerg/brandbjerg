import type { ProgramTemplate } from "./program-templates/liv-i-haven-5dage";
import { defaultProgramTemplates } from "./program-templates/liv-i-haven-5dage";

const STORAGE_KEY = "brandbjerg-program-templates";

export interface StoredTemplateMeta {
  updatedAt: string;
}

type StoredTemplatesMap = Record<
  string,
  ProgramTemplate & StoredTemplateMeta
>;

function readAll(): StoredTemplatesMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredTemplatesMap;
  } catch {
    return {};
  }
}

function writeAll(map: StoredTemplatesMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function listTemplates(): ProgramTemplate[] {
  const stored = readAll();
  return defaultProgramTemplates.map((base) => {
    const override = stored[base.id];
    if (!override) return base;
    const { updatedAt: _u, ...template } = override;
    return template;
  });
}

export function getTemplateById(id: string): ProgramTemplate | undefined {
  return listTemplates().find((t) => t.id === id);
}

export function getTemplateForDayCount(days: number): ProgramTemplate | undefined {
  return listTemplates().find((t) => t.dayCount === days);
}

export function getTemplateMeta(id: string): StoredTemplateMeta | null {
  const stored = readAll()[id];
  if (!stored) return null;
  return { updatedAt: stored.updatedAt };
}

export function saveTemplate(template: ProgramTemplate): StoredTemplateMeta {
  const stored = readAll();
  stored[template.id] = {
    ...template,
    updatedAt: new Date().toISOString(),
  };
  writeAll(stored);
  return { updatedAt: stored[template.id].updatedAt };
}

export function resetTemplate(id: string): void {
  const stored = readAll();
  delete stored[id];
  writeAll(stored);
}

export function isTemplateCustomized(id: string): boolean {
  return Boolean(readAll()[id]);
}

export function formatTemplateSavedAt(iso: string): string {
  return new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
