import type { Course, CourseDay } from "../mock-data";
import { computeProgramTotals } from "../module-plan-utils";
import { BUDGET_RATES } from "./budget-constants";
import type {
  BudgetLine,
  BudgetManualLines,
  BudgetSection,
  CourseBudgetInput,
  CourseBudgetResult,
  HonorarLine,
  ModuleHonorarSource,
} from "./budget-types";

export function defaultBudgetManualLines(): BudgetManualLines {
  return {
    singleRooms: 0,
    singleRoomSpecial: 0,
    childPayments: 0,
    specialDiscount: 0,
    newspaperDiscount: 0,
    seniorDiscountCount: 0,
    linenIncomeCount: 0,
    kostTillægParticipants: 0,
    childMealParticipants: 0,
    cleaningRooms: 0,
    linenExpenseCount: 0,
    otherExternal: [
      {
        id: "ext-1",
        label: "Skolens egne busser",
        amount: 0,
        confirmed: false,
        note: "",
      },
    ],
    transport: [],
  };
}

export function buildBudgetInput(
  course: Course,
  manual: BudgetManualLines,
  overrides?: Partial<CourseBudgetInput>,
): CourseBudgetInput {
  return {
    budgetStudents: overrides?.budgetStudents ?? course.capacity,
    actualParticipants:
      overrides?.actualParticipants ??
      (course.enrolled > 0 ? course.enrolled : course.capacity),
    coursePrice: overrides?.coursePrice ?? course.price,
    dayCount: overrides?.dayCount ?? Math.max(1, course.days.length || 1),
    tilskudRate: overrides?.tilskudRate ?? BUDGET_RATES.tilskudRateDefault,
    tilskudTakst: overrides?.tilskudTakst ?? BUDGET_RATES.tilskudTakstDefault,
    maxBudgetTotal:
      overrides?.maxBudgetTotal ?? BUDGET_RATES.maxBudgetTotalDefault,
    maxBudgetPerParticipant:
      overrides?.maxBudgetPerParticipant ??
      BUDGET_RATES.maxBudgetPerParticipantDefault,
    manual,
  };
}

export function moduleHonorar(mod: ModuleHonorarSource): number {
  if (mod.erMaltid) return 0;
  if (mod.pris > 0) return mod.pris;
  if (mod.lon === "A") return BUDGET_RATES.lonA;
  if (mod.lon === "B") return BUDGET_RATES.lonB;
  return 0;
}

export function getHonorarLinesFromDays(days: CourseDay[]): HonorarLine[] {
  const lines: HonorarLine[] = [];
  for (const day of days) {
    for (const mod of day.modules) {
      if (mod.erMaltid) continue;
      if (!mod.overskrift.trim() && !mod.underviser.trim()) continue;
      lines.push({
        moduleId: mod.id,
        dayLabel: day.label,
        rolle: mod.rolle,
        navn: mod.underviser || mod.rolle,
        overskrift: mod.overskrift,
        beloeb: moduleHonorar(mod),
        bekraeftet: mod.klar,
        note: mod.interneNoter,
      });
    }
  }
  return lines;
}

function negative(amount: number): number {
  return amount > 0 ? -amount : amount;
}

export function calculateCourseBudget(
  input: CourseBudgetInput,
  days: CourseDay[],
): CourseBudgetResult {
  const {
    budgetStudents,
    actualParticipants,
    coursePrice,
    dayCount,
    tilskudRate,
    tilskudTakst,
    maxBudgetTotal,
    maxBudgetPerParticipant,
    manual,
  } = input;

  const egenbetaling = coursePrice * actualParticipants;
  const enevaerelse = manual.singleRooms * BUDGET_RATES.enevaerelseTillaeg;
  const enevaerelseSaerpris = manual.singleRoomSpecial;
  const tilskud = tilskudRate * tilskudTakst * actualParticipants;
  const aeldresagsRabat =
    manual.seniorDiscountCount * BUDGET_RATES.aeldresagsRabat;
  const linnedIndtaegt =
    manual.linenIncomeCount * BUDGET_RATES.linnedIndtaegt;

  const incomeLines: BudgetLine[] = [
    {
      label: "Egenbetaling budget (indtægt ved budget)",
      amount: egenbetaling,
      detail: `${coursePrice.toLocaleString("da-DK")} × ${actualParticipants}`,
    },
    {
      label: "Eneværelse",
      amount: enevaerelse,
      detail:
        manual.singleRooms > 0
          ? `${manual.singleRooms} × ${BUDGET_RATES.enevaerelseTillaeg}`
          : undefined,
    },
    ...(enevaerelseSaerpris
      ? [{ label: "Eneværelse særpris", amount: enevaerelseSaerpris }]
      : []),
    ...(manual.childPayments
      ? [{ label: "Egenbetaling børn", amount: manual.childPayments }]
      : []),
    ...(manual.specialDiscount
      ? [{ label: "Særlig rabat", amount: -Math.abs(manual.specialDiscount) }]
      : []),
    ...(manual.newspaperDiscount
      ? [{ label: "Avisrabat", amount: -Math.abs(manual.newspaperDiscount) }]
      : []),
    ...(aeldresagsRabat
      ? [{ label: "Ældresagsrabat", amount: aeldresagsRabat }]
      : []),
    ...(linnedIndtaegt
      ? [{ label: "Linned", amount: linnedIndtaegt }]
      : []),
    {
      label: "Tilskudstakst",
      amount: tilskud,
      detail: `${tilskudRate} × ${tilskudTakst} × ${actualParticipants}`,
    },
  ];

  const totalIncome = incomeLines.reduce((s, l) => s + l.amount, 0);

  const kostVoksne = actualParticipants * dayCount * BUDGET_RATES.kostVoksnePerDag;
  const kostTillæg =
    manual.kostTillægParticipants * dayCount * BUDGET_RATES.kostTillægPerDag;
  const kostBoern =
    manual.childMealParticipants * dayCount * BUDGET_RATES.kostBoernPerDag;
  const fasteUdgifter =
    budgetStudents * dayCount * BUDGET_RATES.fasteUdgifterPerDag;
  const rengoring = manual.cleaningRooms * BUDGET_RATES.rengoringPerVaerelse;
  const linnedUdgift =
    manual.linenExpenseCount * BUDGET_RATES.linnedPerPerson;
  const forbrugsafgifter =
    actualParticipants * dayCount * BUDGET_RATES.forbrugsafgifterPerDag;

  const internalLines: BudgetLine[] = [
    {
      label: "Kost voksne",
      amount: negative(kostVoksne),
      detail: `${actualParticipants} × ${dayCount} døgn × ${BUDGET_RATES.kostVoksnePerDag}`,
    },
    {
      label: "Kost tillæg",
      amount: negative(kostTillæg),
      detail: `${manual.kostTillægParticipants} × ${dayCount} døgn`,
    },
    {
      label: "Kost børn",
      amount: negative(kostBoern),
      detail: `${manual.childMealParticipants} × ${dayCount} døgn × ${BUDGET_RATES.kostBoernPerDag}`,
    },
    {
      label: "Faste udgifter",
      amount: negative(fasteUdgifter),
      detail: `${budgetStudents} × ${dayCount} døgn × ${BUDGET_RATES.fasteUdgifterPerDag}`,
    },
    {
      label: "Rengøring (antal værelser)",
      amount: negative(rengoring),
    },
    {
      label: "Linned",
      amount: negative(linnedUdgift),
    },
    {
      label: "Forbrugsafgifter",
      amount: negative(forbrugsafgifter),
      detail: `${actualParticipants} × ${dayCount} døgn × ${BUDGET_RATES.forbrugsafgifterPerDag}`,
    },
  ];

  const totalInternalExpenses = internalLines.reduce((s, l) => s + l.amount, 0);

  const honorarLines = getHonorarLinesFromDays(days);
  const honorarSectionLines: BudgetLine[] = honorarLines.map((line) => ({
    label: `${line.overskrift || line.rolle} (${line.dayLabel})`,
    amount: negative(line.beloeb),
    detail: line.navn,
  }));
  const totalHonorar = honorarSectionLines.reduce((s, l) => s + l.amount, 0);

  const otherExternalLines: BudgetLine[] = manual.otherExternal
    .filter((line) => line.label.trim() || line.amount)
    .map((line) => ({
      label: line.label || "Anden udgift",
      amount: negative(line.amount),
      detail: line.note || undefined,
    }));
  const totalOtherExternal = otherExternalLines.reduce((s, l) => s + l.amount, 0);

  const transportLines: BudgetLine[] = manual.transport
    .filter((line) => line.label.trim() || line.km)
    .map((line) => ({
      label: line.label || "Transport",
      amount: negative(line.km * line.rate),
      detail: `${line.km} km × ${line.rate}`,
    }));
  const totalTransport = transportLines.reduce((s, l) => s + l.amount, 0);

  const totalExpenses =
    totalInternalExpenses +
    totalHonorar +
    totalOtherExternal +
    totalTransport;
  const result = totalIncome + totalExpenses;
  const resultPerParticipant =
    actualParticipants > 0 ? result / actualParticipants : 0;

  const programTotalsRaw = computeProgramTotals(days);
  const uvMin = programTotalsRaw.uvMinutter;

  return {
    input,
    honorarLines,
    income: { title: "Indtægter", lines: incomeLines, subtotal: totalIncome },
    internalExpenses: {
      title: "Interne udgifter",
      lines: internalLines,
      subtotal: totalInternalExpenses,
    },
    honorar: {
      title: "Honorar og løn",
      lines: honorarSectionLines,
      subtotal: totalHonorar,
    },
    otherExternal: {
      title: "Andre eksterne udgifter",
      lines: otherExternalLines,
      subtotal: totalOtherExternal,
    },
    transport: {
      title: "Transport eksterne undervisere",
      lines: transportLines,
      subtotal: totalTransport,
    },
    totalIncome,
    totalInternalExpenses,
    totalHonorar,
    totalOtherExternal,
    totalTransport,
    totalExpenses,
    result,
    resultPerParticipant,
    programTotals: {
      ubakMin: programTotalsRaw.ubakMinutter,
      ftMin: programTotalsRaw.ftMinutter,
      ptsMin: programTotalsRaw.ptsMinutter,
      bhMin: programTotalsRaw.bhMinutter,
      uvMin,
      ftPct: programTotalsRaw.ftPct,
      bhPct: programTotalsRaw.bhPct,
    },
    overMaxBudget:
      Math.abs(totalHonorar + totalOtherExternal) > maxBudgetTotal ||
      (actualParticipants > 0 &&
        Math.abs(totalHonorar + totalOtherExternal) / actualParticipants >
          maxBudgetPerParticipant),
  };
}
