import { getStatusarkCourse } from "./brandbjerg-status";
import { netEnrolled } from "./statusark-utils";
import type {
  CourseEnrollmentLimits,
  KontorParticipant,
} from "./kontor-types";
import {
  loadEnrollmentLimits,
  loadParticipantsForCourse,
  saveEnrollmentLimits,
} from "./kontor-storage";

export interface EnrollmentSlotAvailability {
  used: number;
  max: number;
  open: boolean;
}

export interface EnrollmentAvailability {
  kursist: EnrollmentSlotAvailability;
  enkelt: EnrollmentSlotAvailability;
  dobbelt: EnrollmentSlotAvailability & { usedPersons: number };
}

function activeParticipants(participants: KontorParticipant[]): KontorParticipant[] {
  return participants.filter((p) => p.status !== "aflyst");
}

function resolveRoomType(
  p: KontorParticipant,
): "enkelt" | "dobbelt" | "ingen" {
  if (p.roomType) return p.roomType;
  if (p.preferences.some((pref) => pref.type === "enevaerelse")) {
    return "enkelt";
  }
  return "dobbelt";
}

export function isEnkeltParticipant(p: KontorParticipant): boolean {
  return resolveRoomType(p) === "enkelt";
}

export function isDobbeltParticipant(p: KontorParticipant): boolean {
  return resolveRoomType(p) === "dobbelt";
}

export function countEnkeltUsed(participants: KontorParticipant[]): number {
  return activeParticipants(participants).filter(isEnkeltParticipant).length;
}

export function countDobbeltPersons(participants: KontorParticipant[]): number {
  return activeParticipants(participants).filter(isDobbeltParticipant).length;
}

export function countDobbeltRooms(participants: KontorParticipant[]): number {
  const persons = countDobbeltPersons(participants);
  return Math.ceil(persons / 2);
}

export function defaultLimitsForCourse(courseId: string): CourseEnrollmentLimits {
  const sa = getStatusarkCourse(courseId);
  if (!sa) {
    return { maxKursister: 20, maxEnkeltvaerelser: 0, maxDobbeltvaerelser: 0 };
  }
  return {
    maxKursister: sa.maxStudents ?? sa.budgetStudents ?? 20,
    maxEnkeltvaerelser: sa.rooms.single ?? 0,
    maxDobbeltvaerelser: sa.rooms.double ?? 0,
  };
}

export function getEffectiveLimits(courseId: string): CourseEnrollmentLimits {
  const stored = loadEnrollmentLimits(courseId);
  if (stored) return stored;
  return defaultLimitsForCourse(courseId);
}

export function saveLimitsForCourse(
  courseId: string,
  limits: CourseEnrollmentLimits,
): void {
  saveEnrollmentLimits(courseId, limits);
}

export function getKursistCount(
  courseId: string,
  participants?: KontorParticipant[],
): number {
  const list = participants ?? loadParticipantsForCourse(courseId);
  const active = activeParticipants(list);
  if (active.length > 0) return active.length;

  const sa = getStatusarkCourse(courseId);
  if (sa) return netEnrolled(sa.totalEnrolled, sa.paidCancellations);
  return 0;
}

export function getEnrollmentAvailability(
  courseId: string,
): EnrollmentAvailability {
  const limits = getEffectiveLimits(courseId);
  const participants = loadParticipantsForCourse(courseId);
  const kursistUsed = getKursistCount(courseId, participants);
  const enkeltUsed = countEnkeltUsed(participants);
  const dobbeltPersons = countDobbeltPersons(participants);
  const dobbeltRooms = countDobbeltRooms(participants);

  return {
    kursist: {
      used: kursistUsed,
      max: limits.maxKursister,
      open: limits.maxKursister > 0 && kursistUsed < limits.maxKursister,
    },
    enkelt: {
      used: enkeltUsed,
      max: limits.maxEnkeltvaerelser,
      open:
        limits.maxEnkeltvaerelser > 0 &&
        enkeltUsed < limits.maxEnkeltvaerelser &&
        kursistUsed < limits.maxKursister,
    },
    dobbelt: {
      used: dobbeltRooms,
      usedPersons: dobbeltPersons,
      max: limits.maxDobbeltvaerelser,
      open:
        limits.maxDobbeltvaerelser > 0 &&
        Math.ceil((dobbeltPersons + 1) / 2) <= limits.maxDobbeltvaerelser &&
        kursistUsed < limits.maxKursister,
    },
  };
}

export function canRegister(
  courseId: string,
  roomType: "ingen" | "enkelt" | "dobbelt",
): { ok: boolean; reason?: string } {
  const avail = getEnrollmentAvailability(courseId);

  if (!avail.kursist.open) {
    return { ok: false, reason: "Kurset er fuldt — tilmelding er lukket." };
  }

  if (roomType === "enkelt" && !avail.enkelt.open) {
    return {
      ok: false,
      reason: "Der er ikke flere enkeltværelser tilgængelige.",
    };
  }

  if (roomType === "dobbelt" && !avail.dobbelt.open) {
    return {
      ok: false,
      reason: "Der er ikke flere dobbeltværelser tilgængelige.",
    };
  }

  return { ok: true };
}
