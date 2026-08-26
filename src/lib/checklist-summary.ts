import type { Course } from "./mock-data";
import {
  getAllModules,
  getIncompleteModules,
  getUnreadyModules,
} from "./mock-data";
import {
  allKitchenModulesReady,
  getKitchenModuleRefs,
  getUnreadyKitchenModules,
} from "./kitchen-utils";
import { loadKitchenSent } from "./kitchen-storage";
import { validateKitchenPlan } from "./kitchen-plan-rules";

export interface ChecklistItemSummary {
  id: string;
  label: string;
  done: boolean;
  hint: string;
  urgent?: boolean;
}

export interface ChecklistSummary {
  items: ChecklistItemSummary[];
  doneCount: number;
  totalCount: number;
  allDone: boolean;
  missingLabels: string[];
}

export function buildChecklistSummary(course: Course): ChecklistSummary {
  const checklist = course.checklist;
  const allModules = getAllModules(course);
  const unreadyModules = getUnreadyModules(course);
  const incompleteModules = getIncompleteModules(course);
  const kitchenModules = getKitchenModuleRefs(course);
  const unreadyKitchenModules = getUnreadyKitchenModules(course);
  const kitchenValidation = validateKitchenPlan(course);
  loadKitchenSent(course.id);

  const allModulesReady =
    allModules.length > 0 && unreadyModules.length === 0;

  const daysUntilStart = Math.ceil(
    (new Date(course.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const welcomeReminderDue = daysUntilStart <= 21 && daysUntilStart > 0;

  const items: ChecklistItemSummary[] = [
    {
      id: "program",
      label: "Kursusprogram planlagt",
      done: checklist.programPlanned,
      hint: "Markér færdig når alle moduler er udfyldt",
    },
    {
      id: "modules-ready",
      label: "Alle moduler klar",
      done: allModulesReady,
      hint: `${allModules.length - unreadyModules.length}/${allModules.length} moduler meldt klar`,
    },
    {
      id: "modules-filled",
      label: "Alle moduler udfyldt",
      done: allModules.length > 0 && incompleteModules.length === 0,
      hint: `${allModules.length - incompleteModules.length}/${allModules.length} moduler udfyldt`,
    },
    {
      id: "economy",
      label: "Økonomi godkendt",
      done: checklist.economyStatus === "approved",
      hint:
        checklist.economyStatus === "approved"
          ? "Godkendt af bogholder"
          : checklist.economyStatus === "sent"
            ? "Afventer bogholder"
            : "Send økonomiforslag til bogholder",
    },
    {
      id: "kmr",
      label: "Billeder uploadet til KMR",
      done: checklist.kmrImagesUploaded,
      hint: checklist.kmrImageCount
        ? `${checklist.kmrImageCount} billeder uploadet`
        : "Upload til markedsføringsafdelingen",
    },
    {
      id: "website",
      label: "Tekst til hjemmesiden klar",
      done: checklist.websiteTextDone,
      hint: "Tekst der vises over programmet på hjemmesiden",
    },
    {
      id: "kitchen",
      label: "Køkkenplan udfyldt",
      done: checklist.kitchenPlanSent,
      hint:
        kitchenModules.length === 0
          ? "Ingen måltidsmoduler i programmet endnu"
          : !kitchenValidation.ok
            ? `${kitchenValidation.warnings.length} mangler ift. standard`
            : checklist.kitchenPlanSent
              ? `Sendt til køkken · ${kitchenModules.length} måltider godkendt`
              : `${kitchenModules.length - unreadyKitchenModules.length}/${kitchenModules.length} køkkenmoduler godkendt`,
    },
    {
      id: "pedel",
      label: "Pedelplan udfyldt",
      done: checklist.pedelPlanSent,
      hint: "Ønsker til lokaleopsætning",
    },
    {
      id: "welcome",
      label: "Sendt velkomstbrev",
      done: checklist.welcomeLetterSent,
      hint: welcomeReminderDue
        ? `Påmindelse: ${daysUntilStart} dage til kursus — send nu`
        : "Skabelon redigeres og sendes 3 uger før",
      urgent: welcomeReminderDue && !checklist.welcomeLetterSent,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const missingLabels = items.filter((i) => !i.done).map((i) => i.label);

  return {
    items,
    doneCount,
    totalCount: items.length,
    allDone: doneCount === items.length,
    missingLabels,
  };
}
