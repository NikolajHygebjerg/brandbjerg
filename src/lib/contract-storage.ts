import type { Contract, ContractPerson } from "./contract-types";

const PEOPLE_KEY = "brandbjerg-contract-people";
const CONTRACTS_KEY = "brandbjerg-contracts";
export const CONTRACTS_UPDATED_EVENT = "brandbjerg-contracts-updated";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONTRACTS_UPDATED_EVENT));
  }
}

function loadPeopleMap(): Record<string, ContractPerson> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, ContractPerson>>(localStorage.getItem(PEOPLE_KEY)) ?? {};
}

function savePeopleMap(all: Record<string, ContractPerson>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PEOPLE_KEY, JSON.stringify(all));
  emitUpdate();
}

function loadContractsMap(): Record<string, Contract> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, Contract>>(localStorage.getItem(CONTRACTS_KEY)) ?? {};
}

function saveContractsMap(all: Record<string, Contract>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(all));
  emitUpdate();
}

export function listContractPeople(): ContractPerson[] {
  return Object.values(loadPeopleMap()).sort((a, b) =>
    a.navn.localeCompare(b.navn, "da"),
  );
}

export function searchContractPeople(query: string): ContractPerson[] {
  const q = query.trim().toLowerCase();
  if (!q) return listContractPeople();
  return listContractPeople().filter(
    (p) =>
      p.navn.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q),
  );
}

export function getContractPerson(id: string): ContractPerson | null {
  return loadPeopleMap()[id] ?? null;
}

export function upsertContractPerson(
  input: Omit<ContractPerson, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  },
): ContractPerson {
  const all = loadPeopleMap();
  const now = new Date().toISOString();
  const emailKey = input.email.trim().toLowerCase();
  const existing = Object.values(all).find(
    (p) => p.email.trim().toLowerCase() === emailKey,
  );
  const id = input.id ?? existing?.id ?? crypto.randomUUID();
  const record: ContractPerson = {
    id,
    navn: input.navn.trim(),
    email: input.email.trim(),
    telefon: input.telefon.trim(),
    adresse: input.adresse.trim(),
    cprCvr: input.cprCvr.trim(),
    bank: input.bank.trim(),
    regKontonr: input.regKontonr.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  all[id] = record;
  savePeopleMap(all);
  return record;
}

export function listContracts(): Contract[] {
  return Object.values(loadContractsMap()).sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function getContract(id: string): Contract | null {
  return loadContractsMap()[id] ?? null;
}

export function getContractByToken(token: string): Contract | null {
  return (
    Object.values(loadContractsMap()).find((c) => c.accessToken === token) ??
    null
  );
}

export function listContractsForPerson(personId: string): Contract[] {
  return listContracts().filter((c) => c.personId === personId);
}

export function saveContract(contract: Contract): Contract {
  const all = loadContractsMap();
  all[contract.id] = contract;
  saveContractsMap(all);
  return contract;
}

export function deleteContract(id: string): void {
  const all = loadContractsMap();
  delete all[id];
  saveContractsMap(all);
}
