export type RengoringNoteTargetType = "vaerelse" | "lokale";

export interface RengoringNote {
  type: RengoringNoteTargetType;
  targetKey: string;
  note: string;
  updatedAt: string;
  updatedByUserId?: string;
}

const STORAGE_KEY = "brandbjerg-rengoring-notes";
export const RENGORING_NOTES_UPDATED_EVENT = "brandbjerg-rengoring-notes-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(RENGORING_NOTES_UPDATED_EVENT));
  }
}

function noteKey(type: RengoringNoteTargetType, targetKey: string): string {
  return `${type}|${targetKey}`;
}

function loadAll(): Record<string, RengoringNote> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, RengoringNote>;
  } catch {
    return {};
  }
}

function saveAll(notes: Record<string, RengoringNote>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  emitUpdate();
}

export function getRengoringNote(
  type: RengoringNoteTargetType,
  targetKey: string,
): string {
  return loadAll()[noteKey(type, targetKey)]?.note ?? "";
}

export function hasRengoringNote(
  type: RengoringNoteTargetType,
  targetKey: string,
): boolean {
  return Boolean(getRengoringNote(type, targetKey).trim());
}

export function saveRengoringNote(
  type: RengoringNoteTargetType,
  targetKey: string,
  note: string,
  updatedByUserId?: string,
): void {
  const all = loadAll();
  const key = noteKey(type, targetKey);
  const trimmed = note.trim();

  if (!trimmed) {
    delete all[key];
  } else {
    all[key] = {
      type,
      targetKey,
      note: trimmed,
      updatedAt: new Date().toISOString(),
      updatedByUserId,
    };
  }

  saveAll(all);
}

export function loadAllRengoringNotes(): RengoringNote[] {
  return Object.values(loadAll()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}
