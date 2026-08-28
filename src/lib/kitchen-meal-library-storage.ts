import { forplejningTyper } from "./kitchen-options";
import type { KitchenMealSlotPlan } from "./kitchen-meal-plan-storage";

const KEY = "brandbjerg-kitchen-meal-library";
export const KITCHEN_MEAL_LIBRARY_UPDATED_EVENT =
  "brandbjerg-kitchen-meal-library-updated";

export interface SavedMealPlanEntry {
  id: string;
  forplejning: string;
  label: string;
  menuText: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  usedCount: number;
  lastUsedAt: string | null;
  sourceYear: number | null;
  sourceWeekNumber: number | null;
  sourceDate: string | null;
}

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
    window.dispatchEvent(new CustomEvent(KITCHEN_MEAL_LIBRARY_UPDATED_EVENT));
  }
}

function normalizeMenu(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function libraryKey(forplejning: string, menuText: string): string {
  return `${forplejning.trim().toLowerCase()}::${normalizeMenu(menuText)}`;
}

function loadAll(): SavedMealPlanEntry[] {
  if (typeof window === "undefined") return getSeedMeals();
  const stored =
    safeParse<SavedMealPlanEntry[]>(localStorage.getItem(KEY)) ?? [];
  if (stored.length === 0) {
    saveAll(getSeedMeals());
    return getSeedMeals();
  }
  return stored;
}

function saveAll(entries: SavedMealPlanEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(entries));
  emitUpdate();
}

/** Demo-inspiration ved første besøg */
function getSeedMeals(): SavedMealPlanEntry[] {
  const now = new Date().toISOString();
  const seeds: Array<[string, string, string?]> = [
    ["Morgenmad", "Rugbrød, ost, æg, grød og frugt"],
    ["Morgenmad", "Ymer, müsli, brød og pålæg"],
    ["Frokost", "Hjemmelavet fiskefrikadeller med kartoffler og persillesovs"],
    ["Frokost", "Kyllingegryde med ris og salat"],
    ["Frokost", "Tomatsuppe og smørrebrød"],
    ["Aftensmad", "Flæskesteg med brun sovs og rødkål"],
    ["Aftensmad", "Pasta med grøntsager og parmesan"],
    ["Formiddag", "Kaffe, te og kage"],
    ["Eftermiddag", "Frugt, nødder og kaffe/the"],
    ["Aften", "Natmad — brød, ost og spegepølse"],
  ];
  return seeds.map(([forplejning, menuText, note], i) => ({
    id: `seed-${i}`,
    forplejning,
    label: forplejning,
    menuText,
    note: note ?? "",
    createdAt: now,
    updatedAt: now,
    usedCount: 0,
    lastUsedAt: null,
    sourceYear: null,
    sourceWeekNumber: null,
    sourceDate: null,
  }));
}

export function listSavedMealPlans(forplejning?: string): SavedMealPlanEntry[] {
  let entries = loadAll().filter((e) => e.menuText.trim().length > 0);
  if (forplejning) {
    entries = entries.filter(
      (e) => e.forplejning.toLowerCase() === forplejning.toLowerCase(),
    );
  }
  return entries.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function listMealPlanTypes(): string[] {
  const types = new Set(loadAll().map((e) => e.forplejning));
  for (const t of forplejningTyper) types.add(t);
  return Array.from(types).sort((a, b) => a.localeCompare(b, "da"));
}

export function saveMealPlanToLibrary(input: {
  forplejning: string;
  label: string;
  menuText: string;
  note?: string;
  sourceYear?: number;
  sourceWeekNumber?: number;
  sourceDate?: string;
}): SavedMealPlanEntry | null {
  const menuText = input.menuText.trim();
  if (!menuText) return null;

  const now = new Date().toISOString();
  const entries = loadAll();
  const key = libraryKey(input.forplejning, menuText);
  const existingIdx = entries.findIndex(
    (e) => libraryKey(e.forplejning, e.menuText) === key,
  );

  if (existingIdx >= 0) {
    const existing = entries[existingIdx];
    const updated: SavedMealPlanEntry = {
      ...existing,
      label: input.label || existing.label,
      note: input.note?.trim() ?? existing.note,
      updatedAt: now,
      usedCount: existing.usedCount + 1,
      lastUsedAt: now,
      sourceYear: input.sourceYear ?? existing.sourceYear,
      sourceWeekNumber: input.sourceWeekNumber ?? existing.sourceWeekNumber,
      sourceDate: input.sourceDate ?? existing.sourceDate,
    };
    entries[existingIdx] = updated;
    saveAll(entries);
    return updated;
  }

  const created: SavedMealPlanEntry = {
    id: `kml-${Date.now()}`,
    forplejning: input.forplejning,
    label: input.label || input.forplejning,
    menuText,
    note: input.note?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
    usedCount: 1,
    lastUsedAt: now,
    sourceYear: input.sourceYear ?? null,
    sourceWeekNumber: input.sourceWeekNumber ?? null,
    sourceDate: input.sourceDate ?? null,
  };
  entries.unshift(created);
  saveAll(entries);
  return created;
}

export function syncSlotToMealLibrary(
  slot: KitchenMealSlotPlan,
  context?: {
    year: number;
    weekNumber: number;
    date: string;
  },
): SavedMealPlanEntry | null {
  return saveMealPlanToLibrary({
    forplejning: slot.forplejning,
    label: slot.label,
    menuText: slot.menuText,
    note: slot.note,
    sourceYear: context?.year,
    sourceWeekNumber: context?.weekNumber,
    sourceDate: context?.date,
  });
}

export function deleteSavedMealPlan(id: string): void {
  saveAll(loadAll().filter((e) => e.id !== id));
}

const DUMMY_AI_SUGGESTIONS: Record<string, string[]> = {
  Morgenmad: [
    "Skyr, müsli, frisk frugt og hjemmebagt brød",
    "Røræg, bacon, grød og rugbrød med pålæg",
  ],
  Formiddag: ["Kaffe, te og hjemmebagt kage", "Friskbagte boller og frugt"],
  Frokost: [
    "Fiskefrikadeller med kartofler og salat",
    "Kyllingecurry med ris og naanbrød",
  ],
  Eftermiddag: ["Frugt, nødder og kaffe/the", "Smoothie og småkager"],
  Aftensmad: [
    "Oksegryde med rodfrugter og brød",
    "Vegetarlasagne med salat",
  ],
  Aften: ["Brød, ost og spegepølse", "Natmad — havregrød og frugt"],
};

/** Dummy AI-forslag — senere erstattes af AI-motor */
export function getDummyMealPlanSuggestions(
  forplejning: string,
): string[] {
  const fromLibrary = listSavedMealPlans(forplejning)
    .slice(0, 2)
    .map((e) => e.menuText);
  const dummy = DUMMY_AI_SUGGESTIONS[forplejning] ?? [
    `Forslag til ${forplejning.toLowerCase()} — AI kommer snart`,
  ];
  const merged = [...fromLibrary];
  for (const d of dummy) {
    if (!merged.some((m) => normalizeMenu(m) === normalizeMenu(d))) {
      merged.push(d);
    }
  }
  return merged.slice(0, 3);
}

export function getDummyDayMealSuggestions(
  slots: KitchenMealSlotPlan[],
): Array<{ slotId: string; forplejning: string; label: string; suggestion: string }> {
  return slots.map((slot) => ({
    slotId: slot.id,
    forplejning: slot.forplejning,
    label: slot.label,
    suggestion: getDummyMealPlanSuggestions(slot.forplejning)[0] ?? "",
  }));
}
