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

export type RoomBuildingColumn =
  | "red-top"
  | "red-bottom"
  | "yellow-top"
  | "yellow-bottom"
  | "orange-top"
  | "orange-bottom";

export const ROOM_BUILDING_COLUMNS: {
  id: RoomBuildingColumn;
  label: string;
  columnClass: string;
  headerClass: string;
}[] = [
  {
    id: "red-top",
    label: "Rød øverst",
    columnClass: "border-red-200 bg-red-50/40",
    headerClass: "bg-red-100 text-red-900",
  },
  {
    id: "red-bottom",
    label: "Rød nederst",
    columnClass: "border-red-200 bg-red-50/40",
    headerClass: "bg-red-100 text-red-900",
  },
  {
    id: "yellow-top",
    label: "Gul øverst",
    columnClass: "border-yellow-200 bg-yellow-50/40",
    headerClass: "bg-yellow-100 text-yellow-900",
  },
  {
    id: "yellow-bottom",
    label: "Gul nederst",
    columnClass: "border-yellow-200 bg-yellow-50/40",
    headerClass: "bg-yellow-100 text-yellow-900",
  },
  {
    id: "orange-top",
    label: "Orange øverst",
    columnClass: "border-orange-200 bg-orange-50/40",
    headerClass: "bg-orange-100 text-orange-900",
  },
  {
    id: "orange-bottom",
    label: "Orange nederst",
    columnClass: "border-orange-200 bg-orange-50/40",
    headerClass: "bg-orange-100 text-orange-900",
  },
];

export function getRoomBuildingColumn(roomNumber: string): RoomBuildingColumn {
  const num = parseInt(roomNumber, 10);
  const series = Math.floor(num / 100);
  const isOdd = num % 2 === 1;
  if (series === 1) return isOdd ? "red-top" : "red-bottom";
  if (series === 2) return isOdd ? "yellow-top" : "yellow-bottom";
  return isOdd ? "orange-top" : "orange-bottom";
}

export function groupRoomsByBuildingColumn(
  roomNumbers: string[],
): Record<RoomBuildingColumn, string[]> {
  const groups: Record<RoomBuildingColumn, string[]> = {
    "red-top": [],
    "red-bottom": [],
    "yellow-top": [],
    "yellow-bottom": [],
    "orange-top": [],
    "orange-bottom": [],
  };
  for (const room of roomNumbers) {
    groups[getRoomBuildingColumn(room)].push(room);
  }
  for (const col of ROOM_BUILDING_COLUMNS) {
    groups[col.id].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }
  return groups;
}

export function getAllRoomsByBuildingColumn(): Record<
  RoomBuildingColumn,
  string[]
> {
  return groupRoomsByBuildingColumn(getAllRoomNumbers());
}

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
