"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BedDouble, CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import {
  ANSAT_VAERELSE_BOOKING_UPDATED_EVENT,
  cancelAnsatVaerelseBooking,
  createAnsatVaerelseBooking,
  getBookingsForUser,
} from "@/lib/ansat-vaerelse-booking-storage";
import {
  bookingConflictsWithExisting,
  defaultBookingRange,
  getAvailableRoomsForRange,
  getUpcomingNightAvailability,
  isBookingRangeValid,
  isRoomAvailableForRange,
} from "@/lib/ansat-vaerelse-availability";
import { getAllRoomNumbers, roomFloor } from "@/lib/room-utils";
import {
  addDaysIso,
  formatDateDa,
  formatDateDaShort,
  nightCount,
  todayIso,
} from "@/lib/date-utils";

export function AnsatVaerelseBookingPage() {
  const { user } = useAuth();
  const defaults = defaultBookingRange();
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [bookingFrom, setBookingFrom] = useState(defaults.fromDate);
  const [bookingTo, setBookingTo] = useState(defaults.toDate);
  const [needsBedding, setNeedsBedding] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onUpdate() {
      reload();
    }
    window.addEventListener(ANSAT_VAERELSE_BOOKING_UPDATED_EVENT, onUpdate);
    window.addEventListener("brandbjerg-kontor-updated", onUpdate);
    return () => {
      window.removeEventListener(ANSAT_VAERELSE_BOOKING_UPDATED_EVENT, onUpdate);
      window.removeEventListener("brandbjerg-kontor-updated", onUpdate);
    };
  }, [reload]);

  const upcoming = useMemo(
    () => getUpcomingNightAvailability(60),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );

  const availableRooms = useMemo(
    () => getAvailableRoomsForRange(fromDate, toDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fromDate, toDate, tick],
  );

  const myBookings = useMemo(
    () => (user ? getBookingsForUser(user.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, tick],
  );

  const roomsByFloor = useMemo(() => {
    const set = new Set(availableRooms);
    return [1, 2, 3].map((floor) => ({
      floor,
      rooms: getAllRoomNumbers().filter(
        (r) => roomFloor(r) === floor && set.has(r),
      ),
    }));
  }, [availableRooms]);

  function openBookingDialog(room: string) {
    setSelectedRoom(room);
    setBookingFrom(fromDate);
    setBookingTo(toDate);
    setNeedsBedding(false);
    setBookingError(null);
  }

  function closeBookingDialog() {
    setSelectedRoom(null);
    setBookingError(null);
  }

  function handleBook() {
    if (!user || !selectedRoom) return;

    const validation = isBookingRangeValid(bookingFrom, bookingTo);
    if (!validation.ok) {
      setBookingError(validation.error ?? "Ugyldig periode");
      return;
    }

    if (!isRoomAvailableForRange(selectedRoom, bookingFrom, bookingTo)) {
      setBookingError("Værelset er ikke længere ledigt i den valgte periode.");
      return;
    }

    if (bookingConflictsWithExisting(selectedRoom, bookingFrom, bookingTo)) {
      setBookingError("Værelset er allerede booket i den valgte periode.");
      return;
    }

    createAnsatVaerelseBooking({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      roomNumber: selectedRoom,
      fromDate: bookingFrom,
      toDate: bookingTo,
      needsBedding,
    });

    closeBookingDialog();
    reload();
  }

  function selectNight(date: string) {
    setFromDate(date);
    setToDate(addDaysIso(date, 1));
  }

  if (!hydrated || !user) {
    return (
      <Card>
        <CardDescription>Indlæser værelsesbooking…</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <BedDouble className="h-6 w-6 text-teal-700" />
          <h1 className="text-2xl font-bold text-slate-900">Værelsesbooking</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Book ledige værelser til overnatning — viser ledige værelser på alle
          kommende datoer fra i dag.
        </p>
      </div>

      {myBookings.length > 0 && (
        <Card>
          <CardTitle className="text-base">Mine bookinger</CardTitle>
          <ul className="mt-3 divide-y divide-slate-100">
            {myBookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <span className="font-semibold tabular-nums text-slate-900">
                    Værelse {b.roomNumber}
                  </span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-600">
                    {formatDateDa(b.fromDate)} – {formatDateDa(b.toDate)}
                  </span>
                  {b.needsBedding && (
                    <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
                      Sengetøj
                    </span>
                  )}
                </div>
                <Button
                  variant="secondary"
                  className="h-8 text-xs"
                  onClick={() => {
                    cancelAnsatVaerelseBooking(b.id);
                    reload();
                  }}
                >
                  Aflys
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-teal-700" />
          Ledige værelser pr. dato
        </CardTitle>
        <CardDescription className="mt-1">
          Klik på en dato for at se ledige værelser den nat. I dag er markeret.
        </CardDescription>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {upcoming.map(({ date, availableCount }) => {
            const isToday = date === todayIso();
            const isSelected = fromDate === date && toDate === addDaysIso(date, 1);
            return (
              <button
                key={date}
                type="button"
                onClick={() => selectNight(date)}
                className={`min-w-[5.5rem] shrink-0 rounded-lg border px-3 py-2 text-left transition ${
                  isSelected
                    ? "border-teal-500 bg-teal-50 ring-2 ring-teal-200"
                    : isToday
                      ? "border-teal-300 bg-teal-50/50 hover:bg-teal-50"
                      : "border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50"
                }`}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  {isToday ? "I dag" : formatDateDaShort(date).split(" ")[0]}
                </p>
                <p className="text-xs font-semibold text-slate-800">
                  {formatDateDaShort(date).replace(/^[^\s]+\s/, "")}
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-teal-700">
                  {availableCount}
                </p>
                <p className="text-[10px] text-slate-500">ledige</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle className="text-base">Søg ledige værelser</CardTitle>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Fra dato (check-in)
            </span>
            <input
              type="date"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={fromDate}
              min={todayIso()}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Til dato (check-out)
            </span>
            <input
              type="date"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={toDate}
              min={addDaysIso(fromDate, 1)}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
          <p className="text-sm text-slate-500">
            {nightCount(fromDate, toDate)}{" "}
            {nightCount(fromDate, toDate) === 1 ? "nat" : "nætter"} ·{" "}
            <span className="font-medium text-teal-700">
              {availableRooms.length} ledige værelser
            </span>
          </p>
        </div>

        {availableRooms.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            Ingen ledige værelser i den valgte periode. Prøv andre datoer.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {roomsByFloor.map(
              ({ floor, rooms }) =>
                rooms.length > 0 && (
                  <div key={floor}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {floor}. sal · {rooms.length} ledige
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rooms.map((room) => (
                        <button
                          key={room}
                          type="button"
                          onClick={() => openBookingDialog(room)}
                          className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold tabular-nums text-teal-900 transition hover:border-teal-400 hover:bg-teal-100"
                        >
                          {room}
                        </button>
                      ))}
                    </div>
                  </div>
                ),
            )}
          </div>
        )}
      </Card>

      {selectedRoom && (
        <BookingDialog
          roomNumber={selectedRoom}
          fromDate={bookingFrom}
          toDate={bookingTo}
          needsBedding={needsBedding}
          error={bookingError}
          onFromChange={setBookingFrom}
          onToChange={setBookingTo}
          onNeedsBeddingChange={setNeedsBedding}
          onClose={closeBookingDialog}
          onBook={handleBook}
        />
      )}
    </div>
  );
}

function BookingDialog({
  roomNumber,
  fromDate,
  toDate,
  needsBedding,
  error,
  onFromChange,
  onToChange,
  onNeedsBeddingChange,
  onClose,
  onBook,
}: {
  roomNumber: string;
  fromDate: string;
  toDate: string;
  needsBedding: boolean;
  error: string | null;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onNeedsBeddingChange: (v: boolean) => void;
  onClose: () => void;
  onBook: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-dialog-title"
      >
        <div className="flex items-start justify-between border-b border-teal-100 bg-teal-50 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-800">
              Book værelse
            </p>
            <h2
              id="booking-dialog-title"
              className="mt-0.5 text-xl font-bold tabular-nums text-slate-900"
            >
              Værelse {roomNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/60"
            aria-label="Luk"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Fra dato
            </span>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={fromDate}
              min={todayIso()}
              onChange={(e) => onFromChange(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Til dato
            </span>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={toDate}
              min={addDaysIso(fromDate, 1)}
              onChange={(e) => onToChange(e.target.value)}
            />
          </label>

          <p className="text-xs text-slate-500">
            {nightCount(fromDate, toDate)}{" "}
            {nightCount(fromDate, toDate) === 1 ? "nat" : "nætter"} · check-out
            er på til-datoen
          </p>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-teal-600"
              checked={needsBedding}
              onChange={(e) => onNeedsBeddingChange(e.target.checked)}
            />
            <span className="font-medium text-slate-800">
              Har brug for sengetøj
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button className="flex-1" onClick={onBook}>
              Book
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Annuller
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
