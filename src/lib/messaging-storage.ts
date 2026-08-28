import type { UserRole } from "./auth-types";
import {
  getDepartmentById,
  userBelongsToDepartment,
  type Department,
} from "./messaging-departments";
import type {
  MessageRecipientType,
  MessageSource,
  PlatformMessage,
} from "./messaging-types";

const STORAGE_KEY = "brandbjerg-messages";
export const MESSAGING_UPDATED_EVENT = "brandbjerg-messages-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MESSAGING_UPDATED_EVENT));
  }
}

function loadAll(): PlatformMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PlatformMessage[];
  } catch {
    return [];
  }
}

function saveAll(messages: PlatformMessage[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  emitUpdate();
}

export function sendMessage(input: {
  senderId: string;
  senderName: string;
  recipientType: MessageRecipientType;
  recipientUserId?: string;
  recipientUserName?: string;
  recipientDepartmentId?: string;
  recipientDepartmentName?: string;
  subject?: string;
  body: string;
  source?: MessageSource;
}): PlatformMessage | null {
  const body = input.body.trim();
  if (!body) return null;

  if (input.recipientType === "user" && !input.recipientUserId) return null;
  if (input.recipientType === "department" && !input.recipientDepartmentId) {
    return null;
  }

  const message: PlatformMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderId: input.senderId,
    senderName: input.senderName,
    recipientType: input.recipientType,
    recipientUserId: input.recipientUserId,
    recipientUserName: input.recipientUserName,
    recipientDepartmentId: input.recipientDepartmentId,
    recipientDepartmentName: input.recipientDepartmentName,
    subject: input.subject?.trim() || "Besked",
    body,
    createdAt: new Date().toISOString(),
    readByUserIds: [],
    source: input.source ?? "manual",
  };

  const all = loadAll();
  all.unshift(message);
  saveAll(all);
  return message;
}

export function sendMessageToDepartment(
  dept: Department,
  input: Omit<
    Parameters<typeof sendMessage>[0],
    "recipientType" | "recipientDepartmentId" | "recipientDepartmentName"
  >,
): PlatformMessage | null {
  return sendMessage({
    ...input,
    recipientType: "department",
    recipientDepartmentId: dept.id,
    recipientDepartmentName: dept.label,
  });
}

function isRecipient(userId: string, role: UserRole, message: PlatformMessage): boolean {
  if (message.recipientType === "user") {
    return message.recipientUserId === userId;
  }
  if (message.recipientDepartmentId) {
    return userBelongsToDepartment(role, message.recipientDepartmentId);
  }
  return false;
}

export function getInboxForUser(userId: string, role: UserRole): PlatformMessage[] {
  return loadAll()
    .filter((m) => isRecipient(userId, role, m))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getSentByUser(userId: string): PlatformMessage[] {
  return loadAll()
    .filter((m) => m.senderId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isMessageUnread(message: PlatformMessage, userId: string): boolean {
  return !message.readByUserIds.includes(userId);
}

export function countUnreadForUser(userId: string, role: UserRole): number {
  return getInboxForUser(userId, role).filter((m) => isMessageUnread(m, userId))
    .length;
}

export function markMessageRead(messageId: string, userId: string): void {
  saveAll(
    loadAll().map((m) =>
      m.id === messageId && !m.readByUserIds.includes(userId)
        ? { ...m, readByUserIds: [...m.readByUserIds, userId] }
        : m,
    ),
  );
}

export function markAllInboxRead(userId: string, role: UserRole): void {
  const inboxIds = new Set(getInboxForUser(userId, role).map((m) => m.id));
  saveAll(
    loadAll().map((m) =>
      inboxIds.has(m.id) && !m.readByUserIds.includes(userId)
        ? { ...m, readByUserIds: [...m.readByUserIds, userId] }
        : m,
    ),
  );
}

export function getDepartmentMessages(
  departmentId: string,
  opts?: { source?: MessageSource; limit?: number },
): PlatformMessage[] {
  let messages = loadAll().filter(
    (m) =>
      m.recipientType === "department" &&
      m.recipientDepartmentId === departmentId,
  );
  if (opts?.source) {
    messages = messages.filter((m) => m.source === opts.source);
  }
  messages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (opts?.limit) {
    messages = messages.slice(0, opts.limit);
  }
  return messages;
}

export function getDepartmentByIdSafe(id: string) {
  return getDepartmentById(id);
}
