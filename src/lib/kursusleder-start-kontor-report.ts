import {
  inferBeddingOrdered,
  isSengetojGreenForLeader,
} from "./kontor-bedding-utils";
import { isActiveParticipant, type KontorParticipant } from "./kontor-types";

function beddingLabel(p: KontorParticipant): string {
  if (isSengetojGreenForLeader(p)) {
    if (p.beddingOnRoom) return "Sengetøj: på værelset";
    if (p.beddingHandedOutByLeaderAt) return "Sengetøj: udleveret";
    return "Sengetøj: ok";
  }
  if (inferBeddingOrdered(p)) return "Sengetøj: afventer";
  if (p.beddingExtraApproved) return "Sengetøj: ekstra (afventer)";
  return "Sengetøj: nej";
}

function participantLine(p: KontorParticipant): string {
  const arrived = p.arrivedAt ? "Ankommet" : "Ikke ankommet";
  const parts = [
    p.name,
    p.roomNumber ? `værelse ${p.roomNumber}` : "intet værelse",
    arrived,
    beddingLabel(p),
  ];
  if (p.specialConsiderations.trim()) {
    parts.push(`tilmelding: ${p.specialConsiderations.trim()}`);
  }
  if (p.startCourseNote?.trim()) {
    parts.push(`note: ${p.startCourseNote.trim()}`);
  }
  return `• ${parts.join(" · ")}`;
}

export function buildStartKursusKontorReport(params: {
  courseTitle: string;
  participants: KontorParticipant[];
  allArrived: boolean;
  leaderMessage?: string;
}): string {
  const active = params.participants.filter(isActiveParticipant);
  const headline = params.allArrived
    ? `Alle er ankommet til ${params.courseTitle}.`
    : `Indtjekning sendt fra Start kursus — ${params.courseTitle} (ikke alle ankommet).`;

  const lines = [headline, ""];

  if (params.leaderMessage?.trim()) {
    lines.push(`Besked fra kursusleder: ${params.leaderMessage.trim()}`, "");
  }

  lines.push(`Deltagere (${active.length}):`);
  for (const p of active) {
    lines.push(participantLine(p));
  }

  return lines.join("\n");
}

export function countArrived(participants: KontorParticipant[]): {
  total: number;
  arrived: number;
  allArrived: boolean;
} {
  const active = participants.filter(isActiveParticipant);
  const arrived = active.filter((p) => p.arrivedAt).length;
  return {
    total: active.length,
    arrived,
    allArrived: active.length > 0 && arrived === active.length,
  };
}
