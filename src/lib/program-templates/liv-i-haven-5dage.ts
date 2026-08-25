import type { CourseModule, ModuleTiming } from "../mock-data";
import { defaultMealDetails, defaultLokaleSpec } from "../mock-data";
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

export const programTemplates: ProgramTemplate[] = [programUbak5Dage];

export function getTemplateForDayCount(days: number): ProgramTemplate | undefined {
  return programTemplates.find((t) => t.dayCount === days);
}

export function templateRowToModule(
  row: TemplateModuleRow,
  index: number,
): CourseModule {
  return {
    id: `mod-${Date.now()}-${index}`,
    source: "skabelon",
    underviser: row.rolle === "Foredragsholder" ? "" : row.rolle,
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
      ? defaultMealDetails({
          forplejning: inferForplejningFromTitle(row.overskrift),
          specifikation: inferSpecifikationFromTitle(row.overskrift),
        })
      : undefined,
    lokaleSpec: row.erMaltid ? undefined : defaultLokaleSpec(),
    klar: false,
  };
}
