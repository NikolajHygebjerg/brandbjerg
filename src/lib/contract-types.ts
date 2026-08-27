export type ContractStatus = "kladde" | "sendt" | "returneret" | "faerdig";

export type HonorarType = "A" | "B" | "faktura" | "";

/** Gemt samarbejdspartner til genbrug */
export interface ContractPerson {
  id: string;
  navn: string;
  email: string;
  telefon: string;
  adresse: string;
  cprCvr: string;
  bank: string;
  regKontonr: string;
  createdAt: string;
  updatedAt: string;
}

/** Udfyldelige felter — matcher Brandbjerg-kontrakten */
export interface ContractFields {
  navn: string;
  telefon: string;
  adresse: string;
  email: string;
  cprCvr: string;
  bank: string;
  regKontonr: string;
  ugenummer: string;
  kursustitel: string;
  datoTidsramme: string;
  antalTimerHonorar: string;
  indhold: string;
  honorarType: HonorarType;
  aIndkomstHonorar: string;
  bIndkomstHonorar: string;
  fakturaHonorar: string;
  daekkerTransport: boolean;
  transportKm: string;
  broafgift: boolean;
  medbringerComputer: boolean;
  skalBrugesProjektor: boolean;
  andetNoter: string;
  samtykkeFotos: boolean;
  kontaktperson: string;
}

export interface ContractSignature {
  dataUrl: string;
  signedAt: string;
  signedByName: string;
}

export interface Contract {
  id: string;
  accessToken: string;
  status: ContractStatus;
  personId: string;
  fields: ContractFields;
  courseId?: string;
  courseTitle?: string;
  moduleId?: string;
  moduleLabel?: string;
  leaderId: string;
  leaderName: string;
  leaderEmail: string;
  leaderSignature?: ContractSignature;
  partnerSignature?: ContractSignature;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  returnedAt?: string;
}

export const contractStatusLabels: Record<ContractStatus, string> = {
  kladde: "Kladde",
  sendt: "Sendt til foredragsholder",
  returneret: "Returneret",
  faerdig: "Færdig",
};
