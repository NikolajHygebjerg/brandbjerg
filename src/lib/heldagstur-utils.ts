import type { MealDetails } from "./mock-data";
import { defaultMealDetails } from "./mock-data";

export type HeldagsturPunktType = "bus" | "besoeg" | "maltid";

export interface HeldagsturKontrakt {
  filnavn: string;
  uploadedAt: string;
}

export interface HeldagsturBus {
  pris: number;
  kontrakt?: HeldagsturKontrakt;
}

export interface HeldagsturBesoeg {
  overskrift: string;
  broedtekst: string;
  kontaktperson: string;
  kontaktTelefon: string;
  pris: number;
  noter: string;
  kontrakt?: HeldagsturKontrakt;
}

export interface HeldagsturPunkt {
  id: string;
  type: HeldagsturPunktType;
  tidFra: string;
  tidTil: string;
  klar: boolean;
  bus?: HeldagsturBus;
  besoeg?: HeldagsturBesoeg;
  maltid?: MealDetails;
}

export interface HeldagsturPlan {
  punkter: HeldagsturPunkt[];
}

export const heldagsturPunktLabels: Record<HeldagsturPunktType, string> = {
  bus: "Bus",
  besoeg: "Besøg",
  maltid: "Måltid",
};

export function createHeldagsturPunkt(type: HeldagsturPunktType): HeldagsturPunkt {
  const base = {
    id: `ht-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    tidFra: "09:00",
    tidTil: "10:00",
    klar: false,
  };

  if (type === "bus") {
    return { ...base, bus: { pris: 0 } };
  }
  if (type === "besoeg") {
    return {
      ...base,
      besoeg: {
        overskrift: "",
        broedtekst: "",
        kontaktperson: "",
        kontaktTelefon: "",
        pris: 0,
        noter: "",
      },
    };
  }
  return {
    ...base,
    maltid: defaultMealDetails({
      forplejning: "Madpakker",
      specifikation: "Almindelig",
    }),
  };
}

export function defaultHeldagsturPlan(): HeldagsturPlan {
  return { punkter: [] };
}

export function punktDisplayTitle(punkt: HeldagsturPunkt): string {
  if (punkt.type === "bus") return "Bus";
  if (punkt.type === "besoeg") {
    return punkt.besoeg?.overskrift?.trim() || "Besøg";
  }
  return punkt.maltid?.forplejning || "Madpakker";
}

export function allHeldagsturPunkterKlar(punkter: HeldagsturPunkt[]): boolean {
  return punkter.length > 0 && punkter.every((p) => p.klar);
}

export function anyHeldagsturPunktUklar(punkter: HeldagsturPunkt[]): boolean {
  return punkter.some((p) => !p.klar);
}

export function handleKontraktUpload(
  file: File,
  onSet: (kontrakt: HeldagsturKontrakt) => void,
) {
  onSet({
    filnavn: file.name,
    uploadedAt: new Date().toISOString(),
  });
}
