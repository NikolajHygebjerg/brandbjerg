import type {
  KontorAlert,
  KontorParticipant,
  RoomWeekCell,
} from "./kontor-types";
import { roomWeekKey } from "./room-utils";

const ROOM_PREFIX = "brandbjerg-kontor-rooms-";
const PARTICIPANTS_KEY = "brandbjerg-kontor-participants";
const ALERTS_KEY = "brandbjerg-kontor-alerts";
const UPDATED_EVENT = "brandbjerg-kontor-updated";

export { UPDATED_EVENT as KONTOR_UPDATED_EVENT };

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
    window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
  }
}

export function loadRoomGrid(year: number): Record<string, RoomWeekCell> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, RoomWeekCell>>(
    localStorage.getItem(`${ROOM_PREFIX}${year}`),
  ) ?? {};
}

export function saveRoomGrid(
  year: number,
  grid: Record<string, RoomWeekCell>,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${ROOM_PREFIX}${year}`, JSON.stringify(grid));
  emitUpdate();
}

export function setRoomWeekCells(
  year: number,
  keys: string[],
  cell: RoomWeekCell,
): Record<string, RoomWeekCell> {
  const grid = loadRoomGrid(year);
  for (const key of keys) {
    grid[key] = { ...cell };
  }
  saveRoomGrid(year, grid);
  return grid;
}

export function loadAllParticipants(): Record<string, KontorParticipant[]> {
  if (typeof window === "undefined") return {};
  return (
    safeParse<Record<string, KontorParticipant[]>>(localStorage.getItem(PARTICIPANTS_KEY)) ??
    {}
  );
}

export function loadParticipantsForCourse(
  courseId: string,
): KontorParticipant[] {
  return loadAllParticipants()[courseId] ?? [];
}

export function saveParticipantsForCourse(
  courseId: string,
  participants: KontorParticipant[],
): void {
  if (typeof window === "undefined") return;
  const all = loadAllParticipants();
  all[courseId] = participants;
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(all));
  emitUpdate();
}

export function updateParticipant(
  courseId: string,
  participantId: string,
  patch: Partial<KontorParticipant>,
): KontorParticipant | null {
  const list = loadParticipantsForCourse(courseId);
  let updated: KontorParticipant | null = null;
  const next = list.map((p) => {
    if (p.id !== participantId) return p;
    updated = { ...p, ...patch };
    return updated;
  });
  saveParticipantsForCourse(courseId, next);
  return updated;
}

export function loadAlerts(): KontorAlert[] {
  if (typeof window === "undefined") return [];
  return safeParse<KontorAlert[]>(localStorage.getItem(ALERTS_KEY)) ?? [];
}

export function addAlert(alert: Omit<KontorAlert, "id" | "createdAt" | "read">): void {
  if (typeof window === "undefined") return;
  const alerts = loadAlerts();
  alerts.unshift({
    ...alert,
    id: `alert-${Date.now()}`,
    createdAt: new Date().toISOString(),
    read: false,
  });
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(0, 50)));
  emitUpdate();
}

export function markAlertRead(alertId: string): void {
  if (typeof window === "undefined") return;
  const alerts = loadAlerts().map((a) =>
    a.id === alertId ? { ...a, read: true } : a,
  );
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  emitUpdate();
}

export function countUnreadAlerts(): number {
  return loadAlerts().filter((a) => !a.read).length;
}

/** Marker deltagerværelser som optaget i ugerækken for kurset */
export function syncCourseRoomOccupancy(
  year: number,
  courseWeek: number,
  courseId: string,
  participants: KontorParticipant[],
): void {
  const grid = loadRoomGrid(year);
  const roomsUsed = new Set(
    participants.filter((p) => p.roomNumber).map((p) => p.roomNumber!),
  );
  for (const room of roomsUsed) {
    const key = roomWeekKey(room, year, courseWeek);
    const existing = grid[key];
    if (!existing || existing.status === "ledigt" || existing.courseId === courseId) {
      grid[key] = { status: "optaget", courseId };
    }
  }
  saveRoomGrid(year, grid);
}

export function clearCourseFromRoomGrid(
  year: number,
  courseWeek: number,
  courseId: string,
): void {
  const grid = loadRoomGrid(year);
  for (const [key, cell] of Object.entries(grid)) {
    if (cell.courseId === courseId && key.endsWith(`-${year}-${courseWeek}`)) {
      delete grid[key];
    }
  }
  saveRoomGrid(year, grid);
}
