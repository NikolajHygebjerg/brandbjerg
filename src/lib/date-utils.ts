/** ISO-dato YYYY-MM-DD i lokal kalender (uden tidszone-drift). */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDaysIso(dateStr: string, days: number): string {
  const d = parseIsoDate(dateStr);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function formatDateDa(dateStr: string): string {
  return parseIsoDate(dateStr).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateDaShort(dateStr: string): string {
  return parseIsoDate(dateStr).toLocaleDateString("da-DK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Check-out er eksklusiv — natten til dato tæller med hvis from <= nat < to. */
export function eachNight(fromDate: string, toDateExclusive: string): string[] {
  const nights: string[] = [];
  let cur = fromDate;
  while (cur < toDateExclusive) {
    nights.push(cur);
    cur = addDaysIso(cur, 1);
  }
  return nights;
}

export function nightCount(fromDate: string, toDateExclusive: string): number {
  return eachNight(fromDate, toDateExclusive).length;
}

export function dateRangesOverlap(
  aFrom: string,
  aToExclusive: string,
  bFrom: string,
  bToExclusive: string,
): boolean {
  return aFrom < bToExclusive && bFrom < aToExclusive;
}

export function upcomingDatesFromToday(count: number): string[] {
  const start = todayIso();
  return Array.from({ length: count }, (_, i) => addDaysIso(start, i));
}
