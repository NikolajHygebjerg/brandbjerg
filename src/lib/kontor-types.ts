export type RoomWeekStatusType =
  | "ledigt"
  | "optaget"
  | "andet"
  | "lukket"
  | "buffer"
  | "ansatte";

export interface RoomWeekCell {
  status: RoomWeekStatusType;
  note?: string;
  courseId?: string;
}

export type RoomPreferenceType =
  | "taet_spisesal"
  | "sammen_med"
  | "nede_jorden"
  | "enevaerelse"
  | "handicap";

export interface RoomPreference {
  type: RoomPreferenceType;
  note?: string;
  togetherWithParticipantId?: string;
}

export interface KontorParticipantChecks {
  modtagetBekræftelse: boolean;
  modtagetFaktura: boolean;
  betalt: boolean;
  modtagetVelkomstbrev: boolean;
  vaerelsePlaceret: boolean;
  saerligeHensyn: boolean;
}

export interface KontorParticipant {
  id: string;
  courseId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  registeredAt: string;
  status: "reserveret" | "betalt" | "venteliste" | "aflyst";
  amount: number;
  roomNumber: string | null;
  roomMateId: string | null;
  roomType: "enkelt" | "dobbelt" | "ingen";
  preferences: RoomPreference[];
  specialConsiderations: string;
  /** moduleId → workshopOptionId */
  workshopChoices?: Record<string, string>;
  confirmationSentAt?: string;
  invoiceSentAt?: string;
  welcomeLetterSentAt?: string;
  paidAt?: string;
}

export interface CourseEnrollmentLimits {
  maxKursister: number;
  maxEnkeltvaerelser: number;
  maxDobbeltvaerelser: number;
}

export interface KontorAlert {
  id: string;
  type: "relocation_failed" | "relocation_success" | "info" | "workshop_closed";
  message: string;
  participantId?: string;
  roomNumber?: string;
  courseId?: string;
  workshopModuleId?: string;
  workshopOptionId?: string;
  createdAt: string;
  read: boolean;
}

export function deriveParticipantChecks(
  p: KontorParticipant,
): KontorParticipantChecks {
  return {
    modtagetBekræftelse: Boolean(p.confirmationSentAt),
    modtagetFaktura: Boolean(p.invoiceSentAt),
    betalt: isParticipantPaid(p),
    modtagetVelkomstbrev: Boolean(p.welcomeLetterSentAt),
    vaerelsePlaceret: Boolean(p.roomNumber),
    saerligeHensyn: Boolean(p.specialConsiderations.trim()),
  };
}

export function isParticipantPaid(p: KontorParticipant): boolean {
  return p.status === "betalt" || Boolean(p.paidAt);
}

export function isActiveParticipant(p: KontorParticipant): boolean {
  return p.status !== "aflyst";
}

export function countUnpaidParticipants(
  participants: KontorParticipant[],
): number {
  return participants.filter(
    (p) => isActiveParticipant(p) && !isParticipantPaid(p),
  ).length;
}

export function paymentOverviewLabel(
  participants: KontorParticipant[],
): string {
  const active = participants.filter(isActiveParticipant);
  if (active.length === 0) return "—";
  const unpaid = countUnpaidParticipants(participants);
  if (unpaid === 0) return "Alle har betalt";
  return unpaid === 1
    ? "1 mangler at betale"
    : `${unpaid} mangler at betale`;
}

export const checkLabels: Record<keyof KontorParticipantChecks, string> = {
  modtagetBekræftelse: "Modtaget bekræftelse",
  modtagetFaktura: "Modtaget faktura",
  betalt: "Betalt",
  modtagetVelkomstbrev: "Modtaget velkomstbrev",
  vaerelsePlaceret: "Værelse",
  saerligeHensyn: "Særlige hensyn",
};

export const roomStatusLabels: Record<RoomWeekStatusType, string> = {
  ledigt: "Ledigt",
  optaget: "Optaget",
  andet: "Andet",
  lukket: "Lukket",
  buffer: "Buffer",
  ansatte: "Ansatte",
};

export const preferenceLabels: Record<RoomPreferenceType, string> = {
  taet_spisesal: "Tæt på spisesalen",
  sammen_med: "Sammen med kursist",
  nede_jorden: "Nede ved jorden",
  enevaerelse: "Eneværelse",
  handicap: "Handicap / gangbesvær",
};
