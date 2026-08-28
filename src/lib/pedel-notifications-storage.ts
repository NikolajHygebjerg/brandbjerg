import { getCurrentUser } from "./auth-storage";
import {
  getDepartmentMessages,
  isMessageUnread,
  markAllInboxRead,
  markMessageRead,
  MESSAGING_UPDATED_EVENT,
  sendMessage,
} from "./messaging-storage";
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
  messageId?: string;
}

const LEGACY_STORAGE_KEY = "brandbjerg-pedel-notifications";
export const PEDEL_NOTIFICATIONS_UPDATED_EVENT = MESSAGING_UPDATED_EVENT;

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PEDEL_NOTIFICATIONS_UPDATED_EVENT));
  }
}

function loadLegacy(): PedelNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PedelNotification[];
  } catch {
    return [];
  }
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

  const messageBody = formatPedelNotificationMessage(
    input.type,
    input.targetKey,
    trimmed,
  );

  const platformMessage = sendMessage({
    senderId: input.senderUserId,
    senderName: input.senderName,
    recipientType: "department",
    recipientDepartmentId: "pedel",
    recipientDepartmentName: "Pedel",
    subject: `Rengøring: ${input.targetLabel}`,
    body: messageBody,
    source: "rengoring-pedel",
  });

  if (!platformMessage) return null;

  emitUpdate();

  return {
    id: platformMessage.id,
    messageId: platformMessage.id,
    message: messageBody,
    type: input.type,
    targetKey: input.targetKey,
    targetLabel: input.targetLabel,
    senderUserId: input.senderUserId,
    senderName: input.senderName,
    createdAt: platformMessage.createdAt,
    read: false,
  };
}

export function getPedelNotifications(): PedelNotification[] {
  const user = getCurrentUser();
  const fromMessaging = getDepartmentMessages("pedel", {
    source: "rengoring-pedel",
  }).map((m) => ({
    id: m.id,
    messageId: m.id,
    message: m.body,
    type: "vaerelse" as RengoringNoteTargetType,
    targetKey: "",
    targetLabel: m.subject.replace(/^Rengøring: /, ""),
    senderUserId: m.senderId,
    senderName: m.senderName,
    createdAt: m.createdAt,
    read: user ? !isMessageUnread(m, user.id) : m.readByUserIds.length > 0,
  }));

  const legacy = loadLegacy();
  const ids = new Set(fromMessaging.map((n) => n.id));
  const merged = [
    ...fromMessaging,
    ...legacy.filter((l) => !ids.has(l.id)),
  ];
  return merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadPedelNotifications(): PedelNotification[] {
  return getPedelNotifications().filter((n) => !n.read);
}

export function countUnreadPedelNotifications(): number {
  return getUnreadPedelNotifications().length;
}

export function markPedelNotificationRead(id: string): void {
  const user = getCurrentUser();
  if (user) {
    markMessageRead(id, user.id);
  }
  emitUpdate();
}

export function markAllPedelNotificationsRead(): void {
  const user = getCurrentUser();
  if (user) {
    markAllInboxRead(user.id, user.role);
  }
  emitUpdate();
}
