import type { RengoringNoteTargetType } from "./rengoring-notes-storage";

export interface PedelNotification {
  id: string;
  message: string;
  type: RengoringNoteTargetType;
  targetKey: string;
  targetLabel: string;
  senderUserId: string;
  senderName: string;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = "brandbjerg-pedel-notifications";
export const PEDEL_NOTIFICATIONS_UPDATED_EVENT =
  "brandbjerg-pedel-notifications-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PEDEL_NOTIFICATIONS_UPDATED_EVENT));
  }
}

function loadAll(): PedelNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PedelNotification[];
  } catch {
    return [];
  }
}

function saveAll(notifications: PedelNotification[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  emitUpdate();
}

export function formatPedelNotificationMessage(
  type: RengoringNoteTargetType,
  targetKey: string,
  text: string,
): string {
  const trimmed = text.trim();
  if (type === "vaerelse") {
    return `På værelse ${targetKey} ${trimmed}`;
  }
  const lokaleName = targetKey.startsWith("lokale:")
    ? targetKey.slice("lokale:".length)
    : targetKey;
  return `I lokale ${lokaleName} ${trimmed}`;
}

export function sendPedelNotification(input: {
  type: RengoringNoteTargetType;
  targetKey: string;
  targetLabel: string;
  text: string;
  senderUserId: string;
  senderName: string;
}): PedelNotification | null {
  const trimmed = input.text.trim();
  if (!trimmed) return null;

  const notification: PedelNotification = {
    id: `pn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    message: formatPedelNotificationMessage(
      input.type,
      input.targetKey,
      trimmed,
    ),
    type: input.type,
    targetKey: input.targetKey,
    targetLabel: input.targetLabel,
    senderUserId: input.senderUserId,
    senderName: input.senderName,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const all = loadAll();
  all.unshift(notification);
  saveAll(all);
  return notification;
}

export function getPedelNotifications(): PedelNotification[] {
  return loadAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadPedelNotifications(): PedelNotification[] {
  return getPedelNotifications().filter((n) => !n.read);
}

export function countUnreadPedelNotifications(): number {
  return getUnreadPedelNotifications().length;
}

export function markPedelNotificationRead(id: string): void {
  saveAll(
    loadAll().map((n) => (n.id === id ? { ...n, read: true } : n)),
  );
}

export function markAllPedelNotificationsRead(): void {
  saveAll(loadAll().map((n) => ({ ...n, read: true })));
}
