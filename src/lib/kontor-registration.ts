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

import type { RegistrationFormData } from "./enrollment-form-types";
import { buildRegistrationSummary } from "./enrollment-form-types";
import {
  ENKELTVAERELSE_TILLÆG,
  SENGETØJ_TILLÆG,
} from "./enrollment-form-options";

export function registerNewParticipant(
  courseId: string,
  data: RegistrationFormData,
  basePrice: number,
): { ok: boolean; error?: string; participant?: KontorParticipant } {
  const roomType = data.accommodation;
  const check = canRegister(courseId, roomType);
  if (!check.ok) return { ok: false, error: check.reason };

  if (data.email.trim().toLowerCase() !== data.emailConfirm.trim().toLowerCase()) {
    return { ok: false, error: "E-mail og validering matcher ikke." };
  }

  const participants = loadParticipantsForCourse(courseId);
  const amount =
    basePrice +
    (roomType === "enkelt" ? ENKELTVAERELSE_TILLÆG : 0) +
    (data.bedding === "ja" ? SENGETØJ_TILLÆG : 0);

  const fullAddress = [
    data.address.trim(),
    `${data.postalCode.trim()} ${data.city.trim()}`.trim(),
    data.country.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const extra = buildRegistrationSummary(data);

  const participant: KontorParticipant = {
    id: `kp-${courseId}-${Date.now()}`,
    courseId,
    name: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    address: fullAddress,
    registeredAt: new Date().toISOString().slice(0, 10),
    status: "reserveret",
    amount,
    roomNumber: null,
    roomMateId: null,
    roomType,
    preferences:
      roomType === "enkelt"
        ? [{ type: "enevaerelse" }]
        : data.roomNeighbor.trim()
          ? [{ type: "sammen_med", note: data.roomNeighbor.trim() }]
          : [],
    specialConsiderations: [
      data.dietaryNeeds !== "Vælg" ? data.dietaryNeeds : "",
      data.otherConsiderations.trim(),
      extra,
    ]
      .filter(Boolean)
      .join(" · "),
  };

  let next = [...participants, participant];
  const sa = getStatusarkCourse(courseId);
  if (sa?.startDate) {
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
