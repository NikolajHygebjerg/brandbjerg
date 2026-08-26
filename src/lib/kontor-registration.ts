import { getStatusarkCourse } from "./brandbjerg-status";
import { statusarkYear } from "./brandbjerg-statusark";
import type { KontorParticipant } from "./kontor-types";
import { canRegister } from "./kontor-limits-utils";
import {
  loadParticipantsForCourse,
  saveParticipantsForCourse,
  syncCourseRoomOccupancy,
} from "./kontor-storage";
import {
  assignRoomsForCourse,
} from "./kontor-room-assignment";

export function registerNewParticipant(
  courseId: string,
  data: {
    name: string;
    email: string;
    phone: string;
    roomType: "ingen" | "enkelt" | "dobbelt";
  },
): { ok: boolean; error?: string; participant?: KontorParticipant } {
  const check = canRegister(courseId, data.roomType);
  if (!check.ok) return { ok: false, error: check.reason };

  const participants = loadParticipantsForCourse(courseId);
  const participant: KontorParticipant = {
    id: `kp-${courseId}-${Date.now()}`,
    courseId,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    address: "",
    registeredAt: new Date().toISOString().slice(0, 10),
    status: "reserveret",
    amount: 5995,
    roomNumber: null,
    roomMateId: null,
    roomType: data.roomType,
    preferences:
      data.roomType === "enkelt" ? [{ type: "enevaerelse" }] : [],
    specialConsiderations: "",
  };

  let next = [...participants, participant];
  const sa = getStatusarkCourse(courseId);
  if (sa?.startDate && data.roomType !== "ingen") {
    next = assignRoomsForCourse(
      courseId,
      sa.courseWeekNumber,
      statusarkYear,
      next,
    );
    syncCourseRoomOccupancy(
      statusarkYear,
      sa.courseWeekNumber,
      courseId,
      next,
    );
  } else {
    saveParticipantsForCourse(courseId, next);
  }

  const saved = next.find((p) => p.id === participant.id) ?? participant;
  return { ok: true, participant: saved };
}
