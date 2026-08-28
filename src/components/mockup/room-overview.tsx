"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BedDouble, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  KONTOR_UPDATED_EVENT,
  loadParticipantsForCourse,
  loadRoomGrid,
  saveRoomGrid,
  setRoomWeekCells,
} from "@/lib/kontor-storage";
import { relocateFromClosedRoom } from "@/lib/kontor-room-assignment";
import { statusarkCourses, statusarkYear } from "@/lib/brandbjerg-statusark";
import {
  roomStatusLabels,
  type RoomWeekStatusType,
} from "@/lib/kontor-types";
import {
  getAllRoomNumbers,
  roomFloor,
  roomWeekKey,
  weeksForYear,
  ROOM_COUNT,
} from "@/lib/room-utils";

const STATUS_COLORS: Record<RoomWeekStatusType, string> = {
  ledigt: "bg-emerald-200 hover:bg-emerald-300",
  optaget: "bg-violet-400 hover:bg-violet-500",
  andet: "bg-amber-300 hover:bg-amber-400",
  lukket: "bg-red-400 hover:bg-red-500",
  buffer: "bg-sky-300 hover:bg-sky-400",
  ansatte: "bg-orange-300 hover:bg-orange-400",
};

const WEEKS_VISIBLE = 16;

export function RoomOverview() {
  const [year, setYear] = useState(statusarkYear);
  const [weekStart, setWeekStart] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [grid, setGrid] = useState<Record<string, import("@/lib/kontor-types").RoomWeekCell>>({});
  const [statusChoice, setStatusChoice] = useState<RoomWeekStatusType>("ledigt");
  const [note, setNote] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const dragRoomRef = useRef<string | null>(null);

  const reload = useCallback(() => {
    setGrid(loadRoomGrid(year));
  }, [year]);

  useEffect(() => {
    reload();
    setHydrated(true);
  }, [reload]);

  useEffect(() => {
    function onUpdate() {
      reload();
    }
    window.addEventListener(KONTOR_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(KONTOR_UPDATED_EVENT, onUpdate);
  }, [reload]);

  const rooms = useMemo(() => getAllRoomNumbers(), []);
  const weeks = useMemo(() => weeksForYear(year), [year]);
  const visibleWeeks = weeks.slice(weekStart - 1, weekStart - 1 + WEEKS_VISIBLE);

  const participantRooms = useMemo(() => {
    const map = new Map<string, { name: string; courseTitle: string }[]>();
    for (const course of statusarkCourses) {
      for (const p of loadParticipantsForCourse(course.id)) {
        if (!p.roomNumber) continue;
        const key = roomWeekKey(p.roomNumber, year, course.courseWeekNumber);
        const list = map.get(key) ?? [];
        list.push({ name: p.name, courseTitle: course.title });
        map.set(key, list);
      }
    }
    return map;
  }, [year, grid, hydrated]);

  const selectedWeeks = useMemo(() => {
    if (rangeStart == null) return [];
    const end = rangeEnd ?? rangeStart;
    const lo = Math.min(rangeStart, end);
    const hi = Math.max(rangeStart, end);
    return weeks.filter((w) => w >= lo && w <= hi);
  }, [rangeStart, rangeEnd, weeks]);

  function getCellStatus(room: string, week: number) {
    const key = roomWeekKey(room, year, week);
    const cell = grid[key];
    if (cell) return cell;
    if (participantRooms.has(key)) {
      return { status: "optaget" as const, courseId: undefined };
    }
    return null;
  }

  function handleWeekMouseDown(room: string, week: number) {
    setSelectedRoom(room);
    dragRoomRef.current = room;
    setRangeStart(week);
    setRangeEnd(week);
    setDragging(true);
  }

  function handleWeekMouseEnter(room: string, week: number) {
    if (!dragging || dragRoomRef.current !== room) return;
    setRangeEnd(week);
  }

  useEffect(() => {
    function stopDrag() {
      setDragging(false);
      dragRoomRef.current = null;
    }
    window.addEventListener("mouseup", stopDrag);
    return () => window.removeEventListener("mouseup", stopDrag);
  }, []);

  function applyStatus() {
    if (!selectedRoom || selectedWeeks.length === 0) return;
    const keys = selectedWeeks.map((w) => roomWeekKey(selectedRoom, year, w));
    const cell = {
      status: statusChoice,
      note: note.trim() || undefined,
    };
    setRoomWeekCells(year, keys, cell);
    if (statusChoice === "lukket") {
      relocateFromClosedRoom(selectedRoom, year, selectedWeeks);
    }
    setNote("");
    reload();
  }

  function clearSelection() {
    if (!selectedRoom || selectedWeeks.length === 0) return;
    const next = { ...loadRoomGrid(year) };
    for (const w of selectedWeeks) {
      delete next[roomWeekKey(selectedRoom, year, w)];
    }
    saveRoomGrid(year, next);
    reload();
  }

  if (!hydrated) {
    return (
      <Card>
        <CardDescription>Indlæser værelsesoversigt…</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/kontor"
          className="text-sm text-violet-700 hover:underline"
        >
          ← Tilbage til kontor
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <BedDouble className="h-6 w-6 text-violet-700" />
          <h1 className="text-2xl font-bold text-slate-900">Værelsesoversigt</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {ROOM_COUNT} dobbeltværelser · vælg værelse og uge(r) — klik eller træk
          hen over ugerne
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">År</span>
            <select
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="h-8 px-2"
              onClick={() => setWeekStart(Math.max(1, weekStart - WEEKS_VISIBLE))}
              disabled={weekStart <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600">
              Uge {weekStart}–{Math.min(52, weekStart + WEEKS_VISIBLE - 1)}
            </span>
            <Button
              variant="secondary"
              className="h-8 px-2"
              onClick={() =>
                setWeekStart(Math.min(52 - WEEKS_VISIBLE + 1, weekStart + WEEKS_VISIBLE))
              }
              disabled={weekStart + WEEKS_VISIBLE > 52}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {(Object.keys(STATUS_COLORS) as RoomWeekStatusType[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded ${STATUS_COLORS[s]}`} />
                {roomStatusLabels[s]}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-slate-100 ring-1 ring-slate-200" />
              Tom
            </span>
          </div>
        </div>
      </Card>

      {selectedRoom && selectedWeeks.length > 0 && (
        <Card className="border-violet-200 bg-violet-50">
          <CardTitle className="text-base text-violet-900">
            Værelse {selectedRoom} · uge{" "}
            {selectedWeeks.length === 1
              ? selectedWeeks[0]
              : `${selectedWeeks[0]}–${selectedWeeks[selectedWeeks.length - 1]}`}
          </CardTitle>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Status
              </span>
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={statusChoice}
                onChange={(e) =>
                  setStatusChoice(e.target.value as RoomWeekStatusType)
                }
              >
                <option value="optaget">Optaget</option>
                <option value="ledigt">Ledigt</option>
                <option value="buffer">Buffer</option>
                <option value="ansatte">Ansatte</option>
                <option value="andet">Andet</option>
                <option value="lukket">Lukket (flytter kursister automatisk)</option>
              </select>
            </label>
            {(statusChoice === "andet" ||
              statusChoice === "lukket" ||
              statusChoice === "buffer" ||
              statusChoice === "ansatte") && (
              <label className="min-w-[200px] flex-1 text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Note
                </span>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Fx sprængt vandrør, renovation…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
            )}
            <Button onClick={applyStatus}>Gem status</Button>
            <Button variant="secondary" onClick={clearSelection}>
              Ryd markering
            </Button>
          </div>
          {statusChoice === "lukket" && (
            <p className="mt-2 text-xs text-red-800">
              Ved lukket værelse forsøger systemet automatisk at flytte kursister
              til ledige værelser — ellers vises en advarsel på kontorsiden.
            </p>
          )}
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-left font-semibold text-slate-600">
                  Værelse
                </th>
                {visibleWeeks.map((w) => (
                  <th
                    key={w}
                    className="border-b border-slate-200 px-0.5 py-2 text-center font-medium text-slate-500"
                  >
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((floor) => {
                const floorRooms = rooms.filter((r) => roomFloor(r) === floor);
                return floorRooms.map((room) => (
                  <tr key={room} className="border-b border-slate-100">
                    <td
                      className={`sticky left-0 z-10 border-r border-slate-200 px-2 py-0.5 font-medium tabular-nums ${
                        selectedRoom === room
                          ? "bg-violet-100 text-violet-900"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      <button
                        type="button"
                        className="w-full text-left hover:underline"
                        onClick={() => {
                          setSelectedRoom(room);
                          setRangeStart(null);
                          setRangeEnd(null);
                        }}
                      >
                        {room}
                      </button>
                    </td>
                    {visibleWeeks.map((week) => {
                      const cell = getCellStatus(room, week);
                      const status = cell?.status;
                      const inRange =
                        selectedRoom === room &&
                        selectedWeeks.includes(week);
                      const occupants = participantRooms.get(
                        roomWeekKey(room, year, week),
                      );
                      return (
                        <td key={week} className="p-0.5">
                          <button
                            type="button"
                            title={
                              occupants
                                ? occupants
                                    .map((o) => `${o.name} (${o.courseTitle})`)
                                    .join(", ")
                                : cell?.note ?? status ?? "Tom"
                            }
                            onMouseDown={() => handleWeekMouseDown(room, week)}
                            onMouseEnter={() => handleWeekMouseEnter(room, week)}
                            className={`h-5 w-full min-w-[14px] rounded-sm transition ${
                              inRange
                                ? "ring-2 ring-violet-500 ring-offset-1"
                                : ""
                            } ${
                              status
                                ? STATUS_COLORS[status]
                                : "bg-slate-100 hover:bg-slate-200"
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
