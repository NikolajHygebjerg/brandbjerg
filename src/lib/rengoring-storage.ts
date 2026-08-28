const VAERELSER_KEY = "brandbjerg-rengoring-vaerelser";
const LOKALER_KEY = "brandbjerg-rengoring-lokaler";
export const RENGORING_UPDATED_EVENT = "brandbjerg-rengoring-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(RENGORING_UPDATED_EVENT));
  }
}

function vaerelseKey(roomNumber: string, date: string): string {
  return `${roomNumber}-${date}`;
}

function lokaleKey(id: string): string {
  return id;
}

type KlarStore = Record<string, boolean>;

function loadStore(key: string): KlarStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) as KlarStore;
  } catch {
    return {};
  }
}

function saveStore(key: string, store: KlarStore): void {
  localStorage.setItem(key, JSON.stringify(store));
  emitUpdate();
}

export function isVaerelseKlar(roomNumber: string, date: string): boolean {
  return Boolean(loadStore(VAERELSER_KEY)[vaerelseKey(roomNumber, date)]);
}

export function setVaerelseKlar(
  roomNumber: string,
  date: string,
  klar: boolean,
): void {
  const store = loadStore(VAERELSER_KEY);
  const k = vaerelseKey(roomNumber, date);
  if (klar) store[k] = true;
  else delete store[k];
  saveStore(VAERELSER_KEY, store);
}

export function getLatestVaerelseKlarDate(
  roomNumber: string,
  beforeDate: string,
): string | null {
  const store = loadStore(VAERELSER_KEY);
  const prefix = `${roomNumber}-`;
  let latest: string | null = null;
  for (const [key, klar] of Object.entries(store)) {
    if (!klar || !key.startsWith(prefix)) continue;
    const date = key.slice(prefix.length);
    if (date < beforeDate && (!latest || date > latest)) latest = date;
  }
  return latest;
}

export function isLokaleKlar(lokaleId: string): boolean {
  return Boolean(loadStore(LOKALER_KEY)[lokaleKey(lokaleId)]);
}

export function setLokaleKlar(lokaleId: string, klar: boolean): void {
  const store = loadStore(LOKALER_KEY);
  const k = lokaleKey(lokaleId);
  if (klar) store[k] = true;
  else delete store[k];
  saveStore(LOKALER_KEY, store);
}
