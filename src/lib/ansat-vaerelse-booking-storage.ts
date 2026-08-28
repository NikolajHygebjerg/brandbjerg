import type { AnsatVaerelseBooking } from "./ansat-vaerelse-booking-types";

const STORAGE_KEY = "brandbjerg-ansat-vaerelse-bookings";
export const ANSAT_VAERELSE_BOOKING_UPDATED_EVENT = "brandbjerg-ansat-vaerelse-booking-updated";

function emitUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ANSAT_VAERELSE_BOOKING_UPDATED_EVENT));
  }
}

export function loadAnsatVaerelseBookings(): AnsatVaerelseBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AnsatVaerelseBooking[];
  } catch {
    return [];
  }
}

function saveAll(bookings: AnsatVaerelseBooking[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  emitUpdate();
}

export function createAnsatVaerelseBooking(
  input: Omit<AnsatVaerelseBooking, "id" | "createdAt">,
): AnsatVaerelseBooking {
  const booking: AnsatVaerelseBooking = {
    ...input,
    id: `avb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const all = loadAnsatVaerelseBookings();
  all.push(booking);
  saveAll(all);
  return booking;
}

export function cancelAnsatVaerelseBooking(id: string): void {
  const all = loadAnsatVaerelseBookings().filter((b) => b.id !== id);
  saveAll(all);
}

export function getBookingsForUser(userId: string): AnsatVaerelseBooking[] {
  const today = new Date().toISOString().slice(0, 10);
  return loadAnsatVaerelseBookings()
    .filter((b) => b.userId === userId && b.toDate >= today)
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate));
}

export function getActiveBookingsForRoom(roomNumber: string): AnsatVaerelseBooking[] {
  const today = new Date().toISOString().slice(0, 10);
  return loadAnsatVaerelseBookings().filter(
    (b) => b.roomNumber === roomNumber && b.toDate > today,
  );
}
