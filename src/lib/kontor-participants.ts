import { getStatusarkCourse } from "./brandbjerg-status";
import { statusarkYear } from "./brandbjerg-statusark";
import { netEnrolled } from "./statusark-utils";
import type { KontorParticipant, RoomPreference } from "./kontor-types";
import {
  loadParticipantsForCourse,
  saveParticipantsForCourse,
  syncCourseRoomOccupancy,
} from "./kontor-storage";
import {
  assignRoomsForCourse,
  getOccupancyForWeek,
  isRoomAvailable,
} from "./kontor-room-assignment";
import { getAllRoomNumbers, isGroundFloor, isNearDiningHall } from "./room-utils";

const FIRST_NAMES = [
  "Mette", "Jens", "Camilla", "Peter", "Louise", "Henrik", "Anne", "Michael",
  "Susanne", "Thomas", "Kirsten", "Lars", "Maria", "Søren", "Hanne", "Martin",
  "Birgit", "Niels", "Lise", "Ole", "Dorthe", "Finn", "Grete", "Erik",
  "Inger", "Poul", "Karen", "Bo", "Ulla", "Jan", "Tove", "Per",
];

const LAST_NAMES = [
  "Hansen", "Pedersen", "Andersen", "Nielsen", "Jensen", "Christensen",
  "Larsen", "Sørensen", "Rasmussen", "Jørgensen", "Petersen", "Madsen",
  "Kristensen", "Olsen", "Thomsen", "Christiansen", "Poulsen", "Johansen",
  "Knudsen", "Mortensen", "Møller", "Jacobsen", "Jakobsen", "Henriksen",
];

const SPECIAL_NOTES = [
  "",
  "",
  "",
  "Allergi: nødder",
  "Vegetar / kosthensyn",
  "Gangbesvær — elevator foretrukket",
  "Cøliaki",
  "Laktoseintolerant",
  "Diabetes — særlig kost",
  "Hører dårligt — plads forrest i sal",
];

function pickName(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[(index * 7) % LAST_NAMES.length];
  return `${first} ${last}`;
}

function seededPreferences(
  index: number,
  courseId: string,
): RoomPreference[] {
  const prefs: RoomPreference[] = [];
  if (index % 11 === 0) prefs.push({ type: "nede_jorden" });
  if (index % 13 === 0) prefs.push({ type: "taet_spisesal" });
  if (index % 17 === 0) prefs.push({ type: "enevaerelse" });
  if (index % 19 === 0) prefs.push({ type: "handicap" });
  if (index % 23 === 0 && index > 0) {
    prefs.push({
      type: "sammen_med",
      togetherWithParticipantId: `kp-${courseId}-${index - 1}`,
    });
  }
  return prefs;
}

function mockParticipant(
  courseId: string,
  index: number,
  registeredAt: string,
): KontorParticipant {
  const id = `kp-${courseId}-${index}`;
  const special = SPECIAL_NOTES[index % SPECIAL_NOTES.length];
  const paid = index % 5 !== 4;
  const status = paid ? "betalt" : index % 3 === 0 ? "reserveret" : "betalt";

  const prefs = seededPreferences(index, courseId);
  const wantsEnkelt =
    prefs.some((p) => p.type === "enevaerelse") || index % 7 === 0;

  return {
    id,
    courseId,
    name: pickName(index),
    email: `deltager${index}@example.dk`,
    phone: `+45 ${String(20 + (index % 70)).padStart(2, "0")} ${String(100000 + index * 137).slice(-6)}`,
    address: `Eksempelvej ${index + 1}, ${1000 + (index % 9000)} København`,
    registeredAt,
    status,
    amount: 5995,
    roomNumber: null,
    roomMateId: null,
    roomType: wantsEnkelt ? "enkelt" : "dobbelt",
    preferences: prefs,
    specialConsiderations: special,
    confirmationSentAt: index % 7 !== 6 ? registeredAt : undefined,
    invoiceSentAt: paid ? registeredAt : undefined,
    welcomeLetterSentAt: index % 9 !== 8 ? registeredAt : undefined,
    paidAt: paid ? registeredAt : undefined,
  };
}

/** Generer mock-deltagere fra statusark-tilmeldingstal */
export function ensureParticipantsForCourse(courseId: string): KontorParticipant[] {
  const existing = loadParticipantsForCourse(courseId);
  if (existing.length > 0) return existing;

  const sa = getStatusarkCourse(courseId);
  if (!sa) return [];

  const count = netEnrolled(sa.totalEnrolled, sa.paidCancellations);
  if (count <= 0) return [];

  const participants: KontorParticipant[] = [];
  for (let i = 0; i < count; i++) {
    participants.push(
      mockParticipant(
        courseId,
        i,
        sa.startDate ?? `${statusarkYear}-01-01`,
      ),
    );
  }

  const assigned = assignRoomsForCourse(
    courseId,
    sa.courseWeekNumber,
    statusarkYear,
    participants,
  );
  saveParticipantsForCourse(courseId, assigned);
  syncCourseRoomOccupancy(statusarkYear, sa.courseWeekNumber, courseId, assigned);
  return assigned;
}

export function getCourseWeekRoomSummary(
  courseId: string,
  courseWeek: number,
  year: number = statusarkYear,
): Array<{ roomNumber: string; occupants: string[] }> {
  const participants = loadParticipantsForCourse(courseId);
  const byRoom = new Map<string, string[]>();
  for (const p of participants) {
    if (!p.roomNumber) continue;
    const list = byRoom.get(p.roomNumber) ?? [];
    list.push(p.name);
    byRoom.set(p.roomNumber, list);
  }
  return Array.from(byRoom.entries())
    .map(([roomNumber, occupants]) => ({ roomNumber, occupants }))
    .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
}

export function countAssignedRooms(participants: KontorParticipant[]): number {
  return new Set(
    participants.filter((p) => p.roomNumber).map((p) => p.roomNumber),
  ).size;
}

export function countFreeRoomsForWeek(
  year: number,
  week: number,
  courseId?: string,
): number {
  const occupancy = getOccupancyForWeek(year, week, courseId);
  return getAllRoomNumbers().filter((room) =>
    isRoomAvailable(room, year, week, occupancy, 2),
  ).length;
}

export { isGroundFloor, isNearDiningHall };
