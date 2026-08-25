import type { CourseModule } from "../mock-data";

export interface BudgetManualLines {
  singleRooms: number;
  singleRoomSpecial: number;
  childPayments: number;
  specialDiscount: number;
  newspaperDiscount: number;
  seniorDiscountCount: number;
  linenIncomeCount: number;
  kostTillægParticipants: number;
  childMealParticipants: number;
  cleaningRooms: number;
  linenExpenseCount: number;
  otherExternal: BudgetExternalLine[];
  transport: BudgetTransportLine[];
}

export interface BudgetExternalLine {
  id: string;
  label: string;
  amount: number;
  confirmed: boolean;
  note: string;
}

export interface BudgetTransportLine {
  id: string;
  label: string;
  km: number;
  rate: number;
  confirmed: boolean;
  note: string;
}

export interface CourseBudgetInput {
  budgetStudents: number;
  actualParticipants: number;
  coursePrice: number;
  dayCount: number;
  tilskudRate: number;
  tilskudTakst: number;
  maxBudgetTotal: number;
  maxBudgetPerParticipant: number;
  manual: BudgetManualLines;
}

export interface HonorarLine {
  moduleId: string;
  dayLabel: string;
  rolle: string;
  navn: string;
  overskrift: string;
  beloeb: number;
  bekraeftet: boolean;
  note: string;
}

export interface BudgetLine {
  label: string;
  amount: number;
  detail?: string;
}

export interface BudgetSection {
  title: string;
  lines: BudgetLine[];
  subtotal: number;
}

export interface CourseBudgetResult {
  input: CourseBudgetInput;
  honorarLines: HonorarLine[];
  income: BudgetSection;
  internalExpenses: BudgetSection;
  honorar: BudgetSection;
  otherExternal: BudgetSection;
  transport: BudgetSection;
  totalIncome: number;
  totalInternalExpenses: number;
  totalHonorar: number;
  totalOtherExternal: number;
  totalTransport: number;
  totalExpenses: number;
  result: number;
  resultPerParticipant: number;
  programTotals: {
    ubakMin: number;
    ftMin: number;
    ptsMin: number;
    bhMin: number;
    uvMin: number;
    ftPct: number;
    bhPct: number;
  };
  overMaxBudget: boolean;
}

export type ModuleHonorarSource = Pick<
  CourseModule,
  "id" | "erMaltid" | "overskrift" | "underviser" | "rolle" | "pris" | "lon" | "klar" | "interneNoter"
>;
