"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { isRengoringsassistent } from "@/lib/auth-permissions";
import { cn } from "@/lib/utils";
import {
  todayIso,
  formatDateDa,
  formatDateDaShort,
  toIsoDate,
  parseIsoDate,
  addDaysIso,
} from "@/lib/date-utils";
import {
  RENGORING_UPDATED_EVENT,
  setLokaleKlar,
  setVaerelseKlar,
} from "@/lib/rengoring-storage";
import {
  getVaerelserForRengoringDate,
  type RengoringVaerelseRow,
} from "@/lib/rengoring-room-utils";
import {
  getDagensRengoringOpgaver,
  getLokalerForRengoringDate,
  type RengoringLokaleRow,
} from "@/lib/rengoring-lokale-utils";
import { KONTOR_UPDATED_EVENT } from "@/lib/kontor-storage";
import { ANSAT_VAERELSE_BOOKING_UPDATED_EVENT } from "@/lib/ansat-vaerelse-booking-storage";
import {
  getIncompleteTasksForAssignee,
  getTasksForAssignee,
  RENGORING_TASKS_UPDATED_EVENT,
  updateRengoringTask,
} from "@/lib/rengoring-task-storage";

type Tab = "vaerelser" | "lokaler";
type VaerelseFilter = "all" | "klar" | "needs_cleaning";

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

export function RengoringPage() {
  const { user } = useAuth();
  const today = todayIso();

  if (user && isRengoringsassistent(user.role)) {
    return <RengoringAssistantView userId={user.id} today={today} />;
  }

  return <RengoringLeaderView today={today} />;
}

function RengoringAssistantView({
  userId,
  today,
}: {
  userId: string;
  today: string;
}) {
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    function onUpdate() {
      reload();
    }
    window.addEventListener(RENGORING_TASKS_UPDATED_EVENT, onUpdate);
    return () =>
      window.removeEventListener(RENGORING_TASKS_UPDATED_EVENT, onUpdate);
  }, [reload]);

  const dagensTasks = useMemo(
    () => getIncompleteTasksForAssignee(userId, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, today, tick],
  );

  const allMine = useMemo(
    () => getTasksForAssignee(userId).filter((t) => !t.completed && t.date >= today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, today, tick],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rengøring</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dine tildelte opgaver
        </p>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/60">
        <CardTitle className="text-base text-emerald-900">Dagens opgaver</CardTitle>
        <CardDescription className="mt-1">
          {formatDateDa(today)} · {dagensTasks.length}{" "}
          {dagensTasks.length === 1 ? "opgave" : "opgaver"}
        </CardDescription>

        {dagensTasks.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-800">
            Ingen opgaver tildelt i dag.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {dagensTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded-lg bg-white px-4 py-3 ring-1 ring-emerald-200"
              >
                <div>
                  <p className="font-medium text-slate-900">{task.label}</p>
                  {task.note && (
                    <p className="text-sm text-slate-500">{task.note}</p>
                  )}
                </div>
                <Button
                  className="h-8 shrink-0"
                  onClick={() => {
                    updateRengoringTask(task.id, { completed: true });
                    reload();
                  }}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Udført
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {allMine.length > dagensTasks.length && (
        <Card>
          <CardTitle className="text-base">Kommende opgaver</CardTitle>
          <ul className="mt-3 divide-y divide-slate-100">
            {allMine
              .filter((t) => t.date !== today)
              .map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span>
                    <span className="font-medium">{task.label}</span>
                    <span className="text-slate-500">
                      {" "}
                      · {formatDateDaShort(task.date)}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function RengoringLeaderView({ today }: { today: string }) {
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState<Tab>("vaerelser");
  const [vaerelseFilter, setVaerelseFilter] = useState<VaerelseFilter>("all");
  const [tick, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const viewDate = parseIsoDate(selectedDate);
  const [calendarYear, setCalendarYear] = useState(viewDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(viewDate.getMonth());

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onUpdate() {
      reload();
    }
    window.addEventListener(RENGORING_UPDATED_EVENT, onUpdate);
    window.addEventListener(KONTOR_UPDATED_EVENT, onUpdate);
    window.addEventListener(ANSAT_VAERELSE_BOOKING_UPDATED_EVENT, onUpdate);
    return () => {
      window.removeEventListener(RENGORING_UPDATED_EVENT, onUpdate);
      window.removeEventListener(KONTOR_UPDATED_EVENT, onUpdate);
      window.removeEventListener(ANSAT_VAERELSE_BOOKING_UPDATED_EVENT, onUpdate);
    };
  }, [reload]);

  useEffect(() => {
    const d = parseIsoDate(selectedDate);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
  }, [selectedDate]);

  const dagensOpgaver = useMemo(
    () => getDagensRengoringOpgaver(today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, tick],
  );

  const vaerelser = useMemo(
    () => getVaerelserForRengoringDate(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, tick],
  );

  const lokaler = useMemo(
    () => getLokalerForRengoringDate(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, tick],
  );

  const filteredVaerelser = useMemo(() => {
    if (vaerelseFilter === "klar") {
      return vaerelser.filter((r) => r.klar);
    }
    if (vaerelseFilter === "needs_cleaning") {
      return vaerelser.filter((r) => r.needsCleaning);
    }
    return vaerelser;
  }, [vaerelser, vaerelseFilter]);

  const monthGrid = useMemo(
    () => buildMonthGrid(calendarYear, calendarMonth),
    [calendarYear, calendarMonth],
  );

  const monthLabel = new Date(calendarYear, calendarMonth, 1).toLocaleDateString(
    "da-DK",
    { month: "long", year: "numeric" },
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

  if (!hydrated) {
    return (
      <Card>
        <CardDescription>Indlæser rengøring…</CardDescription>
      </Card>
    );
  }

  const totalDagens =
    dagensOpgaver.vaerelser.length + dagensOpgaver.lokaler.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rengøring</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dagens opgaver og planlægning af værelser og lokaler
        </p>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/60">
        <CardTitle className="text-base text-emerald-900">
          Dagens opgaver
        </CardTitle>
        <CardDescription className="mt-1 text-emerald-800/80">
          {formatDateDa(today)} · {totalDagens}{" "}
          {totalDagens === 1 ? "opgave" : "opgaver"} til rengøring i dag
        </CardDescription>

        {totalDagens === 0 ? (
          <p className="mt-4 text-sm text-emerald-800">
            Ingen opgaver i dag — alt er klart.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {dagensOpgaver.vaerelser.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Værelser ({dagensOpgaver.vaerelser.length})
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {dagensOpgaver.vaerelser.map((r) => (
                    <li
                      key={r.roomNumber}
                      className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium tabular-nums text-slate-800 ring-1 ring-emerald-200"
                    >
                      {r.roomNumber}
                      {r.inUse && (
                        <span className="ml-1.5 text-xs font-normal text-amber-700">
                          i brug
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {dagensOpgaver.lokaler.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Lokaler ({dagensOpgaver.lokaler.length})
                </p>
                <ul className="mt-2 space-y-1.5">
                  {dagensOpgaver.lokaler.map((l) => (
                    <li
                      key={l.id}
                      className="rounded-lg bg-white px-3 py-2 text-sm text-slate-800 ring-1 ring-emerald-200"
                    >
                      <span className="font-medium">{l.lokale}</span>
                      <span className="text-slate-500"> · {l.courseTitle}</span>
                      {l.timeSpan && (
                        <span className="text-slate-400"> · {l.timeSpan}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
        <TabButton
          active={activeTab === "vaerelser"}
          onClick={() => setActiveTab("vaerelser")}
        >
          Værelser
        </TabButton>
        <TabButton
          active={activeTab === "lokaler"}
          onClick={() => setActiveTab("lokaler")}
        >
          Lokaler
        </TabButton>
      </div>

      {activeTab === "vaerelser" ? (
        <VaerelserTab
          selectedDate={selectedDate}
          today={today}
          monthLabel={monthLabel}
          monthGrid={monthGrid}
          filteredVaerelser={filteredVaerelser}
          vaerelseFilter={vaerelseFilter}
          onSelectDate={setSelectedDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onFilterChange={setVaerelseFilter}
          onToggleKlar={(room, klar) => {
            setVaerelseKlar(room, selectedDate, klar);
            reload();
          }}
        />
      ) : (
        <LokalerTab
          selectedDate={selectedDate}
          today={today}
          lokaler={lokaler}
          onSelectDate={setSelectedDate}
          onToggleKlar={(id, klar) => {
            setLokaleKlar(id, klar);
            reload();
          }}
        />
      )}
    </div>
  );
}

function TabButton({
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

function VaerelserTab({
  selectedDate,
  today,
  monthLabel,
  monthGrid,
  filteredVaerelser,
  vaerelseFilter,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onFilterChange,
  onToggleKlar,
}: {
  selectedDate: string;
  today: string;
  monthLabel: string;
  monthGrid: (string | null)[][];
  filteredVaerelser: RengoringVaerelseRow[];
  vaerelseFilter: VaerelseFilter;
  onSelectDate: (d: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onFilterChange: (f: VaerelseFilter) => void;
  onToggleKlar: (room: string, klar: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base capitalize">{monthLabel}</CardTitle>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onPrevMonth}
              className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            >
              ←
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthGrid.flat().map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }
            const isSelected = date === selectedDate;
            const isToday = date === today;
            const isPast = date < today;

            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelectDate(date)}
                className={cn(
                  "aspect-square rounded-lg text-sm font-medium transition",
                  isSelected
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
                    : isToday
                      ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300"
                      : isPast
                        ? "text-slate-400 hover:bg-slate-50"
                        : "text-slate-700 hover:bg-emerald-50",
                )}
              >
                {parseIsoDate(date).getDate()}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">
              Værelser · {formatDateDaShort(selectedDate)}
            </CardTitle>
            <CardDescription>
              Værelser der skal bruges eller ikke er gjort rent siden sidste brug
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={vaerelseFilter === "klar"}
              onClick={() =>
                onFilterChange(vaerelseFilter === "klar" ? "all" : "klar")
              }
            >
              Kun klar
            </FilterButton>
            <FilterButton
              active={vaerelseFilter === "needs_cleaning"}
              onClick={() =>
                onFilterChange(
                  vaerelseFilter === "needs_cleaning" ? "all" : "needs_cleaning",
                )
              }
            >
              Skal gøres rent
            </FilterButton>
          </div>
        </div>

        {filteredVaerelser.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            Ingen værelser matcher filteret for den valgte dato.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Værelse</th>
                  <th className="px-3 py-2 text-center">I brug</th>
                  <th className="px-3 py-2 text-center">Klar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVaerelser.map((row) => (
                  <tr key={row.roomNumber} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-semibold tabular-nums text-slate-900">
                      {row.roomNumber}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusCheckbox checked={row.inUse} disabled label="I brug" />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusCheckbox
                        checked={row.klar}
                        label="Klar"
                        onChange={(checked) =>
                          onToggleKlar(row.roomNumber, checked)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function LokalerTab({
  selectedDate,
  today,
  lokaler,
  onSelectDate,
  onToggleKlar,
}: {
  selectedDate: string;
  today: string;
  lokaler: RengoringLokaleRow[];
  onSelectDate: (d: string) => void;
  onToggleKlar: (id: string, klar: boolean) => void;
}) {
  const needsCleaning = lokaler.filter((l) => !l.klar);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">
            Lokaler · {formatDateDaShort(selectedDate)}
          </CardTitle>
          <CardDescription>
            Lokaler fra kursusprogrammer der skal klargøres
            {selectedDate === today ? " i dag" : ""}
          </CardDescription>
        </div>
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
      </div>

      {lokaler.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          Ingen lokaler med aktivitet på den valgte dato.
        </p>
      ) : (
        <>
          {needsCleaning.length > 0 && (
            <p className="mt-3 text-sm text-amber-800">
              {needsCleaning.length}{" "}
              {needsCleaning.length === 1 ? "lokale" : "lokaler"} skal
              klargøres
            </p>
          )}
          <ul className="mt-4 divide-y divide-slate-100">
            {lokaler.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{l.lokale}</p>
                  <p className="text-sm text-slate-500">
                    {l.courseTitle}
                    {l.timeSpan ? ` · ${l.timeSpan}` : ""}
                  </p>
                </div>
                <StatusCheckbox
                  checked={l.klar}
                  label="Klar"
                  onChange={(checked) => onToggleKlar(l.id, checked)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
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

function StatusCheckbox({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2",
        disabled && "cursor-default opacity-80",
      )}
    >
      <input
        type="checkbox"
        className="size-4 rounded border-slate-300 text-emerald-600 disabled:cursor-default"
        checked={checked}
        disabled={disabled}
        onChange={
          onChange ? (e) => onChange(e.target.checked) : undefined
        }
        readOnly={!onChange}
      />
      <span className="text-xs font-medium text-slate-600">{label}</span>
    </label>
  );
}
