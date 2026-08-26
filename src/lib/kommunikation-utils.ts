import { getStatusarkCourse } from "./brandbjerg-status";
import {
  statusarkCourses,
  type StatusarkCourse,
  type WeeklyEnrollment,
} from "./brandbjerg-statusark";
import type {
  BenchmarkPaceStatus,
  CourseMarketingAnalysis,
  EffortAnalysisDetail,
  EffortAnalyticsRow,
  EnrollmentBenchmark,
  MarketingEffectivenessGoals,
  MarketingEffort,
  MarketingEffortRating,
  MarketingEffortType,
  MarketingTypeSummary,
} from "./kommunikation-types";
import { marketingEffortTypeLabels } from "./kommunikation-types";
import {
  getAttributionCountForEffort,
  loadKommunikationState,
  loadMarketingGoals,
} from "./kommunikation-storage";
import type { Course } from "./mock-data";
import { enrollmentWeeksWithActivity, netEnrolled } from "./statusark-utils";

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.437;

export function monthsBeforeStart(
  startDate: string,
  at: Date = new Date(),
): number {
  const start = new Date(startDate);
  const diff = start.getTime() - at.getTime();
  if (diff <= 0) return 0;
  return diff / MS_PER_MONTH;
}

export function timelineStartDate(courseStartDate: string): Date {
  const start = new Date(courseStartDate);
  const d = new Date(start);
  d.setMonth(d.getMonth() - 6);
  return d;
}

function isoDateForWeek(year: number, week: number): string {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
  const monday = new Date(mondayWeek1);
  monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

function cumulativeAtDate(
  weeks: WeeklyEnrollment[],
  atDate: string,
): number {
  const target = new Date(atDate).getTime();
  let sum = 0;
  for (const w of enrollmentWeeksWithActivity(weeks)) {
    const weekStart = new Date(isoDateForWeek(w.year, w.week)).getTime();
    if (weekStart <= target) sum += w.count;
  }
  return Math.max(0, sum);
}

function enrollmentsBetweenDates(
  weeks: WeeklyEnrollment[],
  startDate: string,
  endDate: string,
): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  let sum = 0;
  for (const w of weeks) {
    const weekStart = new Date(isoDateForWeek(w.year, w.week)).getTime();
    const weekEnd = weekStart + 7 * 24 * 3600 * 1000;
    if (weekEnd >= start && weekStart <= end) {
      sum += Math.max(0, w.count);
    }
  }
  return sum;
}

/** Gennemsnitlig tilmeldingskurve fra tidligere kurser med data */
export function suggestBenchmarksFromHistory(
  budgetStudents: number,
  excludeCourseId?: string,
): EnrollmentBenchmark[] {
  const ratiosByMonth = new Map<number, number[]>();

  for (const course of statusarkCourses) {
    if (course.id === excludeCourseId) continue;
    if (!course.startDate || course.enrollmentByWeek.length === 0) continue;
    const budget =
      course.budgetStudents || course.maxStudents || course.totalEnrolled;
    if (budget <= 0) continue;

    const finalEnrolled = Math.max(
      course.totalEnrolled - course.paidCancellations,
      1,
    );

    for (let m = 1; m <= 6; m++) {
      const at = new Date(course.startDate);
      at.setMonth(at.getMonth() - m);
      const cumulative = cumulativeAtDate(
        course.enrollmentByWeek,
        at.toISOString().slice(0, 10),
      );
      const ratio = Math.min(1, cumulative / finalEnrolled);
      const list = ratiosByMonth.get(m) ?? [];
      list.push(ratio);
      ratiosByMonth.set(m, list);
    }
  }

  const benchmarks: EnrollmentBenchmark[] = [];
  for (let m = 6; m >= 0; m--) {
    const ratios = ratiosByMonth.get(m) ?? [];
    const avgRatio =
      ratios.length > 0
        ? ratios.reduce((a, b) => a + b, 0) / ratios.length
        : (6 - m) / 6;
    benchmarks.push({
      monthsBefore: m,
      targetCount: Math.round(budgetStudents * avgRatio),
    });
  }

  benchmarks.sort((a, b) => b.monthsBefore - a.monthsBefore);
  const last = benchmarks.find((b) => b.monthsBefore === 0);
  if (last) last.targetCount = budgetStudents;

  return benchmarks;
}

export function defaultEmptyBenchmarks(
  budgetStudents: number,
): EnrollmentBenchmark[] {
  return [6, 5, 4, 3, 2, 1, 0].map((m) => ({
    monthsBefore: m,
    targetCount:
      m === 0
        ? budgetStudents
        : Math.round((budgetStudents * (6 - m)) / 6),
  }));
}

export function getBenchmarksForCourse(
  courseId: string,
  startDate: string | null,
  budgetStudents: number,
): EnrollmentBenchmark[] {
  const stored = loadKommunikationState(courseId);
  if (stored && stored.benchmarks.length > 0) return stored.benchmarks;

  if (startDate && hasHistoricalData()) {
    return suggestBenchmarksFromHistory(budgetStudents, courseId);
  }
  return defaultEmptyBenchmarks(budgetStudents);
}

function hasHistoricalData(): boolean {
  return statusarkCourses.some(
    (c) => c.enrollmentByWeek.length > 0 && c.startDate,
  );
}

export function canSuggestFromHistory(): boolean {
  return hasHistoricalData();
}

export function expectedEnrollmentToday(
  startDate: string,
  benchmarks: EnrollmentBenchmark[],
): number {
  const months = monthsBeforeStart(startDate);
  if (months <= 0) {
    return benchmarks.find((b) => b.monthsBefore === 0)?.targetCount ?? 0;
  }
  if (months >= 6) {
    return benchmarks.find((b) => b.monthsBefore === 6)?.targetCount ?? 0;
  }

  const sorted = [...benchmarks].sort(
    (a, b) => b.monthsBefore - a.monthsBefore,
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    const hi = sorted[i];
    const lo = sorted[i + 1];
    if (months <= hi.monthsBefore && months >= lo.monthsBefore) {
      const span = hi.monthsBefore - lo.monthsBefore || 1;
      const t = (hi.monthsBefore - months) / span;
      return Math.round(hi.targetCount + t * (lo.targetCount - hi.targetCount));
    }
  }
  return sorted[sorted.length - 1]?.targetCount ?? 0;
}

export function benchmarkPaceStatus(
  enrolled: number,
  expected: number,
): BenchmarkPaceStatus {
  if (enrolled >= expected) return "green";
  if (expected - enrolled <= 5) return "orange";
  return "red";
}

export const paceStatusClasses: Record<BenchmarkPaceStatus, string> = {
  green: "bg-emerald-100 text-emerald-800",
  orange: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-800",
};

export function analyzeEffort(
  effort: MarketingEffort,
  course: StatusarkCourse,
): EffortAnalyticsRow {
  const enrollmentsDuring = enrollmentsBetweenDates(
    course.enrollmentByWeek,
    effort.startDate,
    effort.endDate,
  );
  return {
    effort,
    courseId: course.id,
    courseTitle: course.title,
    enrollmentsDuring,
    costPerEnrollment:
      enrollmentsDuring > 0
        ? Math.round(effort.price / enrollmentsDuring)
        : null,
  };
}

function buildConclusions(
  byType: MarketingTypeSummary[],
  efforts: EffortAnalysisDetail[],
  goals: MarketingEffectivenessGoals,
): string[] {
  if (efforts.length === 0) {
    return [
      "Ingen markedsføringsindsatser registreret endnu — opret indsatser på enkeltkurser for at starte analysen.",
    ];
  }

  const lines = efforts.map((e) => e.narrative);

  const good = efforts.filter((e) => e.rating === "good");
  const poor = efforts.filter((e) => e.rating === "poor");
  if (good.length > 0 || poor.length > 0) {
    lines.push(
      `Sammenlignet med jeres mål (≤ ${goals.goodCostPerEnrollment.toLocaleString("da-DK")} kr/tilmelding = god, ≤ ${goals.maxCostPerEnrollment.toLocaleString("da-DK")} kr = acceptabel): ${good.length} indsats${good.length !== 1 ? "er" : ""} opfylder målene, ${poor.length} ligger under.`,
    );
  }

  const ranked = [...byType]
    .filter((t) => t.avgCostPerEnrollment != null)
    .sort(
      (a, b) =>
        (a.avgCostPerEnrollment ?? Infinity) -
        (b.avgCostPerEnrollment ?? Infinity),
    );
  if (ranked.length > 1) {
    const best = ranked[0];
    lines.push(
      `${best.label} har samlet set lavest omkostning pr. tilmelding (${best.avgCostPerEnrollment?.toLocaleString("da-DK")} kr.) på tværs af ${best.effortCount} indsats${best.effortCount !== 1 ? "er" : ""}.`,
    );
  }

  return lines;
}

export function getStatusarkForKommunikation(courseId: string) {
  return getStatusarkCourse(courseId);
}

/** Slå statusark op via id, titel+uge, eller brug kursus-detaljer som fallback */
export interface KommunikationCourseContext {
  storageCourseId: string;
  statusark: StatusarkCourse | null;
  startDate: string;
  endDate: string;
  budgetStudents: number;
  enrolled: number;
  enrollmentByWeek: WeeklyEnrollment[];
}

export function findStatusarkCourse(
  courseId: string,
  course?: Pick<Course, "title" | "weekNumber" | "startDate">,
): StatusarkCourse | undefined {
  const direct = getStatusarkCourse(courseId);
  if (direct) return direct;

  if (!course?.title || !course.weekNumber) return undefined;

  const normalizedTitle = course.title.toLowerCase().trim();
  return statusarkCourses.find(
    (c) =>
      c.courseWeekNumber === course.weekNumber &&
      c.title.toLowerCase().trim() === normalizedTitle,
  );
}

export function resolveKommunikationContext(
  courseId: string,
  course: Course,
): KommunikationCourseContext | null {
  const statusark = findStatusarkCourse(courseId, course) ?? null;
  const startDate = statusark?.startDate || course.startDate;
  if (!startDate) return null;

  const endDate =
    statusark?.endDate || course.endDate || startDate;
  const budgetStudents =
    statusark?.budgetStudents ||
    course.capacity ||
    20;
  const enrolled = statusark
    ? netEnrolled(statusark.totalEnrolled, statusark.paidCancellations)
    : course.enrolled;

  return {
    storageCourseId: courseId,
    statusark,
    startDate,
    endDate,
    budgetStudents,
    enrolled,
    enrollmentByWeek: statusark?.enrollmentByWeek ?? [],
  };
}

export function dateToTimelinePercent(
  date: string,
  courseStartDate: string,
): number {
  const start = timelineStartDate(courseStartDate).getTime();
  const end = new Date(courseStartDate).getTime();
  const point = new Date(date).getTime();
  if (end <= start) return 0;
  return Math.max(0, Math.min(100, ((point - start) / (end - start)) * 100));
}

export function todayTimelinePercent(courseStartDate: string): number | null {
  const end = new Date(courseStartDate).getTime();
  if (Date.now() > end) return 100;
  const start = timelineStartDate(courseStartDate).getTime();
  if (Date.now() < start) return 0;
  return dateToTimelinePercent(new Date().toISOString().slice(0, 10), courseStartDate);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function formatDateRange(start: string, end: string): string {
  if (start === end) return formatShortDate(start);
  return `${formatShortDate(start)}–${formatShortDate(end)}`;
}

function attributionSourceLabel(type: MarketingEffortType): string {
  if (type === "facebook") return "Facebook";
  if (type === "avis") return "avisen";
  return "SoMe";
}

export function enrollmentsInFollowUpPeriod(
  weeks: WeeklyEnrollment[],
  campaignEndDate: string,
  followUpDays: number,
): number {
  const start = addDays(campaignEndDate, 1);
  const end = addDays(campaignEndDate, followUpDays);
  return enrollmentsBetweenDates(weeks, start, end);
}

export function rateEffortAgainstGoals(
  enrollmentsInFollowUp: number,
  costPerEnrollment: number | null,
  goals: MarketingEffectivenessGoals,
): MarketingEffortRating {
  if (enrollmentsInFollowUp < goals.minEnrollmentsPerEffort) return "poor";
  if (costPerEnrollment == null) return "none";
  if (costPerEnrollment <= goals.goodCostPerEnrollment) return "good";
  if (costPerEnrollment <= goals.maxCostPerEnrollment) return "acceptable";
  return "poor";
}

export function buildGoalComparisonText(
  rating: MarketingEffortRating,
  costPerEnrollment: number | null,
  goals: MarketingEffectivenessGoals,
): string {
  if (rating === "poor" && costPerEnrollment == null) {
    return `Mål: mindst ${goals.minEnrollmentsPerEffort} tilmelding${goals.minEnrollmentsPerEffort !== 1 ? "er" : ""} inden for ${goals.followUpDays} dage efter kampagnen — ikke opfyldt.`;
  }
  if (costPerEnrollment == null) return "";
  if (rating === "good") {
    return `Under målet på ${goals.goodCostPerEnrollment.toLocaleString("da-DK")} kr. pr. tilmelding — god effekt.`;
  }
  if (rating === "acceptable") {
    return `Mellem ${goals.goodCostPerEnrollment.toLocaleString("da-DK")} og ${goals.maxCostPerEnrollment.toLocaleString("da-DK")} kr. pr. tilmelding — acceptabel effekt.`;
  }
  return `Over målet på ${goals.maxCostPerEnrollment.toLocaleString("da-DK")} kr. pr. tilmelding — svag effekt.`;
}

export function buildEffortNarrative(
  row: EffortAnalyticsRow,
  enrollmentsInFollowUp: number,
  attributedCount: number,
  goals: MarketingEffectivenessGoals,
): { narrative: string; goalComparison: string; rating: MarketingEffortRating } {
  const label = marketingEffortTypeLabels[row.effort.type];
  const period = formatDateRange(row.effort.startDate, row.effort.endDate);
  const price = row.effort.price.toLocaleString("da-DK");
  const costPerEnrollment =
    enrollmentsInFollowUp > 0
      ? Math.round(row.effort.price / enrollmentsInFollowUp)
      : null;
  const rating = rateEffortAgainstGoals(
    enrollmentsInFollowUp,
    costPerEnrollment,
    goals,
  );
  const source = attributionSourceLabel(row.effort.type);

  let narrative: string;
  if (enrollmentsInFollowUp === 0) {
    narrative = `${label} ${period} til ${price} kr gav ingen tilmeldinger i de ${goals.followUpDays} dage efter. Det kostede ${price} kr uden målbart resultat.`;
  } else {
    const costLow = Math.round(row.effort.price / enrollmentsInFollowUp);
    const costHigh =
      attributedCount > 0
        ? Math.round(row.effort.price / attributedCount)
        : costLow;
    const costPhrase =
      attributedCount > 0 && attributedCount < enrollmentsInFollowUp
        ? `${costLow.toLocaleString("da-DK")}–${costHigh.toLocaleString("da-DK")}`
        : costLow.toLocaleString("da-DK");

    narrative = `${label} ${period} til ${price} kr resulterede i ${enrollmentsInFollowUp} tilmeldt${enrollmentsInFollowUp !== 1 ? "e" : ""} i de ${goals.followUpDays} dage efter.`;
    if (attributedCount > 0) {
      narrative += ` ${attributedCount} har registreret at de så os i ${source}.`;
    }
    narrative += ` Det kostede altså ${costPhrase} kr pr. kursist for disse.`;
  }

  return {
    narrative,
    goalComparison: buildGoalComparisonText(rating, costPerEnrollment, goals),
    rating,
  };
}

export function analyzeEffortDetail(
  effort: MarketingEffort,
  course: StatusarkCourse,
  goals?: MarketingEffectivenessGoals,
): EffortAnalysisDetail {
  const g = goals ?? loadMarketingGoals();
  const base = analyzeEffort(effort, course);
  const enrollmentsInFollowUp = enrollmentsInFollowUpPeriod(
    course.enrollmentByWeek,
    effort.endDate,
    g.followUpDays,
  );
  const attributedCount = getAttributionCountForEffort(effort.id);
  const { narrative, goalComparison, rating } = buildEffortNarrative(
    base,
    enrollmentsInFollowUp,
    attributedCount,
    g,
  );
  const costPerEnrollmentFollowUp =
    enrollmentsInFollowUp > 0
      ? Math.round(effort.price / enrollmentsInFollowUp)
      : null;

  return {
    ...base,
    enrollmentsInFollowUp,
    attributedCount,
    costPerEnrollmentFollowUp,
    rating,
    narrative,
    goalComparison,
  };
}

export function buildCourseMarketingAnalysis(
  courseId: string,
  courseMeta?: Pick<Course, "title" | "weekNumber" | "startDate">,
  goals?: MarketingEffectivenessGoals,
): CourseMarketingAnalysis | null {
  const g = goals ?? loadMarketingGoals();
  const course =
    findStatusarkCourse(courseId, courseMeta) ?? getStatusarkCourse(courseId);
  if (!course) return null;

  const state = loadKommunikationState(courseId);
  const efforts = (state?.efforts ?? []).map((e) =>
    analyzeEffortDetail(e, course, g),
  );

  let overallConclusion: string;
  if (efforts.length === 0) {
    overallConclusion =
      "Ingen markedsføringsindsatser registreret — opret indsatser for at starte analysen.";
  } else {
    const good = efforts.filter((e) => e.rating === "good");
    const poor = efforts.filter((e) => e.rating === "poor");
    const parts: string[] = [];
    if (good.length > 0) {
      parts.push(
        `${good.length} indsats${good.length !== 1 ? "er" : ""} vurderes som effektive (≤ ${g.goodCostPerEnrollment.toLocaleString("da-DK")} kr/tilmelding).`,
      );
    }
    if (poor.length > 0) {
      parts.push(
        `${poor.length} indsats${poor.length !== 1 ? "er" : ""} ligger under målene — overvej anden kanal, timing eller budget.`,
      );
    }
    const best = [...efforts]
      .filter((e) => e.enrollmentsInFollowUp > 0)
      .sort(
        (a, b) =>
          (a.costPerEnrollmentFollowUp ?? Infinity) -
          (b.costPerEnrollmentFollowUp ?? Infinity),
      )[0];
    if (best) {
      parts.push(
        `Bedste indsats: ${marketingEffortTypeLabels[best.effort.type]} (${best.costPerEnrollmentFollowUp?.toLocaleString("da-DK")} kr/tilmelding).`,
      );
    } else if (efforts.every((e) => e.enrollmentsInFollowUp === 0)) {
      parts.push(
        `Ingen tilmeldinger i opfølgningsperioden (${g.followUpDays} dage efter kampagner) — markedsføringen har endnu ikke målbart resultat.`,
      );
    }
    overallConclusion = parts.join(" ");
  }

  return { efforts, overallConclusion, goals: g };
}

export function buildMarketingAnalytics(
  courseFilter?: string,
  goals?: MarketingEffectivenessGoals,
): {
  efforts: EffortAnalysisDetail[];
  byType: MarketingTypeSummary[];
  conclusions: string[];
  goals: MarketingEffectivenessGoals;
} {
  const g = goals ?? loadMarketingGoals();
  const efforts: EffortAnalysisDetail[] = [];

  for (const course of statusarkCourses) {
    if (courseFilter && course.id !== courseFilter) continue;
    const state = loadKommunikationState(course.id);
    if (!state) continue;
    for (const effort of state.efforts) {
      efforts.push(analyzeEffortDetail(effort, course, g));
    }
  }

  const byTypeMap = new Map<MarketingEffortType, MarketingTypeSummary>();

  for (const row of efforts) {
    const type = row.effort.type;
    const existing = byTypeMap.get(type) ?? {
      type,
      label: marketingEffortTypeLabels[type],
      effortCount: 0,
      totalSpend: 0,
      totalEnrollments: 0,
      avgCostPerEnrollment: null,
    };
    existing.effortCount += 1;
    existing.totalSpend += row.effort.price;
    existing.totalEnrollments += row.enrollmentsInFollowUp;
    byTypeMap.set(type, existing);
  }

  const byType = Array.from(byTypeMap.values()).map((s) => ({
    ...s,
    avgCostPerEnrollment:
      s.totalEnrollments > 0
        ? Math.round(s.totalSpend / s.totalEnrollments)
        : null,
  }));

  const conclusions = buildConclusions(byType, efforts, g);

  return { efforts, byType, conclusions, goals: g };
}
