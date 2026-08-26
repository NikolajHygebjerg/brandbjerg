/** Brandbjerg dobbeltværelser: 101–136, 201–236, 301–336 (108 stk.) */
export function getAllRoomNumbers(): string[] {
  const rooms: string[] = [];
  for (const start of [101, 201, 301]) {
    for (let n = 0; n < 36; n++) {
      rooms.push(String(start + n));
    }
  }
  return rooms;
}

export const ROOM_COUNT = getAllRoomNumbers().length;

export function roomFloor(roomNumber: string): number {
  return parseInt(roomNumber.charAt(0), 10) || 1;
}

export function isGroundFloor(roomNumber: string): boolean {
  return roomFloor(roomNumber) === 1;
}

export function isNearDiningHall(roomNumber: string): boolean {
  const num = parseInt(roomNumber, 10);
  return num >= 101 && num <= 115;
}

export function weeksForYear(year: number): number[] {
  return Array.from({ length: 52 }, (_, i) => i + 1);
}

export function roomWeekKey(roomNumber: string, year: number, week: number): string {
  return `${roomNumber}-${year}-${week}`;
}

export function parseRoomWeekKey(key: string): {
  roomNumber: string;
  year: number;
  week: number;
} | null {
  const m = key.match(/^(\d{3})-(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  return {
    roomNumber: m[1],
    year: parseInt(m[2], 10),
    week: parseInt(m[3], 10),
  };
}
