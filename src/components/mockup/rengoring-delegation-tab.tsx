"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { listUsersByRole } from "@/lib/auth-storage";
import {
  addDaysIso,
  formatDateDa,
  formatDateDaShort,
  parseIsoDate,
  toIsoDate,
} from "@/lib/date-utils";
import {
  getAllLokalerForDelegation,
  isLokaleActiveDuringWeek,
  isVaerelseActiveDuringWeek,
  lokaleTargetKey,
  vaerelseTargetKey,
} from "@/lib/rengoring-delegation-utils";
import {
  getAllVaerelserGridForDate,
  type RengoringVaerelseRow,
} from "@/lib/rengoring-room-utils";
import {
  getLokalerForRengoringDate,
} from "@/lib/rengoring-lokale-utils";
import {
  getAllRoomsByBuildingColumn,
  ROOM_BUILDING_COLUMNS,
} from "@/lib/room-utils";
import { CompactMonthCalendar } from "@/components/mockup/rengoring-vaerelser-tab";
import { KONTOR_UPDATED_EVENT } from "@/lib/kontor-storage";
import { ANSAT_VAERELSE_BOOKING_UPDATED_EVENT } from "@/lib/ansat-vaerelse-booking-storage";
import {
  countUnpublishedAssignments,
  getAssignmentForTarget,
  publishAssignmentsForDate,
  RENGORING_TASKS_UPDATED_EVENT,
  upsertRengoringAssignment,
} from "@/lib/rengoring-task-storage";

type DelegationSection = "vaerelser" | "lokaler";

function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toIsoDate(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function RengoringDelegationTab({ today }: { today: string }) {
  const [selectedDate, setSelectedDate] = useState(today);
  const [section, setSection] = useState<DelegationSection>("vaerelser");
  const [weekFilter, setWeekFilter] = useState(false);
  const [tick, setTick] = useState(0);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  const dragModeRef = useRef<"select" | "deselect">("select");
  const dragStartRoomRef = useRef<string | null>(null);

  const viewDate = parseIsoDate(selectedDate);
  const [calendarYear, setCalendarYear] = useState(viewDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(viewDate.getMonth());

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    function onUpdate() {
      reload();
    }
    window.addEventListener(RENGORING_TASKS_UPDATED_EVENT, onUpdate);
    window.addEventListener(KONTOR_UPDATED_EVENT, onUpdate);
    window.addEventListener(ANSAT_VAERELSE_BOOKING_UPDATED_EVENT, onUpdate);
    return () => {
      window.removeEventListener(RENGORING_TASKS_UPDATED_EVENT, onUpdate);
      window.removeEventListener(KONTOR_UPDATED_EVENT, onUpdate);
      window.removeEventListener(
        ANSAT_VAERELSE_BOOKING_UPDATED_EVENT,
        onUpdate,
      );
    };
  }, [reload]);

  useEffect(() => {
    const d = parseIsoDate(selectedDate);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
    setSelectedRooms(new Set());
  }, [selectedDate]);

  useEffect(() => {
    function stopDrag() {
      setDragging(false);
      dragStartRoomRef.current = null;
    }
    window.addEventListener("mouseup", stopDrag);
    return () => window.removeEventListener("mouseup", stopDrag);
  }, []);

  const assistants = useMemo(
    () => listUsersByRole("rengoringsassistent"),
    [tick],
  );

  const monthGrid = useMemo(
    () => buildMonthGrid(calendarYear, calendarMonth),
    [calendarYear, calendarMonth],
  );

  const vaerelser = useMemo(
    () => getAllVaerelserGridForDate(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, tick],
  );

  const rowByRoom = useMemo(() => {
    const map = new Map<string, RengoringVaerelseRow>();
    for (const row of vaerelser) {
      map.set(row.roomNumber, row);
    }
    return map;
  }, [vaerelser]);

  const allByColumn = useMemo(() => getAllRoomsByBuildingColumn(), []);

  const lokaler = useMemo(
    () => getLokalerForRengoringDate(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, tick],
  );

  const allSchoolLokaler = useMemo(() => getAllLokalerForDelegation(), []);

  const visibleLokaler = useMemo(() => {
    if (weekFilter) {
      return allSchoolLokaler
        .filter((name) => isLokaleActiveDuringWeek(name, selectedDate))
        .map((name) => {
          const fromCourse = lokaler.find((l) => l.lokale === name);
          return (
            fromCourse ?? {
              id: name,
              lokale: name,
              courseTitle: "—",
              courseId: "",
              dayDate: selectedDate,
              timeSpan: "",
              klar: false,
            }
          );
        });
    }
    return lokaler;
  }, [allSchoolLokaler, lokaler, weekFilter, selectedDate, tick]);

  const unpublishedCount = useMemo(
    () => countUnpublishedAssignments(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, tick],
  );

  function prevMonth() {
    const d = new Date(calendarYear, calendarMonth - 1, 1);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
  }

  function nextMonth() {
    const d = new Date(calendarYear, calendarMonth + 1, 1);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
  }

  function handleYearChange(year: number) {
    setCalendarYear(year);
  }

  function assignVaerelse(roomNumber: string, assigneeUserId: string) {
    upsertRengoringAssignment({
      date: selectedDate,
      type: "vaerelse",
      targetKey: vaerelseTargetKey(roomNumber),
      label: `Værelse ${roomNumber}`,
      assigneeUserId,
    });
    reload();
  }

  function assignLokale(lokaleName: string, assigneeUserId: string) {
    upsertRengoringAssignment({
      date: selectedDate,
      type: "lokale",
      targetKey: lokaleTargetKey(lokaleName),
      label: lokaleName,
      assigneeUserId,
    });
    reload();
  }

  function handleRoomMouseDown(room: string) {
    dragStartRoomRef.current = room;
    setDragging(true);
    const already = selectedRooms.has(room);
    dragModeRef.current = already ? "deselect" : "select";
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      if (already) next.delete(room);
      else next.add(room);
      return next;
    });
  }

  function handleRoomMouseEnter(room: string) {
    if (!dragging || dragStartRoomRef.current === null) return;
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      if (dragModeRef.current === "select") next.add(room);
      else next.delete(room);
      return next;
    });
  }

  function batchAssignVaerelser(assigneeUserId: string) {
    for (const room of selectedRooms) {
      assignVaerelse(room, assigneeUserId);
    }
    setSelectedRooms(new Set());
  }

  function handlePublish() {
    const count = publishAssignmentsForDate(selectedDate);
    setPublishMessage(
      count > 0
        ? `${count} tildelinger godkendt — assistenter kan nu se opgaverne.`
        : "Ingen nye tildelinger at godkende.",
    );
    reload();
  }

  function roomVisibleInWeek(room: string): boolean {
    if (!weekFilter) return true;
    return isVaerelseActiveDuringWeek(room, selectedDate);
  }

  const visibleRoomCount = useMemo(() => {
    let count = 0;
    for (const rooms of Object.values(allByColumn)) {
      for (const room of rooms) {
        if (roomVisibleInWeek(room)) count += 1;
      }
    }
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allByColumn, weekFilter, selectedDate, tick]);

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
        <SectionTab
          active={section === "vaerelser"}
          onClick={() => setSection("vaerelser")}
        >
          Værelser
        </SectionTab>
        <SectionTab
          active={section === "lokaler"}
          onClick={() => setSection("lokaler")}
        >
          Lokaler
        </SectionTab>
      </div>

      {assistants.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Opret rengøringsassistenter under Brugere før du kan uddelegere.
        </p>
      )}

      {section === "vaerelser" ? (
        <Card>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">
                    Værelser · {formatDateDaShort(selectedDate)}
                  </CardTitle>
                  <CardDescription>
                    6 kolonner efter fløj og etage — træk for at vælge flere
                    værelser
                    {selectedDate === today ? " i dag" : ""}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedRooms.size > 0 && (
                    <BatchAssignBar
                      assistants={assistants}
                      count={selectedRooms.size}
                      onAssign={batchAssignVaerelser}
                    />
                  )}
                  <FilterButton
                    active={weekFilter}
                    onClick={() => setWeekFilter((v) => !v)}
                  >
                    Kun i brug denne uge
                  </FilterButton>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {visibleRoomCount} værelser vist · klik og træk for batchvalg
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {ROOM_BUILDING_COLUMNS.map((col) => (
                  <DelegationBuildingColumn
                    key={col.id}
                    column={col}
                    roomNumbers={allByColumn[col.id].filter(roomVisibleInWeek)}
                    rowByRoom={rowByRoom}
                    selectedDate={selectedDate}
                    selectedRooms={selectedRooms}
                    assistants={assistants}
                    onRoomMouseDown={handleRoomMouseDown}
                    onRoomMouseEnter={handleRoomMouseEnter}
                    onAssign={assignVaerelse}
                  />
                ))}
              </div>
            </div>

            <div className="w-full shrink-0 xl:w-[168px]">
              <CompactMonthCalendar
                selectedDate={selectedDate}
                today={today}
                calendarYear={calendarYear}
                calendarMonth={calendarMonth}
                monthGrid={monthGrid}
                onSelectDate={setSelectedDate}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
                onYearChange={handleYearChange}
              />
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">
                Lokaler · {formatDateDaShort(selectedDate)}
              </CardTitle>
              <CardDescription>
                Tildel ansvarlig assistent pr. lokale
                {selectedDate === today ? " i dag" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterButton
                active={weekFilter}
                onClick={() => setWeekFilter((v) => !v)}
              >
                Kun i brug denne uge
              </FilterButton>
              <DateNav
                selectedDate={selectedDate}
                today={today}
                onSelectDate={setSelectedDate}
              />
            </div>
          </div>

          {visibleLokaler.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Ingen lokaler med aktivitet på den valgte dato.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {visibleLokaler.map((l) => {
                const assignment = getAssignmentForTarget(
                  selectedDate,
                  "lokale",
                  lokaleTargetKey(l.lokale),
                );
                return (
                  <li
                    key={l.lokale}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 py-3",
                      assignment && !assignment.published && "bg-amber-50/40",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{l.lokale}</p>
                      {"courseTitle" in l && l.courseTitle && l.courseTitle !== "—" && (
                        <p className="text-sm text-slate-500">
                          {l.courseTitle}
                          {l.timeSpan ? ` · ${l.timeSpan}` : ""}
                        </p>
                      )}
                      {assignment?.published && (
                        <p className="text-xs text-emerald-700">Godkendt</p>
                      )}
                    </div>
                    <select
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={assignment?.assigneeUserId ?? ""}
                      disabled={assistants.length === 0}
                      onChange={(e) => assignLokale(l.lokale, e.target.value)}
                    >
                      <option value="">Ikke tildelt</option>
                      {assistants.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      <Card className="border-emerald-200 bg-emerald-50/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base text-emerald-900">
              Godkend tildelinger
            </CardTitle>
            <CardDescription className="mt-1 text-emerald-800/80">
              {formatDateDa(selectedDate)} ·{" "}
              {unpublishedCount > 0
                ? `${unpublishedCount} afventer godkendelse`
                : "Alle tildelinger er godkendt"}
            </CardDescription>
          </div>
          <Button
            onClick={handlePublish}
            disabled={unpublishedCount === 0 || assistants.length === 0}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Godkend og send til assistenter
          </Button>
        </div>
        {publishMessage && (
          <p className="mt-3 text-sm text-emerald-900">{publishMessage}</p>
        )}
      </Card>
    </div>
  );
}

function DelegationBuildingColumn({
  column,
  roomNumbers,
  rowByRoom,
  selectedDate,
  selectedRooms,
  assistants,
  onRoomMouseDown,
  onRoomMouseEnter,
  onAssign,
}: {
  column: (typeof ROOM_BUILDING_COLUMNS)[number];
  roomNumbers: string[];
  rowByRoom: Map<string, RengoringVaerelseRow>;
  selectedDate: string;
  selectedRooms: Set<string>;
  assistants: { id: string; name: string }[];
  onRoomMouseDown: (room: string) => void;
  onRoomMouseEnter: (room: string) => void;
  onAssign: (room: string, assigneeUserId: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col rounded-lg border",
        column.columnClass,
      )}
    >
      <div
        className={cn(
          "rounded-t-lg px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide",
          column.headerClass,
        )}
      >
        {column.label}
      </div>
      <div className="flex flex-col gap-1 p-1">
        {roomNumbers.length === 0 ? (
          <p className="px-1 py-4 text-center text-[10px] text-slate-400">—</p>
        ) : (
          roomNumbers.map((room) => {
            const row = rowByRoom.get(room);
            const assignment = getAssignmentForTarget(
              selectedDate,
              "vaerelse",
              vaerelseTargetKey(room),
            );
            const isSelected = selectedRooms.has(room);
            return (
              <div
                key={room}
                className={cn(
                  "select-none rounded border border-slate-200/80 bg-white px-1.5 py-1.5 text-center transition",
                  isSelected &&
                    "border-violet-500 bg-violet-50 ring-2 ring-violet-200",
                  row?.inUse && !isSelected && "ring-1 ring-amber-300",
                  row?.needsCleaning &&
                    !row.klar &&
                    !isSelected &&
                    "border-amber-300 bg-amber-50/50",
                  assignment &&
                    !assignment.published &&
                    !isSelected &&
                    "border-amber-300",
                )}
                onMouseDown={() => onRoomMouseDown(room)}
                onMouseEnter={() => onRoomMouseEnter(room)}
              >
                <p className="text-sm font-bold tabular-nums text-slate-900">
                  {room}
                </p>
                {row && (
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {row.inUse ? "I brug" : "Ledig"}
                  </p>
                )}
                <select
                  className="mt-1.5 w-full rounded border border-slate-200 px-0.5 py-0.5 text-[10px]"
                  value={assignment?.assigneeUserId ?? ""}
                  disabled={assistants.length === 0}
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => onAssign(room, e.target.value)}
                >
                  <option value="">—</option>
                  {assistants.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name.split(" ")[0]}
                    </option>
                  ))}
                </select>
                {assignment?.published && (
                  <p className="mt-0.5 text-[10px] text-emerald-700">
                    Godkendt
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DateNav({
  selectedDate,
  today,
  onSelectDate,
}: {
  selectedDate: string;
  today: string;
  onSelectDate: (d: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onSelectDate(addDaysIso(selectedDate, -1))}
        className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => onSelectDate(today)}
        className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
      >
        I dag
      </button>
      <button
        type="button"
        onClick={() => onSelectDate(addDaysIso(selectedDate, 1))}
        className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
      >
        →
      </button>
    </div>
  );
}

function SectionTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-md px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-white text-emerald-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition",
        active
          ? "bg-emerald-700 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200",
      )}
    >
      {children}
    </button>
  );
}

function BatchAssignBar({
  assistants,
  count,
  onAssign,
}: {
  assistants: { id: string; name: string }[];
  count: number;
  onAssign: (assigneeUserId: string) => void;
}) {
  const [batchAssignee, setBatchAssignee] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm">
      <span className="font-medium text-violet-900">{count} valgt</span>
      <select
        className="rounded border border-violet-200 px-2 py-1 text-sm"
        value={batchAssignee}
        onChange={(e) => setBatchAssignee(e.target.value)}
      >
        <option value="">Vælg assistent…</option>
        {assistants.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <Button
        className="h-8"
        disabled={!batchAssignee}
        onClick={() => {
          onAssign(batchAssignee);
          setBatchAssignee("");
        }}
      >
        Tildel alle
      </Button>
    </div>
  );
}
