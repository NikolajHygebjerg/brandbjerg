import { loadKitchenWeekMealPlan } from "./kitchen-meal-plan-storage";
import type { KitchenMealSlotPlan } from "./kitchen-meal-plan-storage";
import { getIsoWeekDays } from "./kitchen-week-calendar";

/** Typiske serveringstider pr. forplejningstype */
export const MEAL_SERVING_TIMES: Record<string, string> = {
  Morgenmad: "07:30",
  Formiddag: "10:00",
  Frokost: "12:00",
  Eftermiddag: "15:00",
  Aftensmad: "18:00",
  Aften: "20:30",
  Aftensforplejning: "20:30",
  Madpakker: "12:00",
  "Disp.1": "14:00",
  "Disp.2": "16:00",
};

export interface ActiveKitchenMeal {
  year: number;
  weekNumber: number;
  date: string;
  dayName: string;
  slot: KitchenMealSlotPlan;
  servingTime: string;
  nextServingTime: string | null;
}

export function getServingTimeForForplejning(forplejning: string): string {
  return MEAL_SERVING_TIMES[forplejning] ?? "12:00";
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function getIsoWeekForDate(date: Date): { year: number; weekNumber: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { year: d.getUTCFullYear(), weekNumber };
}

export function todayDateString(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function msUntilNextMealSwitch(now = new Date()): number {
  const active = resolveActiveKitchenMeal(now);
  if (!active?.nextServingTime) {
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  }
  const [h, m] = active.nextServingTime.split(":").map(Number);
  const next = new Date(now);
  next.setHours(h ?? 0, m ?? 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return Math.max(1000, next.getTime() - now.getTime());
}

export function resolveActiveKitchenMeal(
  now = new Date(),
): ActiveKitchenMeal | null {
  if (typeof window === "undefined") return null;

  const date = todayDateString(now);
  const { year, weekNumber } = getIsoWeekForDate(now);
  const dayDefs = getIsoWeekDays(year, weekNumber);
  const plan = loadKitchenWeekMealPlan(year, weekNumber, dayDefs);
  const dayPlan = plan.days.find((d) => d.date === date);
  if (!dayPlan || dayPlan.slots.length === 0) return null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const timed = dayPlan.slots
    .map((slot) => ({
      slot,
      minutes: timeToMinutes(getServingTimeForForplejning(slot.forplejning)),
      servingTime: getServingTimeForForplejning(slot.forplejning),
    }))
    .sort((a, b) => a.minutes - b.minutes);

  if (timed.length === 0) return null;

  const first = timed[0];
  if (nowMinutes < first.minutes) return null;

  let activeIdx = 0;
  for (let i = 0; i < timed.length; i++) {
    if (timed[i].minutes <= nowMinutes) activeIdx = i;
    else break;
  }

  const active = timed[activeIdx];
  const next = timed[activeIdx + 1];

  return {
    year,
    weekNumber,
    date,
    dayName: dayPlan.dayName,
    slot: active.slot,
    servingTime: active.servingTime,
    nextServingTime: next?.servingTime ?? null,
  };
}
