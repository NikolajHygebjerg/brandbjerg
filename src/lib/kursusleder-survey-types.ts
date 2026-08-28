export type SurveyQuestionType =
  | "single"
  | "multiple"
  | "nps"
  | "interval"
  | "text"
  | "course_info";

export type SurveyScaleKind = "likelihood" | "satisfaction" | "agreement";

export interface SurveyQuestion {
  id: string;
  sectionTitle: string;
  sectionInstruction?: string;
  type: SurveyQuestionType;
  text: string;
  required: boolean;
  enabled: boolean;
  options?: string[];
  maxSelections?: number;
  scale?: SurveyScaleKind;
  scaleMin?: number;
  scaleMax?: number;
  allowNa?: boolean;
  multiline?: boolean;
}

export interface CourseSurveyConfig {
  courseId: string;
  courseTitle: string;
  introduction: string;
  questions: SurveyQuestion[];
  published: boolean;
  updatedAt: string;
}

export type SurveyAnswerValue =
  | string
  | string[]
  | number
  | "na"
  | null;

export interface SurveyResponseRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  submittedAt: string;
  answers: Record<string, SurveyAnswerValue>;
}

export const SURVEY_SCALE_LABELS: Record<
  SurveyScaleKind,
  { low: string; high: string; na: string }
> = {
  likelihood: {
    low: "Meget lidt sandsynligt",
    high: "Meget sandsynligt",
    na: "Ved ikke",
  },
  satisfaction: {
    low: "Meget utilfreds",
    high: "Meget tilfreds",
    na: "Ved ikke",
  },
  agreement: {
    low: "Meget uenig",
    high: "Meget enig",
    na: "Ved ikke",
  },
};
