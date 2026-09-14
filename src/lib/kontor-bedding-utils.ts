import { getCoursesForYear } from "./course-list";
import { addDaysIso, eachNight } from "./date-utils";
import type { KontorParticipant } from "./kontor-types";
import {
  loadParticipantsForCourse,
  updateParticipant,
} from "./kontor-storage";

export const BEDDING_EXTRA_INVOICE_KR = 125;

export function inferBeddingOrdered(p: KontorParticipant): boolean {
  if (p.beddingOrdered != null) return p.beddingOrdered;
  return /Sengetøj:\s*Ja/i.test(p.specialConsiderations);
}

/** Deltager ønsker sengetøj (tilmelding eller godkendt ved indkvartering). */
export function participantWantsBedding(p: KontorParticipant): boolean {
  return inferBeddingOrdered(p) || Boolean(p.beddingExtraApproved);
}

/** Sengetøj-kolonne for kursusleder er afkrydset. */
export function isSengetojFulfilledForLeader(p: KontorParticipant): boolean {
  if (inferBeddingOrdered(p)) {
    return Boolean(p.beddingOnRoom);
  }
  return Boolean(p.beddingExtraApproved);
}

export function isSengetojGreenForLeader(p: KontorParticipant): boolean {
  return participantWantsBedding(p) && Boolean(p.beddingOnRoom);
}

export function getParticipantsInRoomOnNight(
  roomNumber: string,
  night: string,
): KontorParticipant[] {
  const year = parseInt(night.slice(0, 4), 10);
  const out: KontorParticipant[] = [];

  for (const course of getCoursesForYear(year)) {
    if (!course.startDate || !course.endDate) continue;
    const occupiedNights = eachNight(
      course.startDate,
      addDaysIso(course.endDate, 1),
    );
    if (!occupiedNights.includes(night)) continue;

    for (const p of loadParticipantsForCourse(course.id)) {
      if (p.status === "aflyst") continue;
      if (p.roomNumber === roomNumber) out.push(p);
    }
  }

  return out;
}

export function countBeddingSetsNeededForRoom(
  roomNumber: string,
  night: string,
): number {
  return getParticipantsInRoomOnNight(roomNumber, night).filter((p) =>
    participantWantsBedding(p),
  ).length;
}

export function syncBeddingOnRoomForRoom(
  roomNumber: string,
  night: string,
  onRoom: boolean,
): void {
  for (const p of getParticipantsInRoomOnNight(roomNumber, night)) {
    if (!participantWantsBedding(p)) continue;
    if (Boolean(p.beddingOnRoom) === onRoom) continue;
    updateParticipant(p.courseId, p.id, { beddingOnRoom: onRoom });
  }
}
