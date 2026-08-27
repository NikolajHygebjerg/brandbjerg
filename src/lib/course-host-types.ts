import type { ModuleLon, TeacherType } from "./mock-data";

/** Manuelt oprettet kursusvært med kontrakt — som foredragsholder-modul */
export interface CourseHostEntry {
  id: string;
  navn: string;
  email: string;
  underviserType: TeacherType;
  pris: number;
  lon: ModuleLon;
  overskrift: string;
  broedtekst: string;
  tidFra: string;
  tidTil: string;
  datoTidsramme: string;
  interneNoter: string;
  contractId?: string;
}

export function defaultCourseHostEntry(
  partial: Partial<CourseHostEntry> = {},
): CourseHostEntry {
  return {
    id: crypto.randomUUID(),
    navn: "",
    email: "",
    underviserType: "ekstern",
    pris: 0,
    lon: "",
    overskrift: "Kursusvært",
    broedtekst: "",
    tidFra: "",
    tidTil: "",
    datoTidsramme: "",
    interneNoter: "",
    ...partial,
  };
}

export function hostEntryToContractSource(entry: CourseHostEntry) {
  return {
    navn: entry.navn,
    email: entry.email,
    lon: entry.lon,
    pris: entry.pris,
    overskrift: entry.overskrift,
    broedtekst: entry.broedtekst,
    tidFra: entry.tidFra,
    tidTil: entry.tidTil,
    datoTidsramme: entry.datoTidsramme,
    contractId: entry.contractId,
  };
}
