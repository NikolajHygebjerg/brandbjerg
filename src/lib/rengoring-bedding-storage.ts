import { syncBeddingOnRoomForRoom } from "./kontor-bedding-utils";

const BEDDING_KEY = "brandbjerg-rengoring-bedding";
export const RENGORING_BEDDING_UPDATED_EVENT =
  "brandbjerg-rengoring-bedding-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(RENGORING_BEDDING_UPDATED_EVENT));
  }
}

function roomDateKey(roomNumber: string, date: string): string {
  return `${roomNumber}-${date}`;
}

type BeddingStore = Record<string, boolean>;

function loadStore(): BeddingStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(BEDDING_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as BeddingStore;
  } catch {
    return {};
  }
}

function saveStore(store: BeddingStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BEDDING_KEY, JSON.stringify(store));
  emitUpdate();
}

export function isBeddingPlacedOnRoom(
  roomNumber: string,
  date: string,
): boolean {
  return Boolean(loadStore()[roomDateKey(roomNumber, date)]);
}

export function setBeddingPlacedOnRoom(
  roomNumber: string,
  date: string,
  placed: boolean,
): void {
  const store = loadStore();
  const k = roomDateKey(roomNumber, date);
  if (placed) store[k] = true;
  else delete store[k];
  saveStore(store);
  syncBeddingOnRoomForRoom(roomNumber, date, placed);
}
