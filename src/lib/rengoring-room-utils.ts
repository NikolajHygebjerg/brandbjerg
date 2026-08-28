import { getIsoWeekForDate } from "./kitchen-active-meal";
import { loadParticipantsForCourse, loadRoomGrid } from "./kontor-storage";
import { loadAnsatVaerelseBookings } from "./ansat-vaerelse-booking-storage";
import { getCoursesForYear } from "./course-list";
import { eachNight, addDaysIso } from "./date-utils";
import { getAllRoomNumbers, roomWeekKey, roomFloor } from "./room-utils";
import {
  getLatestVaerelseKlarDate,
  isVaerelseKlar,
} from "./rengoring-storage";

function parseIsoDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function isRoomOccupiedByParticipantsOnNight(
  roomNumber: string,
  night: string,
): boolean {
  const year = parseInt(night.slice(0, 4), 10);
  for (const course of getCoursesForYear(year)) {
    if (!course.startDate || !course.endDate) continue;
    const occupiedNights = eachNight(
      course.startDate,
      addDaysIso(course.endDate, 1),
    );
    if (!occupiedNights.includes(night)) continue;

    for (const p of loadParticipantsForCourse(course.id)) {
      if (p.status === "aflyst") continue;
      if (p.roomNumber === roomNumber) return true;
    }
  }
  return false;
}

function isRoomBookedByStaffOnNight(
  roomNumber: string,
  night: string,
): boolean {
  for (const booking of loadAnsatVaerelseBookings()) {
    if (booking.roomNumber !== roomNumber) continue;
    if (eachNight(booking.fromDate, booking.toDate).includes(night)) {
      return true;
    }
  }
  return false;
}

/** Om værelset har beboer natten til datoen (ifølge værelsesplan). */
export function isRoomInUseOnNight(
  roomNumber: string,
  night: string,
): boolean {
  const { year, weekNumber } = getIsoWeekForDate(parseIsoDateLocal(night));
  const grid = loadRoomGrid(year);
  const cell = grid[roomWeekKey(roomNumber, year, weekNumber)];

  if (cell?.status === "optaget" || cell?.status === "ansatte") return true;
  if (isRoomOccupiedByParticipantsOnNight(roomNumber, night)) {
    return true;
  }
  if (isRoomBookedByStaffOnNight(roomNumber, night)) return true;

  return false;
}

function findLastUseNightBefore(
  roomNumber: string,
  beforeDate: string,
  lookbackDays = 21,
): string | null {
  for (let i = 1; i <= lookbackDays; i++) {
    const night = addDaysIso(beforeDate, -i);
    if (isRoomInUseOnNight(roomNumber, night)) return night;
  }
  return null;
}

export interface RengoringVaerelseRow {
  roomNumber: string;
  floor: number;
  inUse: boolean;
  klar: boolean;
  needsCleaning: boolean;
}

export function getVaerelserForRengoringDate(
  date: string,
): RengoringVaerelseRow[] {
  const rows: RengoringVaerelseRow[] = [];

  for (const roomNumber of getAllRoomNumbers()) {
    const inUse = isRoomInUseOnNight(roomNumber, date);
    const klar = isVaerelseKlar(roomNumber, date);

    const checkoutToday =
      isRoomInUseOnNight(roomNumber, addDaysIso(date, -1)) && !inUse;

    const lastUse = findLastUseNightBefore(roomNumber, date);
    let dirtySinceLastUse = false;
    if (lastUse) {
      const lastKlar = getLatestVaerelseKlarDate(roomNumber, date);
      dirtySinceLastUse = !lastKlar || lastKlar < lastUse;
    }

    const relevant = inUse || checkoutToday || dirtySinceLastUse;
    if (!relevant) continue;

    const needsCleaning = !klar && relevant;

    rows.push({
      roomNumber,
      floor: roomFloor(roomNumber),
      inUse,
      klar,
      needsCleaning,
    });
  }

  return rows.sort(
    (a, b) => a.floor - b.floor || a.roomNumber.localeCompare(b.roomNumber),
  );
}

export function countVaerelserNeedingCleaning(date: string): number {
  return getVaerelserForRengoringDate(date).filter((r) => r.needsCleaning)
    .length;
}

/** Værelser der forlades på datoen (check-out dag). */
export function getVaerelserWithCheckoutOnDate(date: string): string[] {
  const rooms: string[] = [];
  for (const roomNumber of getAllRoomNumbers()) {
    const checkoutToday =
      isRoomInUseOnNight(roomNumber, addDaysIso(date, -1)) &&
      !isRoomInUseOnNight(roomNumber, date);
    if (checkoutToday) rooms.push(roomNumber);
  }
  return rooms.sort(
    (a, b) => roomFloor(a) - roomFloor(b) || a.localeCompare(b),
  );
}
