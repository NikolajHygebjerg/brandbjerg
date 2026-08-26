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
