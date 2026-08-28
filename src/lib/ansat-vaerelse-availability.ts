import { getIsoWeekForDate } from "./kitchen-active-meal";
import { loadParticipantsForCourse } from "./kontor-storage";
import { loadRoomGrid } from "./kontor-storage";
import { statusarkCourses, statusarkYear } from "./brandbjerg-statusark";
import type { RoomWeekCell } from "./kontor-types";
import { loadAnsatVaerelseBookings } from "./ansat-vaerelse-booking-storage";
import {
  dateRangesOverlap,
  eachNight,
  todayIso,
  upcomingDatesFromToday,
  addDaysIso,
} from "./date-utils";
import { roomWeekKey, getAllRoomNumbers } from "./room-utils";

export { getAllRoomNumbers };

function isGridCellBlockedForStaff(cell: RoomWeekCell | undefined): boolean {
  if (!cell) return false;
  if (cell.status === "ansatte") return false;
  if (
    cell.status === "lukket" ||
    cell.status === "buffer" ||
    cell.status === "optaget"
  ) {
    return true;
  }
  if (cell.status === "andet" && cell.note?.toLowerCase().includes("lukket")) {
    return true;
  }
  return false;
}

function isRoomOccupiedByParticipants(
  roomNumber: string,
  year: number,
  week: number,
): boolean {
  for (const course of statusarkCourses) {
    if (course.courseWeekNumber !== week) continue;
    const courseYear = course.startDate
      ? parseInt(course.startDate.slice(0, 4), 10)
      : statusarkYear;
    if (courseYear !== year) continue;

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
    const nights = eachNight(booking.fromDate, booking.toDate);
    if (nights.includes(night)) return true;
  }
  return false;
}

export function isRoomAvailableOnNight(
  roomNumber: string,
  night: string,
): boolean {
  const { year, weekNumber } = getIsoWeekForDate(parseIsoDateLocal(night));
  const grid = loadRoomGrid(year);
  const cell = grid[roomWeekKey(roomNumber, year, weekNumber)];

  if (isGridCellBlockedForStaff(cell)) return false;
  if (isRoomOccupiedByParticipants(roomNumber, year, weekNumber)) return false;
  if (isRoomBookedByStaffOnNight(roomNumber, night)) return false;

  return true;
}

function parseIsoDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function getAvailableRoomsForNight(night: string): string[] {
  return getAllRoomNumbers().filter((room) => isRoomAvailableOnNight(room, night));
}

export function getAvailableRoomsForRange(
  fromDate: string,
  toDateExclusive: string,
): string[] {
  const nights = eachNight(fromDate, toDateExclusive);
  if (nights.length === 0) return [];

  return getAllRoomNumbers().filter((room) =>
    nights.every((night) => isRoomAvailableOnNight(room, night)),
  );
}

export function isRoomAvailableForRange(
  roomNumber: string,
  fromDate: string,
  toDateExclusive: string,
): boolean {
  const nights = eachNight(fromDate, toDateExclusive);
  if (nights.length === 0) return false;
  return nights.every((night) => isRoomAvailableOnNight(roomNumber, night));
}

export function isBookingRangeValid(
  fromDate: string,
  toDateExclusive: string,
): { ok: boolean; error?: string } {
  if (!fromDate || !toDateExclusive) {
    return { ok: false, error: "Angiv fra- og til-dato." };
  }
  if (toDateExclusive <= fromDate) {
    return { ok: false, error: "Til-dato skal være efter fra-dato." };
  }
  if (fromDate < todayIso()) {
    return { ok: false, error: "Du kan ikke booke i fortiden." };
  }
  return { ok: true };
}

export function bookingConflictsWithExisting(
  roomNumber: string,
  fromDate: string,
  toDateExclusive: string,
  excludeBookingId?: string,
): boolean {
  return loadAnsatVaerelseBookings().some(
    (b) =>
      b.id !== excludeBookingId &&
      b.roomNumber === roomNumber &&
      dateRangesOverlap(fromDate, toDateExclusive, b.fromDate, b.toDate),
  );
}

export interface NightAvailabilitySummary {
  date: string;
  availableCount: number;
  availableRooms: string[];
}

export function getUpcomingNightAvailability(
  dayCount = 60,
): NightAvailabilitySummary[] {
  return upcomingDatesFromToday(dayCount).map((date) => {
    const rooms = getAvailableRoomsForNight(date);
    return {
      date,
      availableCount: rooms.length,
      availableRooms: rooms,
    };
  });
}

export function defaultBookingRange(): { fromDate: string; toDate: string } {
  const fromDate = todayIso();
  return {
    fromDate,
    toDate: addDaysIso(fromDate, 1),
  };
}
