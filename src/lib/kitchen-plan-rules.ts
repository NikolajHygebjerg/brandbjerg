import type { ForplejningType } from "./kitchen-options";
import { mergeCoursePlan } from "./course-plan-storage";
import type { Course, CourseDay } from "./mock-data";
import { isHeldagsturModule } from "./mock-data";
import { getMealRowsFromCourse, allKitchenModulesReady } from "./kitchen-utils";

export type KitchenRuleProfile =
  | "standard_5d"
  | "weekend_2d"
  | "kort_3d"
  | "generic";

export interface KitchenPlanWarning {
  dayLabel: string;
  dayDate: string;
  missing: string;
  forplejning: ForplejningType | ForplejningType[];
}

export interface KitchenPlanValidation {
  ok: boolean;
  warnings: KitchenPlanWarning[];
  profile: KitchenRuleProfile;
  profileLabel: string;
}

type MealRequirement = {
  types: ForplejningType | ForplejningType[];
  label: string;
};

const profileLabels: Record<KitchenRuleProfile, string> = {
  standard_5d: "Standard 5-dages kursus",
  weekend_2d: "Weekendkursus (2 dage)",
  kort_3d: "Kort kursus (3 dage)",
  generic: "Almindeligt kursus",
};

const mellemmaltidTyper: ForplejningType[] = ["Formiddag", "Eftermiddag"];

export function isMellemmaltid(type: string): boolean {
  return mellemmaltidTyper.includes(type as ForplejningType);
}

export function resolveKitchenRuleProfile(course: Course): KitchenRuleProfile {
  const days = mergeCoursePlan(course).days.length;
  if (days === 5) return "standard_5d";
  if (days === 2) return "weekend_2d";
  if (days === 3) return "kort_3d";
  return "generic";
}

function dayHasHeldagstur(day: CourseDay): boolean {
  return day.modules.some(isHeldagsturModule);
}

function collectDayForplejning(day: CourseDay): Set<string> {
  const types = new Set<string>();
  for (const mod of day.modules) {
    if (mod.erMaltid && mod.maltid?.forplejning) {
      types.add(mod.maltid.forplejning);
    }
    if (isHeldagsturModule(mod) && mod.heldagstur) {
      for (const punkt of mod.heldagstur.punkter) {
        if (punkt.type === "maltid" && punkt.maltid?.forplejning) {
          types.add(punkt.maltid.forplejning);
        }
      }
    }
  }
  return types;
}

function requirementMet(req: MealRequirement, present: Set<string>): boolean {
  const needed = Array.isArray(req.types) ? req.types : [req.types];
  return needed.some((t) => present.has(t));
}

function fullDayRequirements(isLastDay: boolean): MealRequirement[] {
  return [
    { types: "Morgenmad", label: "Morgenmad" },
    { types: "Formiddag", label: "Formiddag (mellemmåltid)" },
    { types: "Frokost", label: "Frokost" },
    ...(isLastDay
      ? []
      : [{ types: "Eftermiddag" as ForplejningType, label: "Eftermiddag (mellemmåltid)" }]),
    { types: "Aftensmad", label: "Aftensmad" },
  ];
}

function heldagsturDayRequirements(): MealRequirement[] {
  return [
    { types: "Morgenmad", label: "Morgenmad" },
    {
      types: ["Frokost", "Madpakker"],
      label: "Frokost eller madpakker (heldagstur)",
    },
    { types: "Aftensmad", label: "Aftensmad" },
  ];
}

function getDayRequirements(
  profile: KitchenRuleProfile,
  dayIndex: number,
  totalDays: number,
  day: CourseDay,
): MealRequirement[] {
  const isLastDay = dayIndex === totalDays - 1;
  const isFirstDay = dayIndex === 0;

  if (dayHasHeldagstur(day)) {
    return heldagsturDayRequirements();
  }

  switch (profile) {
    case "standard_5d":
    case "generic":
      if (totalDays >= 4) {
        return fullDayRequirements(isLastDay);
      }
      if (totalDays === 1) {
        return [
          { types: "Morgenmad", label: "Morgenmad" },
          { types: "Frokost", label: "Frokost" },
        ];
      }
      return fullDayRequirements(isLastDay);

    case "weekend_2d":
      if (isFirstDay) {
        return [
          { types: "Morgenmad", label: "Morgenmad" },
          { types: "Formiddag", label: "Formiddag (mellemmåltid)" },
          { types: "Frokost", label: "Frokost" },
          { types: "Aftensmad", label: "Aftensmad" },
        ];
      }
      return [
        { types: "Morgenmad", label: "Morgenmad" },
        { types: "Frokost", label: "Frokost" },
      ];

    case "kort_3d":
      if (isLastDay) {
        return [
          { types: "Morgenmad", label: "Morgenmad" },
          { types: "Frokost", label: "Frokost" },
        ];
      }
      return fullDayRequirements(false);

    default:
      return fullDayRequirements(isLastDay);
  }
}

export function validateKitchenPlan(course: Course): KitchenPlanValidation {
  const merged = mergeCoursePlan(course);
  const profile = resolveKitchenRuleProfile(merged);
  const warnings: KitchenPlanWarning[] = [];

  if (merged.days.length === 0 || getMealRowsFromCourse(merged).length === 0) {
    return {
      ok: false,
      warnings: [
        {
          dayLabel: "—",
          dayDate: "",
          missing: "Ingen måltidsmoduler i programmet",
          forplejning: "Morgenmad",
        },
      ],
      profile,
      profileLabel: profileLabels[profile],
    };
  }

  for (let i = 0; i < merged.days.length; i++) {
    const day = merged.days[i];
    const present = collectDayForplejning(day);
    const requirements = getDayRequirements(
      profile,
      i,
      merged.days.length,
      day,
    );

    for (const req of requirements) {
      if (!requirementMet(req, present)) {
        warnings.push({
          dayLabel: day.label,
          dayDate: day.date,
          missing: req.label,
          forplejning: req.types,
        });
      }
    }
  }

  return {
    ok: warnings.length === 0,
    warnings,
    profile,
    profileLabel: profileLabels[profile],
  };
}

export function canSendKitchenPlan(course: Course): boolean {
  if (!validateKitchenPlan(course).ok) return false;
  return allKitchenModulesReady(course);
}
