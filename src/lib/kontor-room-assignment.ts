import type { KontorParticipant, RoomPreference } from "./kontor-types";
import {
  addAlert,
  loadParticipantsForCourse,
  loadRoomGrid,
  saveParticipantsForCourse,
} from "./kontor-storage";
import {
  getAllRoomNumbers,
  isGroundFloor,
  isNearDiningHall,
  roomWeekKey,
} from "./room-utils";

export type WeekOccupancy = Map<string, string[]>;

export function getOccupancyForWeek(
  year: number,
  week: number,
  excludeCourseId?: string,
): WeekOccupancy {
  const grid = loadRoomGrid(year);
  const occupancy: WeekOccupancy = new Map();

  for (const courseId of getKnownCourseIds()) {
    if (courseId === excludeCourseId) continue;
    for (const p of loadParticipantsForCourse(courseId)) {
      if (!p.roomNumber) continue;
      const key = roomWeekKey(p.roomNumber, year, week);
      const list = occupancy.get(key) ?? [];
      list.push(p.id);
      occupancy.set(key, list);
    }
  }

  for (const [key, cell] of Object.entries(grid)) {
    if (!key.endsWith(`-${year}-${week}`)) continue;
    if (
      cell.status === "lukket" ||
      cell.status === "andet" ||
      cell.status === "buffer" ||
      cell.status === "ansatte"
    ) {
      occupancy.set(key, ["__blocked__"]);
    }
    if (cell.status === "optaget" && cell.courseId && cell.courseId !== excludeCourseId) {
      occupancy.set(key, ["__blocked__"]);
    }
  }

  return occupancy;
}

function getKnownCourseIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("brandbjerg-kontor-participants");
    if (!raw) return [];
    return Object.keys(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return [];
  }
}

export function isRoomAvailable(
  roomNumber: string,
  year: number,
  week: number,
  occupancy: WeekOccupancy,
  maxOccupants = 2,
): boolean {
  const key = roomWeekKey(roomNumber, year, week);
  const grid = loadRoomGrid(year);
  const cell = grid[key];
  if (
    cell?.status === "lukket" ||
    cell?.status === "buffer" ||
    cell?.status === "ansatte"
  ) {
    return false;
  }
  if (cell?.status === "andet" && cell.note?.toLowerCase().includes("lukket")) {
    return false;
  }
  const current = occupancy.get(key) ?? [];
  if (current.includes("__blocked__")) return false;
  return current.length < maxOccupants;
}

function scoreRoom(
  roomNumber: string,
  prefs: RoomPreference[],
): number {
  let score = 0;
  for (const pref of prefs) {
    if (pref.type === "nede_jorden" && isGroundFloor(roomNumber)) score += 10;
    if (pref.type === "taet_spisesal" && isNearDiningHall(roomNumber)) score += 10;
    if (pref.type === "handicap" && isGroundFloor(roomNumber)) score += 8;
    if (pref.type === "enevaerelse") score += 1;
  }
  return score;
}

function wantsSingleRoom(prefs: RoomPreference[]): boolean {
  return prefs.some((p) => p.type === "enevaerelse");
}

function getTogetherPartnerId(prefs: RoomPreference[]): string | undefined {
  return prefs.find((p) => p.type === "sammen_med")?.togetherWithParticipantId;
}

export function assignRoomsForCourse(
  courseId: string,
  courseWeek: number,
  year: number,
  participants: KontorParticipant[],
): KontorParticipant[] {
  const occupancy = getOccupancyForWeek(year, courseWeek, courseId);
  const rooms = getAllRoomNumbers();
  const assigned: KontorParticipant[] = participants.map((p) => ({
    ...p,
    roomNumber: null,
    roomMateId: null,
  }));
  const byId = new Map(assigned.map((p) => [p.id, p]));

  const sorted = [...assigned].sort((a, b) => {
    const aSpec = a.specialConsiderations ? 1 : 0;
    const bSpec = b.specialConsiderations ? 1 : 0;
    if (bSpec !== aSpec) return bSpec - aSpec;
    return b.preferences.length - a.preferences.length;
  });

  for (const p of sorted) {
    const partnerId = getTogetherPartnerId(p.preferences);
    if (partnerId) {
      const partner = byId.get(partnerId);
      if (partner?.roomNumber) {
        p.roomNumber = partner.roomNumber;
        p.roomMateId = partner.id;
        partner.roomMateId = p.id;
        const key = roomWeekKey(partner.roomNumber, year, courseWeek);
        const list = occupancy.get(key) ?? [];
        list.push(p.id);
        occupancy.set(key, list);
        continue;
      }
    }

    const maxOcc = wantsSingleRoom(p.preferences) ? 1 : 2;
    const candidates = rooms
      .filter((room) =>
        isRoomAvailable(room, year, courseWeek, occupancy, maxOcc),
      )
      .sort(
        (a, b) =>
          scoreRoom(b, p.preferences) - scoreRoom(a, p.preferences) ||
          a.localeCompare(b),
      );

    if (candidates.length === 0) {
      addAlert({
        type: "relocation_failed",
        message: `Kunne ikke finde værelse til ${p.name} (uge ${courseWeek})`,
        participantId: p.id,
        courseId,
      });
      continue;
    }

    const room = candidates[0];
    p.roomNumber = room;
    const key = roomWeekKey(room, year, courseWeek);
    const list = occupancy.get(key) ?? [];
    if (list.length === 1 && !wantsSingleRoom(p.preferences)) {
      const mateId = list[0];
      p.roomMateId = mateId;
      const mate = byId.get(mateId);
      if (mate) mate.roomMateId = p.id;
    }
    list.push(p.id);
    occupancy.set(key, list);
  }

  return assigned;
}

export function changeParticipantRoom(
  courseId: string,
  participantId: string,
  newRoom: string,
  courseWeek: number,
  year: number,
): { ok: boolean; error?: string } {
  const participants = loadParticipantsForCourse(courseId);
  const occupancy = getOccupancyForWeek(year, courseWeek, courseId);
  const p = participants.find((x) => x.id === participantId);
  if (!p) return { ok: false, error: "Deltager ikke fundet" };

  const maxOcc = wantsSingleRoom(p.preferences) ? 1 : 2;
  if (!isRoomAvailable(newRoom, year, courseWeek, occupancy, maxOcc)) {
    return { ok: false, error: "Værelset er ikke ledigt i kursets uge" };
  }

  const key = roomWeekKey(newRoom, year, courseWeek);
  const existing = occupancy.get(key) ?? [];
  const newMateId = existing.length === 1 ? existing[0] : null;

  const next = participants.map((x) => {
    if (x.id !== participantId) {
      if (x.roomMateId === participantId) {
        return { ...x, roomMateId: null };
      }
      return x;
    }
    return {
      ...x,
      roomNumber: newRoom,
      roomMateId: newMateId,
    };
  });

  if (newMateId) {
    const mateIdx = next.findIndex((x) => x.id === newMateId);
    if (mateIdx >= 0) {
      next[mateIdx] = { ...next[mateIdx], roomMateId: participantId };
    }
  }

  saveParticipantsForCourse(courseId, next);
  return { ok: true };
}

export function clearParticipantRoom(
  courseId: string,
  participantId: string,
): { ok: boolean; error?: string } {
  const participants = loadParticipantsForCourse(courseId);
  if (!participants.some((x) => x.id === participantId)) {
    return { ok: false, error: "Deltager ikke fundet" };
  }

  const next = participants.map((x) => {
    if (x.id !== participantId) {
      if (x.roomMateId === participantId) {
        return { ...x, roomMateId: null };
      }
      return x;
    }
    return { ...x, roomNumber: null, roomMateId: null };
  });

  saveParticipantsForCourse(courseId, next);
  return { ok: true };
}

/** Flyt deltagere væk fra lukket værelse */
export function relocateFromClosedRoom(
  roomNumber: string,
  year: number,
  weeks: number[],
): void {
  for (const week of weeks) {
    const allCourses = getKnownCourseIds();
    for (const courseId of allCourses) {
      let participants = loadParticipantsForCourse(courseId);
      const affected = participants.filter((p) => p.roomNumber === roomNumber);
      if (affected.length === 0) continue;

      for (const p of affected) {
        const cleared = participants.map((x) =>
          x.id === p.id ? { ...x, roomNumber: null, roomMateId: null } : x,
        );
        participants = assignRoomsForCourse(courseId, week, year, cleared);
        const updated = participants.find((x) => x.id === p.id);
        if (updated?.roomNumber && updated.roomNumber !== roomNumber) {
          addAlert({
            type: "relocation_success",
            message: `${p.name} flyttet fra værelse ${roomNumber} til ${updated.roomNumber} (uge ${week})`,
            participantId: p.id,
            roomNumber: updated.roomNumber,
            courseId,
          });
        } else if (!updated?.roomNumber) {
          addAlert({
            type: "relocation_failed",
            message: `Kunne ikke flytte ${p.name} fra lukket værelse ${roomNumber} — ingen ledige værelser i uge ${week}. Kontakt kunden manuelt.`,
            participantId: p.id,
            roomNumber,
            courseId,
          });
        }
      }
      saveParticipantsForCourse(courseId, participants);
    }
  }
}
