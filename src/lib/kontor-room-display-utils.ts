import type { KontorParticipant } from "./kontor-types";
import { preferenceLabels } from "./kontor-types";

export function getParticipantTogetherLabel(
  participant: KontorParticipant,
  allParticipants: KontorParticipant[],
): string | null {
  if (participant.roomMateId) {
    const mate = allParticipants.find((p) => p.id === participant.roomMateId);
    if (mate) {
      return `${mate.name} (delt dobbeltværelse)`;
    }
  }

  const togetherPref = participant.preferences.find(
    (pref) => pref.type === "sammen_med",
  );
  if (togetherPref?.togetherWithParticipantId) {
    const mate = allParticipants.find(
      (p) => p.id === togetherPref.togetherWithParticipantId,
    );
    if (mate) {
      return `${mate.name} (ønske ved tilmelding)`;
    }
  }

  return null;
}

export function formatParticipantPreferences(
  participant: KontorParticipant,
): string[] {
  return participant.preferences.map((pref) => {
    let label = preferenceLabels[pref.type];
    if (pref.note) label += ` — ${pref.note}`;
    return label;
  });
}

export function groupParticipantsByRoom(
  participants: KontorParticipant[],
): {
  byRoom: Map<string, KontorParticipant[]>;
  unassigned: KontorParticipant[];
} {
  const byRoom = new Map<string, KontorParticipant[]>();
  const unassigned: KontorParticipant[] = [];

  for (const p of participants) {
    if (!p.roomNumber) {
      unassigned.push(p);
      continue;
    }
    const list = byRoom.get(p.roomNumber) ?? [];
    list.push(p);
    byRoom.set(p.roomNumber, list);
  }

  for (const list of byRoom.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, "da"));
  }
  unassigned.sort((a, b) => a.name.localeCompare(b.name, "da"));

  return { byRoom, unassigned };
}
