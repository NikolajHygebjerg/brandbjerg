import {
  statusarkCourses,
  type StatusarkCourse,
} from "./brandbjerg-statusark";
import { brandbjerg2026Courses } from "./brandbjerg-arshjul";
import { normalizeTitle } from "./arshjul-utils";
import type {
  EffortAnalysisDetail,
  HistoricalLearningAnalysis,
  MarketingEffortType,
  SimilarCourseSnapshot,
} from "./kommunikation-types";
import { marketingEffortTypeLabels } from "./kommunikation-types";
import {
  analyzeEffortDetail,
  monthsBeforeStart,
} from "./kommunikation-utils";
import {
  ensureHistoricalMarketingDemoData,
  loadKommunikationState,
  loadMarketingGoals,
} from "./kommunikation-storage";
import { enrollmentWeeksWithActivity, netEnrolled } from "./statusark-utils";

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.437;

function isoDateForWeek(year: number, week: number): string {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
  const monday = new Date(mondayWeek1);
  monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
  return monday.toISOString().slice(0, 10);
}


/** Ord der alene ikke indikerer samme emne */
const TITLE_STOPWORDS = new Set([
  "i", "og", "af", "det", "den", "de", "et", "en", "til", "med", "for", "som",
  "din", "dit", "der", "på", "at", "du", "vi", "har", "kan", "om", "ud", "fra",
  "over", "under", "mellem", "eller", "når", "hvor", "hvad", "the",
  "liv", "kursus", "dag", "dage", "tidl", "resten", "skab",
]);

function significantTitleWords(title: string): string[] {
  return normalizeTitle(title)
    .split(" ")
    .filter((w) => w.length > 2 && !TITLE_STOPWORDS.has(w));
}

/** Fælles ord eller tydelig stamme (fx haven ↔ havebrug) */
function wordsRelate(a: string, b: string): boolean {
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length >= 4 && longer.includes(shorter)) return true;
  if (Math.min(a.length, b.length) >= 4) {
    const stem = shorter.slice(0, 4);
    if (longer.startsWith(stem)) return true;
  }
  return false;
}

function sharedSignificantWords(a: string, b: string): string[] {
  const wordsA = significantTitleWords(a);
  const wordsB = significantTitleWords(b);
  const shared: string[] = [];

  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wordsRelate(wa, wb) && !shared.includes(wa)) {
        shared.push(wa);
      }
    }
  }

  return shared;
}

function similarityScore(
  candidate: StatusarkCourse,
  target: { id: string; title: string; type: string },
): { score: number; reason: string } {
  if (candidate.id === target.id) return { score: 0, reason: "" };

  const normA = normalizeTitle(candidate.title);
  const normB = normalizeTitle(target.title);
  if (normA === normB) {
    return { score: 100, reason: "Samme titel" };
  }

  const shared = sharedSignificantWords(candidate.title, target.title);
  if (shared.length === 0) {
    return { score: 0, reason: "" };
  }

  const targetWords = significantTitleWords(target.title);
  const allTargetWordsMatched =
    targetWords.length > 0 &&
    targetWords.every((tw) =>
      significantTitleWords(candidate.title).some((cw) => wordsRelate(tw, cw)),
    );

  if (allTargetWordsMatched && targetWords.length >= 2) {
    return {
      score: 90,
      reason: `Samme emneord (${shared.join(", ")})`,
    };
  }

  if (shared.length >= 2) {
    return {
      score: 70 + shared.length * 5,
      reason: `Fælles emneord (${shared.join(", ")})`,
    };
  }

  const word = shared[0];
  return {
    score: word.length >= 5 ? 65 : 55,
    reason: `Fælles emneord («${word}»)`,
  };
}

function isCourseHeldBefore(
  course: StatusarkCourse,
  beforeStartDate: string,
): boolean {
  if (!course.endDate) return false;
  return new Date(course.endDate) < new Date(beforeStartDate);
}

export function findSimilarHeldCourses(
  target: { id: string; title: string; type: string; startDate: string },
  limit = 5,
): Array<{ course: StatusarkCourse; score: number; reason: string }> {
  const results: Array<{ course: StatusarkCourse; score: number; reason: string }> =
    [];

  for (const course of statusarkCourses) {
    if (!isCourseHeldBefore(course, target.startDate)) continue;
    if (course.enrollmentByWeek.length === 0) continue;

    const { score, reason } = similarityScore(course, target);
    if (score <= 0) continue;

    results.push({ course, score, reason });
  }

  return results
    .sort((a, b) => b.score - a.score || b.course.courseWeekNumber - a.course.courseWeekNumber)
    .slice(0, limit);
}

export function findPeakEnrollmentWeek(
  course: StatusarkCourse,
): {
  monthsBefore: number;
  weekLabel: string;
  count: number;
} | null {
  if (!course.startDate) return null;

  const startMs = new Date(course.startDate).getTime();
  let best: { monthsBefore: number; weekLabel: string; count: number } | null =
    null;

  for (const w of enrollmentWeeksWithActivity(course.enrollmentByWeek)) {
    if (w.count <= 0) continue;
    const weekStartMs = new Date(isoDateForWeek(w.year, w.week)).getTime();
    const monthsBefore = (startMs - weekStartMs) / MS_PER_MONTH;
    if (monthsBefore < 0) continue;

    if (!best || w.count > best.count) {
      best = {
        monthsBefore: Math.round(monthsBefore * 10) / 10,
        weekLabel: `uge ${w.week}, ${w.year}`,
        count: w.count,
      };
    }
  }

  return best;
}

function getArshjulHistory(title: string): Record<number, number> {
  const norm = normalizeTitle(title);
  const match = brandbjerg2026Courses.find(
    (c) => normalizeTitle(c.title) === norm,
  );
  return match?.history ?? {};
}

function aggregateChannelResults(
  snapshots: SimilarCourseSnapshot[],
): Map<
  MarketingEffortType,
  { good: number; poor: number; totalEnrollments: number; totalSpend: number }
> {
  const map = new Map<
    MarketingEffortType,
    { good: number; poor: number; totalEnrollments: number; totalSpend: number }
  >();

  for (const snap of snapshots) {
    for (const effort of snap.efforts) {
      const type = effort.effort.type;
      const entry = map.get(type) ?? {
        good: 0,
        poor: 0,
        totalEnrollments: 0,
        totalSpend: 0,
      };
      if (effort.rating === "good" || effort.rating === "acceptable") {
        entry.good += 1;
      } else if (effort.rating === "poor") {
        entry.poor += 1;
      }
      entry.totalEnrollments += effort.enrollmentsInFollowUp;
      entry.totalSpend += effort.effort.price;
      map.set(type, entry);
    }
  }

  return map;
}

function buildHistoricalConclusions(
  target: { title: string; type: string; startDate: string },
  snapshots: SimilarCourseSnapshot[],
  arshjulHistory: Record<number, number>,
  avgPeak: number | null,
  channelStats: ReturnType<typeof aggregateChannelResults>,
): { conclusions: string[]; recommendations: string[] } {
  const conclusions: string[] = [];
  const recommendations: string[] = [];

  if (snapshots.length === 0) {
    conclusions.push(
      "Ingen afholdte kurser med tilmeldingstal deler tydelige emneord i titlen endnu — analysen opdateres når der findes historik med samme emne (fx «haven» for «Liv i haven»).",
    );
    const histYears = Object.keys(arshjulHistory);
    if (histYears.length > 0) {
      const histLine = Object.entries(arshjulHistory)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([y, n]) => `${y}: ${n} kursister`)
        .join(", ");
      conclusions.push(
        `Årshjul-historik for «${target.title}»: ${histLine}.`,
      );
    }
    return { conclusions, recommendations };
  }

  conclusions.push(
    `Appen fandt ${snapshots.length} afholdt${snapshots.length !== 1 ? "e" : ""} lignende kursus${snapshots.length !== 1 ? "er" : ""} at lære af (match på fælles emneord i titlen).`,
  );

  const peaks = snapshots
    .map((s) => s.peakMonthsBefore)
    .filter((p): p is number => p != null);
  if (avgPeak != null && peaks.length > 0) {
    const minPeak = Math.min(...peaks);
    const maxPeak = Math.max(...peaks);
    conclusions.push(
      `Flest pladser solgtes typisk ${minPeak === maxPeak ? `ca. ${Math.round(avgPeak)} måneder` : `${Math.round(minPeak)}–${Math.round(maxPeak)} måneder`} før kursusstart${peaks.length > 1 ? ` (gennemsnit ${Math.round(avgPeak)} mdr.)` : ""}.`,
    );
    recommendations.push(
      `Planlæg markedsføring og push 3–4 måneder før start — det er her tilmeldingerne historically kommer tættest.`,
    );
  }

  const topPeak = [...snapshots].sort(
    (a, b) => b.peakWeekCount - a.peakWeekCount,
  )[0];
  if (topPeak?.peakWeekLabel) {
    conclusions.push(
      `Største enkelt-tilmelgingsuge på «${topPeak.title}»: ${topPeak.peakWeekCount} pladser i ${topPeak.peakWeekLabel} (${topPeak.peakMonthsBefore} mdr. før).`,
    );
  }

  const withEfforts = snapshots.filter((s) => s.efforts.length > 0);
  if (withEfforts.length > 0) {
    const worked = snapshots.flatMap((s) =>
      s.efforts.filter((e) => e.rating === "good" || e.rating === "acceptable"),
    );
    const failed = snapshots.flatMap((s) =>
      s.efforts.filter((e) => e.rating === "poor"),
    );

    if (worked.length > 0) {
      const byWorked = new Map<MarketingEffortType, number>();
      for (const e of worked) {
        byWorked.set(e.effort.type, (byWorked.get(e.effort.type) ?? 0) + 1);
      }
      const bestChannel = [...byWorked.entries()].sort((a, b) => b[1] - a[1])[0];
      if (bestChannel) {
        conclusions.push(
          `${marketingEffortTypeLabels[bestChannel[0]]} virkede bedst på lignende kurser (${bestChannel[1]} effektiv${bestChannel[1] !== 1 ? "e" : ""} indsats${bestChannel[1] !== 1 ? "er" : ""}).`,
        );
        recommendations.push(
          `Overvej ${marketingEffortTypeLabels[bestChannel[0]].toLowerCase()} som primær kanal — baseret på historik fra lignende kurser.`,
        );
      }
    }

    if (failed.length > 0) {
      const failedTypes = [...new Set(failed.map((e) => e.effort.type))];
      conclusions.push(
        `${failedTypes.map((t) => marketingEffortTypeLabels[t]).join(" og ")} gav dårlig eller ingen effekt på ${failed.length} historisk${failed.length !== 1 ? "e" : ""} indsats${failed.length !== 1 ? "er" : ""} — brug forsigtigt eller test timing.`,
      );
    }
  } else {
    conclusions.push(
      "Ingen markedsføringsindsatser er registreret på de lignende kurser — overvej at dokumentere kampagner fremover for bedre læring.",
    );
  }

  for (const [type, stats] of channelStats) {
    if (stats.good === 0 && stats.poor > 0) {
      recommendations.push(
        `Undgå at gentage ${marketingEffortTypeLabels[type].toLowerCase()} uden ændret timing — ${stats.poor} tidligere forsøg gav ingen eller lav effekt.`,
      );
    }
  }

  const avgFill =
    snapshots.reduce((s, c) => s + c.fillRate, 0) / snapshots.length;
  conclusions.push(
    `Gennemsnitlig belægning på lignende kurser: ${Math.round(avgFill)}% af budget.`,
  );

  const histYears = Object.entries(arshjulHistory).sort(
    ([a], [b]) => Number(b) - Number(a),
  );
  if (histYears.length > 0) {
    conclusions.push(
      `Tidligere afholdelser af «${target.title}»: ${histYears.map(([y, n]) => `${y} (${n} pers.)`).join(", ")}.`,
    );
  }

  const monthsUntilStart = monthsBeforeStart(target.startDate);
  if (avgPeak != null && monthsUntilStart > avgPeak + 1) {
    recommendations.push(
      `Der er ca. ${Math.round(monthsUntilStart)} måneder til start — ifølge historikken bør intensiv markedsføring planlægges nu.`,
    );
  }

  return { conclusions, recommendations };
}

export function buildHistoricalLearningAnalysis(
  courseId: string,
  target: { title: string; type: string; startDate: string },
): HistoricalLearningAnalysis {
  ensureHistoricalMarketingDemoData();

  const goals = loadMarketingGoals();
  const similar = findSimilarHeldCourses(
    { id: courseId, ...target },
    5,
  );

  const snapshots: SimilarCourseSnapshot[] = similar.map(
    ({ course, score, reason }) => {
      const enrolled = netEnrolled(
        course.totalEnrolled,
        course.paidCancellations,
      );
      const budget = course.budgetStudents || enrolled || 1;
      const peak = findPeakEnrollmentWeek(course);
      const state = loadKommunikationState(course.id);
      const efforts = (state?.efforts ?? []).map((e) =>
        analyzeEffortDetail(e, course, goals),
      );

      return {
        courseId: course.id,
        title: course.title,
        type: course.type,
        startDate: course.startDate ?? "",
        endDate: course.endDate ?? "",
        enrolled,
        budget,
        fillRate: Math.round((enrolled / budget) * 100),
        matchReason: reason,
        matchScore: score,
        peakMonthsBefore: peak?.monthsBefore ?? null,
        peakWeekLabel: peak?.weekLabel ?? null,
        peakWeekCount: peak?.count ?? 0,
        efforts,
      };
    },
  );

  const peaks = snapshots
    .map((s) => s.peakMonthsBefore)
    .filter((p): p is number => p != null);
  const avgPeak =
    peaks.length > 0
      ? Math.round((peaks.reduce((a, b) => a + b, 0) / peaks.length) * 10) / 10
      : null;

  const arshjulHistory = getArshjulHistory(target.title);
  const channelStats = aggregateChannelResults(snapshots);
  const { conclusions, recommendations } = buildHistoricalConclusions(
    target,
    snapshots,
    arshjulHistory,
    avgPeak,
    channelStats,
  );

  return {
    targetTitle: target.title,
    targetType: target.type,
    similarCourses: snapshots,
    conclusions,
    recommendations,
    avgPeakMonthsBefore: avgPeak,
    arshjulHistory,
  };
}
