import type { BrandbjergPlannedCourse, CourseHistory } from "./brandbjerg-arshjul";

/** ISO-uge: mandag som ugestart */
export function getWeekDates(
  year: number,
  weekNumber: number,
  dayCount = 5,
): { startDate: string; endDate: string } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);

  const start = new Date(mondayWeek1);
  start.setUTCDate(mondayWeek1.getUTCDate() + (weekNumber - 1) * 7);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + Math.max(0, dayCount - 1));

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

const YEAR_WEIGHTS = [0.4, 0.25, 0.15, 0.12, 0.08];

/**
 * Bud på realistisk antal kursister baseret på de sidste 5 år.
 * Foregående år vægtes højest (40%).
 */
export function suggestStudentCount(
  history: CourseHistory,
  planningYear: number,
  fallback = 20,
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < 5; i++) {
    const y = planningYear - 1 - i;
    const val = history[y];
    if (val != null && val > 0) {
      weightedSum += val * YEAR_WEIGHTS[i];
      totalWeight += YEAR_WEIGHTS[i];
    }
  }

  if (totalWeight === 0) return fallback;
  return Math.max(1, Math.round(weightedSum / totalWeight));
}

export function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-zæøå0-9]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Find historik for samme titel på tværs af tidligere års planer */
export function mergeHistoryForTitle(
  title: string,
  sourceCourses: BrandbjergPlannedCourse[],
  sourceYear: number,
): CourseHistory {
  const norm = normalizeTitle(title);
  const match = sourceCourses.find(
    (c) => normalizeTitle(c.title) === norm,
  );
  const history: CourseHistory = { ...(match?.history ?? {}) };

  if (match && match.budgetStudents > 0) {
    history[sourceYear] = match.budgetStudents;
  }

  return history;
}

export function copyCoursesToYear(
  sourceCourses: BrandbjergPlannedCourse[],
  fromYear: number,
  toYear: number,
): BrandbjergPlannedCourse[] {
  return sourceCourses
    .filter((c) => c.title && c.title !== "-")
    .map((c, i) => {
      const dayCount = c.dayCount ?? 5;
      const dates = getWeekDates(toYear, c.weekNumber, dayCount);
      const history = mergeHistoryForTitle(c.title, sourceCourses, fromYear);
      const suggested = suggestStudentCount(
        history,
        toYear,
        c.budgetStudents || 20,
      );

      return {
        ...c,
        id: `bb${toYear}-${i + 1}`,
        startDate: dates.startDate,
        endDate: dates.endDate,
        budgetStudents: suggested,
        history,
        notes: c.notes,
      };
    });
}

export function sumBudgetStudents(courses: BrandbjergPlannedCourse[]) {
  return courses.reduce((s, c) => s + (c.budgetStudents || 0), 0);
}

export function formatWeekRange(start: string | null, end: string | null) {
  if (!start) return "—";
  const fmt = (d: string) =>
    new Intl.DateTimeFormat("da-DK", {
      day: "numeric",
      month: "short",
    }).format(new Date(d));
  if (!end || start === end) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

export function historySummary(
  history: CourseHistory,
  planningYear: number,
): string {
  const parts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const y = planningYear - 1 - i;
    if (history[y] != null) parts.push(`${y}: ${history[y]}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Ingen historik";
}
