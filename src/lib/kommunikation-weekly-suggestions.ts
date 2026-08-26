import { getCourseDetailById, getCoursesForYear } from "./course-list";
import { statusarkCourses } from "./brandbjerg-statusark";
import { findPeakEnrollmentWeek } from "./kommunikation-history-analysis";
import { marketingEffortTypeLabels } from "./kommunikation-types";
import type {
  MarketingTimingPhase,
  WeeklyEffortSuggestion,
  WeeklyEffortSuggestionsResult,
} from "./kommunikation-types";
import {
  benchmarkPaceStatus,
  expectedEnrollmentToday,
  getBenchmarksForCourse,
  monthsBeforeStart,
  resolveKommunikationContext,
} from "./kommunikation-utils";
import {
  loadExperienceNotes,
  loadKommunikationState,
} from "./kommunikation-storage";
import { buildHistoricalLearningAnalysis } from "./kommunikation-history-analysis";

const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;
const TOO_LATE_WEEKS = 3;
const TOO_EARLY_MONTHS = 6;
const SWEET_SPOT_MIN_MONTHS = 2;
const SWEET_SPOT_MAX_MONTHS = 5;

function weeksBeforeStart(startDate: string, at: Date = new Date()): number {
  const diff = new Date(startDate).getTime() - at.getTime();
  if (diff <= 0) return 0;
  return diff / MS_PER_WEEK;
}

function globalAvgPeakMonthsBefore(): number | null {
  const peaks: number[] = [];
  for (const course of statusarkCourses) {
    if (!course.startDate || course.enrollmentByWeek.length === 0) continue;
    const peak = findPeakEnrollmentWeek(course);
    if (peak?.monthsBefore != null) peaks.push(peak.monthsBefore);
  }
  if (peaks.length === 0) return null;
  return (
    Math.round((peaks.reduce((a, b) => a + b, 0) / peaks.length) * 10) / 10
  );
}

export function assessMarketingTiming(
  startDate: string,
  at: Date = new Date(),
): { phase: MarketingTimingPhase; eligible: boolean; reason: string; weight: number } {
  const months = monthsBeforeStart(startDate, at);
  const weeks = weeksBeforeStart(startDate, at);
  const avgPeak = globalAvgPeakMonthsBefore();

  if (months <= 0) {
    return {
      phase: "past",
      eligible: false,
      reason: "Kurset er startet eller afholdt",
      weight: 0,
    };
  }

  if (weeks <= TOO_LATE_WEEKS) {
    return {
      phase: "too_late",
      eligible: false,
      reason: `Kun ${Math.round(weeks)} uge${Math.round(weeks) !== 1 ? "r" : ""} til start — erfaringen siger 2–3 uger før er for sent`,
      weight: 0,
    };
  }

  if (months > TOO_EARLY_MONTHS) {
    return {
      phase: "too_early",
      eligible: false,
      reason: `${Math.round(months)} mdr. til start — for tidligt (vent til ca. 2–5 mdr. før; fx ikke novemberkursus i april)`,
      weight: 0,
    };
  }

  if (months >= SWEET_SPOT_MIN_MONTHS && months <= SWEET_SPOT_MAX_MONTHS) {
    const peakHint =
      avgPeak != null
        ? ` Historisk sælges flest pladser ca. ${Math.round(avgPeak)} mdr. før.`
        : "";
    return {
      phase: "optimal",
      eligible: true,
      reason: `Inden for det bedste vindue (${Math.round(months)} mdr. til start).${peakHint}`,
      weight: 3,
    };
  }

  if (months > SWEET_SPOT_MAX_MONTHS) {
    return {
      phase: "early_ok",
      eligible: true,
      reason: `${Math.round(months)} mdr. til start — tidligt, men acceptabelt for kurser med langt salgsforløb`,
      weight: 1,
    };
  }

  return {
    phase: "late_window",
    eligible: true,
    reason: `${Math.round(months)} mdr. til start — sidste gode vindue før tilmeldinger taper af tæt på start`,
    weight: 2,
  };
}

function bestChannelForCourse(
  courseId: string,
  title: string,
  type: string,
  startDate: string,
): { channel: string | null; reason: string | null; hint: string | null } {
  const learning = buildHistoricalLearningAnalysis(courseId, {
    title,
    type,
    startDate,
  });

  const rec = learning.recommendations.find((r) =>
    /avis|facebook|some|markedsføring/i.test(r),
  );
  const channelRec = learning.recommendations.find((r) =>
    Object.values(marketingEffortTypeLabels).some((l) =>
      r.toLowerCase().includes(l.toLowerCase()),
    ),
  );

  for (const snap of learning.similarCourses) {
    const good = snap.efforts.find(
      (e) => e.rating === "good" || e.rating === "acceptable",
    );
    if (good) {
      return {
        channel: marketingEffortTypeLabels[good.effort.type],
        reason: `Virker på lignende kurser (${snap.title})`,
        hint: learning.avgPeakMonthsBefore
          ? `Peak-tilmeldinger typisk ${learning.avgPeakMonthsBefore} mdr. før start`
          : null,
      };
    }
  }

  if (channelRec) {
    return { channel: null, reason: channelRec, hint: rec ?? null };
  }

  return {
    channel: "Avisannonce",
    reason: "Standard anbefaling når der ikke er kanal-historik på lignende kurser",
    hint: rec ?? null,
  };
}

function noteMatchesCourse(notes: string, title: string, startDate: string): boolean {
  if (!notes.trim()) return false;
  const month = new Date(startDate).toLocaleDateString("da-DK", { month: "long" });
  const lower = notes.toLowerCase();
  const titleWords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (lower.includes(month)) return true;
  return titleWords.some((w) => lower.includes(w));
}

export function buildWeeklyEffortSuggestions(
  year: number,
  at: Date = new Date(),
): WeeklyEffortSuggestionsResult {
  const experience = loadExperienceNotes();
  const suggestions: WeeklyEffortSuggestion[] = [];
  const skippedTooEarly: WeeklyEffortSuggestionsResult["skippedTooEarly"] = [];
  const skippedTooLate: WeeklyEffortSuggestionsResult["skippedTooLate"] = [];

  for (const entry of getCoursesForYear(year)) {
    const detail = getCourseDetailById(entry.id);
    if (!detail) continue;

    const ctx = resolveKommunikationContext(entry.id, detail);
    if (!ctx?.startDate) continue;

    const benchmarks = getBenchmarksForCourse(
      entry.id,
      ctx.startDate,
      ctx.budgetStudents,
    );
    const expected = expectedEnrollmentToday(ctx.startDate, benchmarks);
    const pace = benchmarkPaceStatus(ctx.enrolled, expected);
    const gap = expected - ctx.enrolled;
    const timing = assessMarketingTiming(ctx.startDate, at);
    const months = monthsBeforeStart(ctx.startDate, at);
    const weeks = weeksBeforeStart(ctx.startDate, at);
    const state = loadKommunikationState(entry.id);

    if (timing.phase === "too_early") {
      if (pace !== "green" && gap > 0) {
        skippedTooEarly.push({
          courseId: entry.id,
          title: entry.title,
          reason: timing.reason,
        });
      }
      continue;
    }

    if (timing.phase === "too_late" || timing.phase === "past") {
      if (pace !== "green" && gap > 0) {
        skippedTooLate.push({
          courseId: entry.id,
          title: entry.title,
          reason: timing.reason,
        });
      }
      continue;
    }

    if (pace === "green" || gap <= 0) continue;

    const channel = bestChannelForCourse(
      entry.id,
      entry.title,
      ctx.statusark?.type ?? detail.category,
      ctx.startDate,
    );

    let priorityScore = gap * timing.weight;
    if (pace === "red") priorityScore *= 1.5;
    if (noteMatchesCourse(experience.notes, entry.title, ctx.startDate)) {
      priorityScore *= 1.2;
    }

    suggestions.push({
      courseId: entry.id,
      title: entry.title,
      weekNumber: entry.weekNumber,
      startDate: ctx.startDate,
      enrolled: ctx.enrolled,
      expected: expected,
      budget: ctx.budgetStudents,
      gap,
      pace,
      monthsBeforeStart: Math.round(months * 10) / 10,
      weeksBeforeStart: Math.round(weeks * 10) / 10,
      timingPhase: timing.phase,
      timingReason: timing.reason,
      priorityScore: Math.round(priorityScore),
      suggestedChannel: channel.channel,
      channelReason: channel.reason,
      historicalHint: channel.hint,
      effortCount: state?.efforts.length ?? 0,
    });
  }

  suggestions.sort((a, b) => b.priorityScore - a.priorityScore);

  const summaryLines: string[] = [];
  const avgPeak = globalAvgPeakMonthsBefore();

  if (suggestions.length === 0) {
    summaryLines.push(
      "Ingen kurser i dette uge-vindue mangler tilmeldinger ift. benchmark — eller de ligger for tidligt/for sent til indsats.",
    );
  } else {
    summaryLines.push(
      `${suggestions.length} kursus${suggestions.length !== 1 ? "er" : ""} bør have markedsføringsindsats denne uge baseret på tempo mod «burde være» og tidsmæssigt salgsvindue.`,
    );
    if (avgPeak != null) {
      summaryLines.push(
        `Historisk data: flest pladser sælges typisk ca. ${Math.round(avgPeak)} måneder før kursusstart.`,
      );
    }
  }

  if (skippedTooEarly.length > 0) {
    summaryLines.push(
      `${skippedTooEarly.length} kursus${skippedTooEarly.length !== 1 ? "er" : ""} har dårlige tal, men ligger for tidligt til indsats lige nu.`,
    );
  }

  if (skippedTooLate.length > 0) {
    summaryLines.push(
      `${skippedTooLate.length} kursus${skippedTooLate.length !== 1 ? "er" : ""} er for tæt på start — erfaringen siger det er for sent at starte ny markedsføring.`,
    );
  }

  const notesTrimmed = experience.notes.trim();
  if (notesTrimmed) {
    summaryLines.push(
      `Medtaget team-erfaringsnotat: «${notesTrimmed.length > 120 ? `${notesTrimmed.slice(0, 117)}…` : notesTrimmed}»`,
    );
  }

  return {
    generatedAt: at.toISOString(),
    suggestions,
    skippedTooEarly,
    skippedTooLate,
    summaryLines,
    experienceNotesUsed: notesTrimmed.length > 0,
  };
}
