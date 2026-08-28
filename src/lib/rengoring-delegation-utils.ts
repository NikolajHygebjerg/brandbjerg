import { getIsoWeekForDate } from "./kitchen-active-meal";
import { getWeekDates } from "./arshjul-utils";
import { addDaysIso, parseIsoDate } from "./date-utils";
import { getAllRoomNumbers } from "./room-utils";
import { lokaler as allSchoolLokaler } from "./lokale-spec-options";
import { getLokalerForRengoringDate } from "./rengoring-lokale-utils";
import { isRoomInUseOnNight, getVaerelserForRengoringDate } from "./rengoring-room-utils";

export function getDatesInIsoWeek(anchorDate: string): string[] {
  const { year, weekNumber } = getIsoWeekForDate(parseIsoDate(anchorDate));
  const { startDate } = getWeekDates(year, weekNumber, 7);
  return Array.from({ length: 7 }, (_, i) => addDaysIso(startDate, i));
}

export function isVaerelseActiveDuringWeek(
  roomNumber: string,
  anchorDate: string,
): boolean {
  return getDatesInIsoWeek(anchorDate).some((date) => {
    if (isRoomInUseOnNight(roomNumber, date)) return true;
    return getVaerelserForRengoringDate(date).some(
      (v) => v.roomNumber === roomNumber,
    );
  });
}

export function isLokaleActiveDuringWeek(
  lokaleName: string,
  anchorDate: string,
): boolean {
  return getDatesInIsoWeek(anchorDate).some((date) =>
    getLokalerForRengoringDate(date).some((l) => l.lokale === lokaleName),
  );
}

export function getAllVaerelserForDelegation(): string[] {
  return getAllRoomNumbers();
}

export function getAllLokalerForDelegation(): string[] {
  const fromCourses = new Set<string>();
  for (const name of allSchoolLokaler) {
    if (name.trim()) fromCourses.add(name.trim());
  }
  return Array.from(fromCourses).sort((a, b) => a.localeCompare(b, "da"));
}

export function lokaleTargetKey(lokaleName: string): string {
  return `lokale:${lokaleName}`;
}

export function vaerelseTargetKey(roomNumber: string): string {
  return roomNumber;
}
