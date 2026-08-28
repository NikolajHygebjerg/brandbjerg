import { DEFAULT_DAY_MEAL_SLOTS } from "./kitchen-week-calendar";
import { KITCHEN_UPDATED_EVENT } from "./kitchen-storage";

const KEY = "brandbjerg-kitchen-week-plans";

export interface KitchenCourseMealOverride {
  courseId: string;
  courseTitle: string;
  menuText: string;
  note: string;
}

export interface KitchenMealSlotPlan {
  id: string;
  forplejning: string;
  label: string;
  menuText: string;
  note: string;
  /** Standard: alle i huset får denne madplan */
  appliesToAll: boolean;
  courseOverrides: KitchenCourseMealOverride[];
}

export interface KitchenDayMealPlan {
  date: string;
  dayName: string;
  slots: KitchenMealSlotPlan[];
}

export interface KitchenWeekMealPlan {
  year: number;
  weekNumber: number;
  staffOnDuty: number | null;
  days: KitchenDayMealPlan[];
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function planKey(year: number, weekNumber: number): string {
  return `${year}-w${weekNumber}`;
}

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(KITCHEN_UPDATED_EVENT));
  }
}

function loadAll(): Record<string, KitchenWeekMealPlan> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, KitchenWeekMealPlan>>(localStorage.getItem(KEY)) ?? {};
}

function saveAll(all: Record<string, KitchenWeekMealPlan>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(all));
  emitUpdate();
}

function createDefaultSlot(
  slot: (typeof DEFAULT_DAY_MEAL_SLOTS)[number],
): KitchenMealSlotPlan {
  return {
    id: slot.id,
    forplejning: slot.forplejning,
    label: slot.label,
    menuText: "",
    note: "",
    appliesToAll: true,
    courseOverrides: [],
  };
}

export function createDefaultDayPlan(
  date: string,
  dayName: string,
): KitchenDayMealPlan {
  return {
    date,
    dayName,
    slots: DEFAULT_DAY_MEAL_SLOTS.map(createDefaultSlot),
  };
}

export function loadKitchenWeekMealPlan(
  year: number,
  weekNumber: number,
  dayDefs: Array<{ date: string; dayName: string }>,
): KitchenWeekMealPlan {
  const existing = loadAll()[planKey(year, weekNumber)];
  if (!existing) {
    return {
      year,
      weekNumber,
      staffOnDuty: null,
      days: dayDefs.map((d) => createDefaultDayPlan(d.date, d.dayName)),
    };
  }

  const dayMap = new Map(existing.days.map((d) => [d.date, d]));
  return {
    ...existing,
    days: dayDefs.map((d) => {
      const stored = dayMap.get(d.date);
      if (!stored) return createDefaultDayPlan(d.date, d.dayName);
      const slotIds = new Set(stored.slots.map((s) => s.id));
      const defaults = DEFAULT_DAY_MEAL_SLOTS.filter((s) => !slotIds.has(s.id)).map(
        createDefaultSlot,
      );
      return {
        ...stored,
        dayName: d.dayName,
        slots: [...stored.slots, ...defaults],
      };
    }),
  };
}

export function saveKitchenWeekMealPlan(plan: KitchenWeekMealPlan): void {
  const all = loadAll();
  all[planKey(plan.year, plan.weekNumber)] = plan;
  saveAll(all);
}

export function updateKitchenWeekMealPlan(
  year: number,
  weekNumber: number,
  dayDefs: Array<{ date: string; dayName: string }>,
  updater: (plan: KitchenWeekMealPlan) => KitchenWeekMealPlan,
): KitchenWeekMealPlan {
  const current = loadKitchenWeekMealPlan(year, weekNumber, dayDefs);
  const next = updater(current);
  saveKitchenWeekMealPlan(next);
  return next;
}
