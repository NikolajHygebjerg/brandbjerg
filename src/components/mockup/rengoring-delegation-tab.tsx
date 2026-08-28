"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Users } from "lucide-react";
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
  todayIso,
} from "@/lib/date-utils";
import {
  getAllLokalerForDelegation,
  getAllVaerelserForDelegation,
  getDatesInIsoWeek,
  isLokaleActiveDuringWeek,
  isVaerelseActiveDuringWeek,
  lokaleTargetKey,
  vaerelseTargetKey,
} from "@/lib/rengoring-delegation-utils";
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

const WEEKDAY_LABELS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

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
    return () =>
      window.removeEventListener(RENGORING_TASKS_UPDATED_EVENT, onUpdate);
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

  const monthLabel = new Date(calendarYear, calendarMonth, 1).toLocaleDateString(
    "da-DK",
    { month: "long", year: "numeric" },
  );

  const weekDates = useMemo(
    () => getDatesInIsoWeek(selectedDate),
    [selectedDate, tick],
  );

  const allVaerelser = useMemo(() => getAllVaerelserForDelegation(), []);
  const allLokaler = useMemo(() => getAllLokalerForDelegation(), []);

  const visibleVaerelser = useMemo(() => {
    if (!weekFilter) return allVaerelser;
    return allVaerelser.filter((r) =>
      isVaerelseActiveDuringWeek(r, selectedDate),
    );
  }, [allVaerelser, weekFilter, selectedDate, tick]);

  const visibleLokaler = useMemo(() => {
    if (!weekFilter) return allLokaler;
    return allLokaler.filter((l) =>
      isLokaleActiveDuringWeek(l, selectedDate),
    );
  }, [allLokaler, weekFilter, selectedDate, tick]);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-emerald-700" />
          Uddelegering · {formatDateDaShort(selectedDate)}
        </CardTitle>
        <CardDescription className="mt-1">
          Vælg dato, tildel værelser og lokaler til rengøringsassistenter, og
          godkend når planen er klar
        </CardDescription>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            >
              ←
            </button>
            <span className="text-sm font-medium capitalize text-slate-800">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            >
              →
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={weekFilter}
              onChange={(e) => setWeekFilter(e.target.checked)}
              className="size-4 rounded border-slate-300 text-emerald-600"
            />
            Kun i brug denne uge
          </label>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthGrid.flat().map((date, idx) => {
            if (!date) {
              return <div key={`e-${idx}`} className="aspect-square" />;
            }
            const isSelected = date === selectedDate;
            const isToday = date === today;
            const inWeek = weekDates.includes(date);
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "aspect-square rounded-lg text-sm font-medium transition",
                  isSelected
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
                    : isToday
                      ? "bg-emerald-100 text-emerald-900"
                      : inWeek
                        ? "bg-emerald-50/80 text-slate-700 hover:bg-emerald-100"
                        : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {parseIsoDate(date).getDate()}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
        <SectionTab
          active={section === "vaerelser"}
          onClick={() => setSection("vaerelser")}
        >
          Værelser ({visibleVaerelser.length})
        </SectionTab>
        <SectionTab
          active={section === "lokaler"}
          onClick={() => setSection("lokaler")}
        >
          Lokaler ({visibleLokaler.length})
        </SectionTab>
      </div>

      {assistants.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Opret rengøringsassistenter under Brugere før du kan uddelegere.
        </p>
      )}

      {section === "vaerelser" ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Værelser</CardTitle>
            {selectedRooms.size > 0 && (
              <BatchAssignBar
                assistants={assistants}
                count={selectedRooms.size}
                onAssign={batchAssignVaerelser}
              />
            )}
          </div>
          <CardDescription className="mt-1">
            Træk hen over værelser for at vælge flere — tildel derefter én
            assistent til alle valgte
          </CardDescription>
          <div className="mt-4 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2">
              {visibleVaerelser.map((room) => {
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
                      "w-28 shrink-0 rounded-lg border p-2 transition select-none",
                      isSelected
                        ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200"
                        : "border-slate-200 bg-white hover:border-emerald-300",
                      assignment && !assignment.published && "border-amber-300",
                    )}
                    onMouseDown={() => handleRoomMouseDown(room)}
                    onMouseEnter={() => handleRoomMouseEnter(room)}
                  >
                    <p className="text-center text-sm font-bold tabular-nums text-slate-900">
                      {room}
                    </p>
                    <select
                      className="mt-2 w-full rounded border border-slate-200 px-1 py-1 text-[11px]"
                      value={assignment?.assigneeUserId ?? ""}
                      disabled={assistants.length === 0}
                      onMouseDown={(e) => e.stopPropagation()}
                      onChange={(e) => assignVaerelse(room, e.target.value)}
                    >
                      <option value="">—</option>
                      {assistants.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name.split(" ")[0]}
                        </option>
                      ))}
                    </select>
                    {assignment?.published && (
                      <p className="mt-1 text-center text-[10px] text-emerald-700">
                        Godkendt
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <CardTitle className="text-base">Lokaler</CardTitle>
          <CardDescription className="mt-1">
            Alle lokaler på skolen — tildel ansvarlig assistent pr. lokale
          </CardDescription>
          <div className="mt-4 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2">
              {visibleLokaler.map((lokale) => {
                const assignment = getAssignmentForTarget(
                  selectedDate,
                  "lokale",
                  lokaleTargetKey(lokale),
                );
                return (
                  <div
                    key={lokale}
                    className={cn(
                      "w-36 shrink-0 rounded-lg border border-slate-200 bg-white p-2",
                      assignment && !assignment.published && "border-amber-300",
                    )}
                  >
                    <p
                      className="truncate text-center text-xs font-semibold text-slate-900"
                      title={lokale}
                    >
                      {lokale}
                    </p>
                    <select
                      className="mt-2 w-full rounded border border-slate-200 px-1 py-1 text-[11px]"
                      value={assignment?.assigneeUserId ?? ""}
                      disabled={assistants.length === 0}
                      onChange={(e) => assignLokale(lokale, e.target.value)}
                    >
                      <option value="">—</option>
                      {assistants.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    {assignment?.published && (
                      <p className="mt-1 text-center text-[10px] text-emerald-700">
                        Godkendt
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
