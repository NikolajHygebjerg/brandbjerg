import type { WeeklyEnrollment } from "./brandbjerg-statusark";

/** Format uge-label som i statusark (fx "34/2025" eller "7") */
export function formatCalendarWeek(year: number, week: number): string {
  if (year === 2025 && week >= 34) return `${week}/${year}`;
  return String(week);
}

export function weekSortKey(w: WeeklyEnrollment): number {
  return w.year * 100 + w.week;
}

export function sumWeeklyEnrollments(weeks: WeeklyEnrollment[]): number {
  return weeks.reduce((s, w) => s + w.count, 0);
}

/** Netto tilmeldinger efter betalte afmeldinger */
export function netEnrolled(total: number, cancelled: number): number {
  return Math.max(0, total - cancelled);
}

export function peakEnrollmentWeek(weeks: WeeklyEnrollment[]): WeeklyEnrollment | null {
  if (weeks.length === 0) return null;
  return weeks.reduce((best, w) => (w.count > best.count ? w : best));
}

export function enrollmentWeeksWithActivity(weeks: WeeklyEnrollment[]): WeeklyEnrollment[] {
  return [...weeks].sort((a, b) => weekSortKey(a) - weekSortKey(b));
}

/** Simuler enkeltstående tilmeldingsrecords fra ugentlige aggregates (mockup) */
export function expandWeeklyToRecords(
  courseId: string,
  weeks: WeeklyEnrollment[],
): Array<{
  id: string;
  courseId: string;
  calendarYear: number;
  calendarWeek: number;
  registeredAt: string;
}> {
  const records: Array<{
    id: string;
    courseId: string;
    calendarYear: number;
    calendarWeek: number;
    registeredAt: string;
  }> = [];
  let seq = 0;
  for (const w of weeks) {
    for (let i = 0; i < Math.abs(w.count); i++) {
      seq++;
      records.push({
        id: `${courseId}-e-${seq}`,
        courseId,
        calendarYear: w.year,
        calendarWeek: w.week,
        registeredAt: isoDateForWeek(w.year, w.week),
      });
    }
  }
  return records;
}

/** Mandag i ISO-uge — til mock registeredAt */
function isoDateForWeek(year: number, week: number): string {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
  const start = new Date(mondayWeek1);
  start.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
  return start.toISOString().slice(0, 10);
}

export function overUnderLabel(value: number | null): string {
  if (value == null) return "—";
  if (value > 0) return `+${value} over budget`;
  if (value < 0) return `${value} under budget`;
  return "På budget";
}
