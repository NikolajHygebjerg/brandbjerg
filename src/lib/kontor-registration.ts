import { getCourseDetailById } from "./course-list";
import { mergeCoursePlan } from "./course-plan-storage";
import type { RegistrationFormData } from "./enrollment-form-types";
import { buildRegistrationSummary } from "./enrollment-form-types";
import {
  ENKELTVAERELSE_TILLÆG,
  SENGETØJ_TILLÆG,
} from "./enrollment-form-options";
import { getStatusarkCourse } from "./brandbjerg-status";
import { statusarkYear } from "./brandbjerg-statusark";
import type { KontorParticipant } from "./kontor-types";
import { canRegister } from "./kontor-limits-utils";
import {
  addAlert,
  loadParticipantsForCourse,
  saveParticipantsForCourse,
  syncCourseRoomOccupancy,
} from "./kontor-storage";
import { assignRoomsForCourse } from "./kontor-room-assignment";
import {
  countWorkshopEnrollments,
  getRegistrationWorkshopModules,
  isWorkshopOptionFull,
  visibleWorkshopOptions,
} from "./workshop-utils";

function validateWorkshopChoices(
  courseId: string,
  data: RegistrationFormData,
  existing: KontorParticipant[],
): string | null {
  const course = getCourseDetailById(courseId);
  if (!course) return null;
  const merged = mergeCoursePlan(course);
  const modules = getRegistrationWorkshopModules(merged);

  for (const mod of modules) {
    const choice = data.workshopChoices[mod.id];
    if (!choice) {
      return `Vælg workshop for «${mod.overskrift || "Workshops"}».`;
    }
    const option = visibleWorkshopOptions(mod).find((o) => o.id === choice);
    if (!option) return "Ugyldigt workshop-valg.";
    if (isWorkshopOptionFull(existing, mod.id, option)) {
      return `«${option.overskrift}» er desværre fuldt — vælg en anden workshop.`;
    }
  }
  return null;
}

function notifyNewlyClosedWorkshops(
  courseId: string,
  before: KontorParticipant[],
  after: KontorParticipant[],
): void {
  const course = getCourseDetailById(courseId);
  if (!course) return;
  const merged = mergeCoursePlan(course);

  for (const mod of getRegistrationWorkshopModules(merged)) {
    for (const option of visibleWorkshopOptions(mod)) {
      const wasFull = isWorkshopOptionFull(before, mod.id, option);
      const nowFull = isWorkshopOptionFull(after, mod.id, option);
      if (!wasFull && nowFull) {
        addAlert({
          type: "workshop_closed",
          courseId,
          workshopModuleId: mod.id,
          workshopOptionId: option.id,
          message: `Workshop «${option.overskrift}» (${mod.overskrift || "Workshops"}) er nu fuldt — ${countWorkshopEnrollments(after, mod.id, option.id)}/${option.maxDeltagere} tilmeldte.`,
        });
      }
    }
  }
}

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
  const workshopError = validateWorkshopChoices(courseId, data, participants);
  if (workshopError) return { ok: false, error: workshopError };

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
    workshopChoices: { ...data.workshopChoices },
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

  const before = [...participants];
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

  notifyNewlyClosedWorkshops(courseId, before, next);

  const saved = next.find((p) => p.id === participant.id) ?? participant;
  return { ok: true, participant: saved };
}
