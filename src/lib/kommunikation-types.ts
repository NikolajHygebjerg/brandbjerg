export type MarketingEffortType = "facebook" | "some" | "avis";

export interface MarketingEffort {
  id: string;
  courseId: string;
  type: MarketingEffortType;
  startDate: string;
  endDate: string;
  price: number;
  createdAt: string;
}

export interface EnrollmentBenchmark {
  /** Måneder før kursusstart (0–6) */
  monthsBefore: number;
  targetCount: number;
}

export interface RegistrationAttributionQuestion {
  id: string;
  courseId: string;
  effortId: string;
  questionText: string;
  createdAt: string;
}

export interface CourseKommunikationState {
  benchmarks: EnrollmentBenchmark[];
  /** true når benchmarks er auto-genereret fra historik */
  benchmarksFromHistory: boolean;
  efforts: MarketingEffort[];
}

export const marketingEffortTypeLabels: Record<MarketingEffortType, string> = {
  facebook: "Facebookkampagne",
  some: "SoMe",
  avis: "Avisannonce",
};

export type BenchmarkPaceStatus = "green" | "orange" | "red";

export interface EffortAnalyticsRow {
  effort: MarketingEffort;
  courseTitle: string;
  courseId: string;
  enrollmentsDuring: number;
  costPerEnrollment: number | null;
}

export interface MarketingTypeSummary {
  type: MarketingEffortType;
  label: string;
  effortCount: number;
  totalSpend: number;
  totalEnrollments: number;
  avgCostPerEnrollment: number | null;
}

/** Mål for vurdering af markedsføringseffekt — kan tilrettes under Kommunikation → Mål */
export interface MarketingEffectivenessGoals {
  /** Kr. pr. tilmelding — grøn zone */
  goodCostPerEnrollment: number;
  /** Kr. pr. tilmelding — orange zone; over = rød */
  maxCostPerEnrollment: number;
  /** Minimum tilmeldinger i opfølgningsperioden for at indsatsen anses effektiv */
  minEnrollmentsPerEffort: number;
  /** Dage efter kampagneslut hvor tilmeldinger måles */
  followUpDays: number;
}

export type MarketingEffortRating = "good" | "acceptable" | "poor" | "none";

export interface EffortAnalysisDetail extends EffortAnalyticsRow {
  enrollmentsInFollowUp: number;
  attributedCount: number;
  costPerEnrollmentFollowUp: number | null;
  rating: MarketingEffortRating;
  narrative: string;
  goalComparison: string;
}

export interface CourseMarketingAnalysis {
  efforts: EffortAnalysisDetail[];
  overallConclusion: string;
  goals: MarketingEffectivenessGoals;
}

export interface CoursePaceRow {
  courseId: string;
  title: string;
  weekNumber: number;
  enrolled: number;
  expected: number;
  budget: number;
  pace: BenchmarkPaceStatus;
  gap: number;
  effortCount: number;
}

export interface OverallKommunikationAnalysis {
  year: number;
  courseCount: number;
  paceCounts: Record<BenchmarkPaceStatus, number>;
  courses: CoursePaceRow[];
  totalMarketingSpend: number;
  totalMarketingEfforts: number;
  coursesWithMarketing: number;
  coursesWithoutMarketing: number;
  enrollmentConclusions: string[];
  marketingConclusions: string[];
  marketing: {
    efforts: EffortAnalysisDetail[];
    byType: MarketingTypeSummary[];
    goals: MarketingEffectivenessGoals;
  };
}

export interface SimilarCourseSnapshot {
  courseId: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  enrolled: number;
  budget: number;
  fillRate: number;
  matchReason: string;
  matchScore: number;
  peakMonthsBefore: number | null;
  peakWeekLabel: string | null;
  peakWeekCount: number;
  efforts: EffortAnalysisDetail[];
}

export interface HistoricalLearningAnalysis {
  targetTitle: string;
  targetType: string;
  similarCourses: SimilarCourseSnapshot[];
  conclusions: string[];
  recommendations: string[];
  avgPeakMonthsBefore: number | null;
  arshjulHistory: Record<number, number>;
}
