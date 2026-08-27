import type { CourseModule, ModuleTiming } from "../mock-data";
import { defaultMealDetails, defaultLokaleSpec } from "../mock-data";
import { defaultTemplateHeldagsturPlan } from "../heldagstur-utils";
import {
  inferForplejningFromTitle,
  inferSpecifikationFromTitle,
} from "../kitchen-options";

/** Modul-række fra Program_UBAK (Excel) — Uge 35 Liv i haven */
export interface TemplateModuleRow {
  tidFra: string;
  tidTil: string;
  overskrift: string;
  rolle: string;
  underviserType: "intern" | "ekstern";
  timing: ModuleTiming;
  lon: "A" | "B" | "";
  erMaltid?: boolean;
  erHeldagstur?: boolean;
  broedtekst?: string;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  sheetName: string;
  dayCount: number;
  sourceFile: string;
  weekdayLabels: string[];
  days: TemplateModuleRow[][];
}

function aftenRow(): TemplateModuleRow {
  return {
    tidFra: "20:30",
    tidTil: "21:00",
    overskrift: "Aften",
    rolle: "Køkken",
    underviserType: "intern",
    timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
    lon: "",
    erMaltid: true,
  };
}

function mellemmaltidRow(
  overskrift: "Formiddag" | "Eftermiddag",
  tidFra: string,
  tidTil: string,
): TemplateModuleRow {
  return {
    tidFra,
    tidTil,
    overskrift,
    rolle: "Køkken",
    underviserType: "intern",
    timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
    lon: "",
    erMaltid: true,
  };
}

/** Program_UBAK — 5 dages skabelon (Uge 35: Liv i haven) */
export const programUbak5Dage: ProgramTemplate = {
  id: "program-ubak-5d",
  name: "Program_UBAK — 5 dages kursus",
  sheetName: "Program_UBAK",
  dayCount: 5,
  sourceFile: "Uge 35 - Program_UBAK",
  weekdayLabels: ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag"],
  days: [
    // Mandag
    [
      {
        tidFra: "07:30",
        tidTil: "08:30",
        overskrift: "Morgenmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "08:30",
        tidTil: "09:00",
        overskrift: "Morgensamling",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "09:30",
        tidTil: "12:00",
        overskrift: "Ankomst og indkvartering",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "11:30",
        tidTil: "12:15",
        overskrift: "Velkomst",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 45, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      mellemmaltidRow("Formiddag", "10:30", "11:00"),
      {
        tidFra: "12:30",
        tidTil: "13:30",
        overskrift: "Frokost",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "13:30",
        tidTil: "14:45",
        overskrift: "Rundvisning",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 45, ft: 0, pts: 45, bh: 0 },
        lon: "A",
      },
      mellemmaltidRow("Eftermiddag", "15:00", "15:30"),
      {
        tidFra: "15:00",
        tidTil: "17:00",
        overskrift: "Foredrag",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "18:00",
        tidTil: "19:00",
        overskrift: "Aftensmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "19:30",
        tidTil: "21:00",
        overskrift: "Foredrag",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      aftenRow(),
    ],
    // Tirsdag
    [
      {
        tidFra: "07:30",
        tidTil: "08:30",
        overskrift: "Morgenmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "08:30",
        tidTil: "09:00",
        overskrift: "Morgensamling",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "08:30",
        tidTil: "17:00",
        overskrift: "Heldagstur",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
        erHeldagstur: true,
        broedtekst: "Heldagsudflugt — frokost undervejs",
      },
      {
        tidFra: "18:00",
        tidTil: "19:00",
        overskrift: "Aftensmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "19:30",
        tidTil: "21:00",
        overskrift: "Foredrag",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 30, ft: 60, pts: 0, bh: 0 },
        lon: "A",
      },
      aftenRow(),
    ],
    // Onsdag
    [
      {
        tidFra: "07:30",
        tidTil: "08:30",
        overskrift: "Morgenmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "08:30",
        tidTil: "09:00",
        overskrift: "Morgensamling",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      mellemmaltidRow("Formiddag", "10:30", "11:00"),
      {
        tidFra: "09:30",
        tidTil: "12:00",
        overskrift: "Foredrag",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "12:30",
        tidTil: "13:30",
        overskrift: "Frokost",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      mellemmaltidRow("Eftermiddag", "15:00", "15:30"),
      {
        tidFra: "18:00",
        tidTil: "19:00",
        overskrift: "Aftensmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "19:30",
        tidTil: "21:00",
        overskrift: "Foredrag",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      aftenRow(),
    ],
    // Torsdag
    [
      {
        tidFra: "07:30",
        tidTil: "08:30",
        overskrift: "Morgenmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "08:30",
        tidTil: "09:00",
        overskrift: "Morgensamling",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      mellemmaltidRow("Formiddag", "10:30", "11:00"),
      {
        tidFra: "09:30",
        tidTil: "12:00",
        overskrift: "Foredrag",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "11:15",
        tidTil: "12:00",
        overskrift: "Foredrag",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "12:30",
        tidTil: "13:30",
        overskrift: "Frokost",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      mellemmaltidRow("Eftermiddag", "15:00", "15:30"),
      {
        tidFra: "14:00",
        tidTil: "16:00",
        overskrift: "Foredrag",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "18:00",
        tidTil: "19:00",
        overskrift: "Aftensmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "19:30",
        tidTil: "21:00",
        overskrift: "Foredrag",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      aftenRow(),
    ],
    // Fredag
    [
      {
        tidFra: "07:30",
        tidTil: "08:30",
        overskrift: "Morgenmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "08:30",
        tidTil: "09:00",
        overskrift: "Morgensamling",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      mellemmaltidRow("Formiddag", "10:30", "11:00"),
      {
        tidFra: "09:15",
        tidTil: "11:00",
        overskrift: "Foredrag",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "11:15",
        tidTil: "12:00",
        overskrift: "Ugeafslutning",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "12:30",
        tidTil: "13:30",
        overskrift: "Frokost",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "13:00",
        tidTil: "14:00",
        overskrift: "Farvel og tak",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "17:00",
        tidTil: "18:00",
        overskrift: "Festforberedelser",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "18:00",
        tidTil: "19:00",
        overskrift: "Aftensmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "18:30",
        tidTil: "21:00",
        overskrift: "Festaften",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "A",
      },
    ],
  ],
};

/** Weekendkursus — 2 dages skabelon */
export const weekend2Dage: ProgramTemplate = {
  id: "weekend-2d",
  name: "Weekendkursus — 2 dage",
  sheetName: "Program_weekend",
  dayCount: 2,
  sourceFile: "weekendkursus-2dage.csv",
  weekdayLabels: ["Lørdag", "Søndag"],
  days: [
    [
      {
        tidFra: "09:00",
        tidTil: "10:00",
        overskrift: "Morgenmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "10:00",
        tidTil: "12:30",
        overskrift: "Introduktion og workshop",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 90, ft: 60, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "12:30",
        tidTil: "13:30",
        overskrift: "Frokost",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "14:00",
        tidTil: "17:00",
        overskrift: "Praktisk forløb",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 120, ft: 60, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "18:00",
        tidTil: "19:00",
        overskrift: "Aftensmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      aftenRow(),
    ],
    [
      {
        tidFra: "08:30",
        tidTil: "09:30",
        overskrift: "Morgenmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "09:30",
        tidTil: "12:00",
        overskrift: "Foredrag og opsamling",
        rolle: "Foredragsholder",
        underviserType: "ekstern",
        timing: { ubak: 60, ft: 90, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "12:30",
        tidTil: "13:00",
        overskrift: "Farvel",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 0, ft: 30, pts: 0, bh: 0 },
        lon: "A",
      },
    ],
  ],
};

/** Kort kursus — 3 dages skabelon */
export const kort3Dage: ProgramTemplate = {
  id: "kort-3d",
  name: "Kort kursus — 3 dage",
  sheetName: "Program_3d",
  dayCount: 3,
  sourceFile: "madkursus-3dage.csv",
  weekdayLabels: ["Fredag", "Lørdag", "Søndag"],
  days: [
    [
      {
        tidFra: "16:00",
        tidTil: "17:00",
        overskrift: "Ankomst og kaffe",
        rolle: "Vært",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 60, bh: 0 },
        lon: "",
      },
      {
        tidFra: "18:00",
        tidTil: "19:00",
        overskrift: "Aftensmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "19:30",
        tidTil: "21:00",
        overskrift: "Introduktion",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 45, ft: 45, pts: 0, bh: 0 },
        lon: "A",
      },
    ],
    [
      {
        tidFra: "08:00",
        tidTil: "09:00",
        overskrift: "Morgenmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "09:30",
        tidTil: "12:00",
        overskrift: "Workshop",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 90, ft: 60, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "12:30",
        tidTil: "13:30",
        overskrift: "Frokost",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "14:00",
        tidTil: "17:00",
        overskrift: "Praktisk forløb",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 120, ft: 60, pts: 0, bh: 0 },
        lon: "A",
      },
      aftenRow(),
    ],
    [
      {
        tidFra: "08:00",
        tidTil: "09:00",
        overskrift: "Morgenmad",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
      {
        tidFra: "09:30",
        tidTil: "11:30",
        overskrift: "Afslutning og evaluering",
        rolle: "Kursusleder",
        underviserType: "intern",
        timing: { ubak: 60, ft: 60, pts: 0, bh: 0 },
        lon: "A",
      },
      {
        tidFra: "12:00",
        tidTil: "13:00",
        overskrift: "Frokost og farvel",
        rolle: "Køkken",
        underviserType: "intern",
        timing: { ubak: 0, ft: 0, pts: 0, bh: 0 },
        lon: "",
        erMaltid: true,
      },
    ],
  ],
};

export const defaultProgramTemplates: ProgramTemplate[] = [
  programUbak5Dage,
  weekend2Dage,
  kort3Dage,
];

/** @deprecated Brug listTemplates() fra template-storage */
export const programTemplates = defaultProgramTemplates;

export function templateRowToModule(
  row: TemplateModuleRow,
  index: number,
): CourseModule {
  return {
    id: `mod-${Date.now()}-${index}`,
    source: "skabelon",
    underviser: row.rolle === "Foredragsholder" ? "" : row.rolle,
    underviserEmail: "",
    underviserType: row.underviserType,
    rolle: row.rolle,
    pris: 0,
    overskrift: row.overskrift,
    broedtekst: row.broedtekst ?? "",
    tidFra: row.tidFra,
    tidTil: row.tidTil,
    interneNoter: "",
    timing: { ...row.timing },
    lon: row.lon,
    erMaltid: row.erMaltid ?? false,
    maltid: row.erMaltid
      ? defaultMealDetails(
          row.overskrift === "Aften"
            ? {
                forplejning: "Aften",
                specifikation: "Almindelig",
                lokale: "L. spisesal",
              }
            : {
                forplejning: inferForplejningFromTitle(row.overskrift),
                specifikation: inferSpecifikationFromTitle(row.overskrift),
              },
        )
      : undefined,
    lokaleSpec: row.erMaltid ? undefined : defaultLokaleSpec(),
    erHeldagstur: row.erHeldagstur ?? row.overskrift.toLowerCase() === "heldagstur",
    heldagstur:
      row.erHeldagstur || row.overskrift.toLowerCase() === "heldagstur"
        ? defaultTemplateHeldagsturPlan()
        : undefined,
    klar: false,
  };
}
