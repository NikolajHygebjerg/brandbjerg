import type { User } from "./auth-types";
import type {
  Contract,
  ContractFields,
  ContractPerson,
  ContractSignature,
  HonorarType,
} from "./contract-types";
import { saveContract, upsertContractPerson } from "./contract-storage";
import type { Course, CourseModule } from "./mock-data";
import { moduleDurationMinutes, weekLabel } from "./mock-data";

export const DEFAULT_KONTAKTPERSON =
  "Maria Lya Leerbeck · 61 72 05 21 · ml@brandbjerg.dk";

export function defaultContractFields(): ContractFields {
  return {
    navn: "",
    telefon: "",
    adresse: "",
    email: "",
    cprCvr: "",
    bank: "",
    regKontonr: "",
    ugenummer: "",
    kursustitel: "",
    datoTidsramme: "",
    antalTimerHonorar: "",
    indhold: "",
    honorarType: "",
    aIndkomstHonorar: "",
    bIndkomstHonorar: "",
    fakturaHonorar: "",
    daekkerTransport: false,
    transportKm: "",
    broafgift: false,
    medbringerComputer: false,
    skalBrugesProjektor: false,
    andetNoter: "",
    samtykkeFotos: false,
    kontaktperson: DEFAULT_KONTAKTPERSON,
  };
}

export function fieldsFromPerson(
  person: ContractPerson,
  base: Partial<ContractFields> = {},
): ContractFields {
  return {
    ...defaultContractFields(),
    ...base,
    navn: person.navn,
    email: person.email,
    telefon: person.telefon,
    adresse: person.adresse,
    cprCvr: person.cprCvr,
    bank: person.bank,
    regKontonr: person.regKontonr,
  };
}

function honorarTypeFromLon(lon: string): HonorarType {
  if (lon === "A") return "A";
  if (lon === "B") return "B";
  return "faktura";
}

function applyHonorar(
  fields: ContractFields,
  type: HonorarType,
  amount: number,
): ContractFields {
  const next = { ...fields, honorarType: type };
  const label = amount > 0 ? String(amount) : "";
  if (type === "A") {
    next.aIndkomstHonorar = label;
    next.bIndkomstHonorar = "";
    next.fakturaHonorar = "";
  } else if (type === "B") {
    next.bIndkomstHonorar = label;
    next.aIndkomstHonorar = "";
    next.fakturaHonorar = "";
  } else {
    next.fakturaHonorar = amount > 0 ? label : "Underviser sender faktura";
    next.aIndkomstHonorar = "";
    next.bIndkomstHonorar = "";
  }
  return next;
}

export function prefillFromModule(
  course: Pick<Course, "title" | "weekNumber">,
  module: CourseModule,
  dayLabel: string,
): Partial<ContractFields> {
  const minutes = moduleDurationMinutes(module);
  const timer = minutes > 0 ? `${Math.round((minutes / 60) * 10) / 10} timer` : "";
  const honorarType = honorarTypeFromLon(module.lon);
  const honorarText =
    module.pris > 0 ? `honorar på ${module.pris} kr` : timer;

  let fields: ContractFields = {
    ...defaultContractFields(),
    navn: module.underviser,
    email: module.underviserEmail ?? "",
    ugenummer: `${weekLabel(course.weekNumber)} ${new Date().getFullYear()}`,
    kursustitel: course.title,
    datoTidsramme: `${dayLabel}: ${module.tidFra}–${module.tidTil}`,
    antalTimerHonorar: honorarText || timer,
    indhold: [module.overskrift, module.broedtekst].filter(Boolean).join("\n"),
    skalBrugesProjektor: module.lokaleSpec?.projektor ?? false,
  };

  fields = applyHonorar(fields, honorarType, module.pris);
  return fields;
}

export function contractPublicUrl(accessToken: string): string {
  if (typeof window === "undefined") {
    return `/kontrakt/${accessToken}`;
  }
  return `${window.location.origin}/kontrakt/${accessToken}`;
}

export function buildContractMailto(contract: Contract): string {
  const url = contractPublicUrl(contract.accessToken);
  const subject = `Kontrakt — ${contract.fields.kursustitel || contract.fields.navn} — Brandbjerg Højskole`;
  const body = [
    `Kære ${contract.fields.navn || "samarbejdspartner"}`,
    "",
    `${contract.leaderName} har sendt dig en kontrakt for samarbejde med Brandbjerg Højskole.`,
    "",
    "Åbn, udfyld og underskriv kontrakten her:",
    url,
    "",
    "Du kan rette alle felter og tilføje din underskrift, inden du sender den tilbage.",
    "",
    `Venlig hilsen`,
    contract.leaderName,
    "Brandbjerg Højskole",
  ].join("\n");

  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);
  if (contract.fields.email) {
    params.set("to", contract.fields.email);
  }
  return `mailto:${contract.leaderEmail}?${params.toString()}`;
}

export function createContract(input: {
  leader: Pick<User, "id" | "name" | "email">;
  fields: ContractFields;
  courseId?: string;
  courseTitle?: string;
  moduleId?: string;
  moduleLabel?: string;
}): Contract {
  const now = new Date().toISOString();
  const person = upsertContractPerson({
    navn: input.fields.navn,
    email: input.fields.email,
    telefon: input.fields.telefon,
    adresse: input.fields.adresse,
    cprCvr: input.fields.cprCvr,
    bank: input.fields.bank,
    regKontonr: input.fields.regKontonr,
  });

  const contract: Contract = {
    id: crypto.randomUUID(),
    accessToken: crypto.randomUUID().replace(/-/g, ""),
    status: "kladde",
    personId: person.id,
    fields: { ...input.fields },
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    moduleId: input.moduleId,
    moduleLabel: input.moduleLabel,
    leaderId: input.leader.id,
    leaderName: input.leader.name,
    leaderEmail: input.leader.email,
    createdAt: now,
    updatedAt: now,
  };

  return saveContract(contract);
}

export function updateContractFields(
  contract: Contract,
  fields: ContractFields,
): Contract {
  const person = upsertContractPerson({
    navn: fields.navn,
    email: fields.email,
    telefon: fields.telefon,
    adresse: fields.adresse,
    cprCvr: fields.cprCvr,
    bank: fields.bank,
    regKontonr: fields.regKontonr,
  });

  return saveContract({
    ...contract,
    personId: person.id,
    fields: { ...fields },
    updatedAt: new Date().toISOString(),
  });
}

export function signContractAsLeader(
  contract: Contract,
  signature: ContractSignature,
  fields: ContractFields,
): Contract {
  const updated = updateContractFields(contract, fields);
  return saveContract({
    ...updated,
    leaderSignature: signature,
    status: "sendt",
    sentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function returnContractFromPartner(
  contract: Contract,
  signature: ContractSignature,
  fields: ContractFields,
): Contract {
  const updated = updateContractFields(contract, fields);
  return saveContract({
    ...updated,
    partnerSignature: signature,
    status: "returneret",
    returnedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function duplicateContract(
  source: Contract,
  leader: Pick<User, "id" | "name" | "email">,
): Contract {
  return createContract({
    leader,
    fields: { ...source.fields },
    courseId: source.courseId,
    courseTitle: source.courseTitle,
    moduleId: source.moduleId,
    moduleLabel: source.moduleLabel,
  });
}

export const CONTRACT_TERMS = `Vilkår:
Vi glæder os rigtig meget til at tage imod dig på Brandbjerg Højskole. Alle undervisningslokaler på højskolen har lydanlæg, trådløse mikrofoner, projektor og lærred. Du medbringer som udgangspunkt selv pc og øvrigt relevant præsentationsmateriale. Husk adapter/dongle, hvis du anvender en mac eller anden enhed, der ikke kan kobles direkte til HDMI (billede og lyd) og Minijack (lyd). Har du brug for at låne en computer, hjælp til at printe eller andre behov, så noter det i aftalen her - under noter. Så finder vi en konkret løsning.

Transport:
Såfremt Brandbjerg betaler kørsel, sker det til statens lave km-takst uanset transportform. Ved broafgift kræves bilag.

Ændringer af aftalen:
Hvis der opstår behov for at ændre på aftalen, kontakter vi hinanden og opdaterer dette dokument.

Aflysning:
Skulle vi på Brandbjerg mod forventning have brug for at aflyse, sker det hurtigst muligt, efter beslutningen er taget, og senest tre uger inden arrangementet. I tilfælde af aflysning tidligere end tre uger inden afholdelse udbetales ingen løn. Sammen bestræber vi os på at finde en fornuftig løsning for begge parter – fx ved at finde en ny dato til afholdelse, eller lignende. I tilfælde af sygdom eller akutte opståede problemer, der forhindrer dig i at gennemføre, skal Brandbjerg Højskole og kontaktpersonen i dokumentet kontaktes telefonisk hurtigst muligt.

Betaling:
Honoraret udbetales efter arrangementets afholdelse på foredragsholders bankkonto. Hvor honoraret udbetales som A-indkomst eller B-indkomst, sker det sammen med den generelle lønkørsel på Brandbjerg Højskole - dvs. den sidste bankdag i måneden. Honorar for arrangementer afviklet efter d. 20. i måneden, udbetales sammen med den efterfølgende måneds lønkørsel.

Deling på sociale medier ifbm. besøget:
Det er tilladt at dele billeder og opslag på egne sociale medier i forbindelse med besøget. Det er i den forbindelse kun tilladt at bruge tagget "Brandbjerg Højskole" medmindre andet aftales med kursuslederen.

GDPR:
Brandbjerg Højskole gør opmærksom på, at persondata i denne kontrakt opbevares og gemmes - udelukkende til internt brug. Kontrakten slettes 5 år efter afviklingsdatoen.`;
