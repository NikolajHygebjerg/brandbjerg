"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CompactMonthCalendar } from "@/components/mockup/rengoring-vaerelser-tab";
import { listUsersByRole } from "@/lib/auth-storage";
import {
  addDaysIso,
  formatDateDa,
  formatDateDaShort,
  parseIsoDate,
  toIsoDate,
} from "@/lib/date-utils";
import { getLokalerForRengoringDate } from "@/lib/rengoring-lokale-utils";
import {
  countUnpublishedPedelAssignments,
  getPedelAssignmentForTarget,
  PEDEL_TASKS_UPDATED_EVENT,
  publishPedelAssignmentsForDate,
  upsertPedelAssignment,
} from "@/lib/pedel-task-storage";
import { syncAutoPedelTasksForDates } from "@/lib/pedel-auto-tasks";
import { cn } from "@/lib/utils";

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

export function PedelDelegationTab({ today }: { today: string }) {
  const [selectedDate, setSelectedDate] = useState(today);
  const [tick, setTick] = useState(0);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const viewDate = parseIsoDate(selectedDate);
  const [calendarYear, setCalendarYear] = useState(viewDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(viewDate.getMonth());

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    function onUpdate() {
      reload();
    }
    window.addEventListener(PEDEL_TASKS_UPDATED_EVENT, onUpdate);
    return () =>
      window.removeEventListener(PEDEL_TASKS_UPDATED_EVENT, onUpdate);
  }, [reload]);

  useEffect(() => {
    syncAutoPedelTasksForDates([selectedDate]);
    const d = parseIsoDate(selectedDate);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
  }, [selectedDate]);

  const assistants = useMemo(
    () => listUsersByRole("pedelassistent"),
    [tick],
  );

  const monthGrid = useMemo(
    () => buildMonthGrid(calendarYear, calendarMonth),
    [calendarYear, calendarMonth],
  );

  const lokaler = useMemo(
    () => getLokalerForRengoringDate(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, tick],
  );

  const unpublishedCount = useMemo(
    () => countUnpublishedPedelAssignments(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, tick],
  );

  function prevDay() {
    setSelectedDate(addDaysIso(selectedDate, -1));
  }

  function nextDay() {
    setSelectedDate(addDaysIso(selectedDate, 1));
  }

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

  function handlePublish() {
    const count = publishPedelAssignmentsForDate(selectedDate);
    setPublishMessage(
      count > 0
        ? `${count} opgave${count !== 1 ? "r" : ""} sendt til assistenter`
        : "Ingen nye opgaver at godkende",
    );
    reload();
    window.setTimeout(() => setPublishMessage(null), 4000);
  }

  if (assistants.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardDescription className="text-amber-900">
          Opret pedelassistenter under Brugere før du kan uddelegere.
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base">Uddelegering</CardTitle>
            <CardDescription className="mt-1">
              Tildel lokaleklargøring til pedelassistenter for{" "}
              {formatDateDa(selectedDate)}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={prevDay}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              ←
            </button>
            <span className="min-w-[8rem] text-center text-sm font-medium text-slate-800">
              {formatDateDaShort(selectedDate)}
            </span>
            <button
              type="button"
              onClick={nextDay}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              →
            </button>
            {selectedDate !== today && (
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-800 hover:underline"
              >
                I dag
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <CompactMonthCalendar
            calendarYear={calendarYear}
            calendarMonth={calendarMonth}
            monthGrid={monthGrid}
            selectedDate={selectedDate}
            today={today}
            onSelectDate={setSelectedDate}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onYearChange={setCalendarYear}
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            {lokaler.length} lokaler skal klargøres · {formatDateDa(selectedDate)}
          </p>
          <Button
            type="button"
            className="bg-blue-700 hover:bg-blue-800"
            disabled={unpublishedCount === 0}
            onClick={handlePublish}
          >
            <CheckCircle2 className="mr-1.5 size-4" />
            Godkend og send til assistenter
            {unpublishedCount > 0 && ` (${unpublishedCount})`}
          </Button>
        </div>

        {publishMessage && (
          <p className="border-b border-blue-100 bg-blue-50/80 px-4 py-2 text-sm text-blue-900">
            {publishMessage}
          </p>
        )}

        {lokaler.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Ingen lokaler planlagt denne dag.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {lokaler.map((row) => {
              const assignment = getPedelAssignmentForTarget(
                selectedDate,
                "lokale",
                row.id,
              );
              const dueBy = row.timeSpan.split("–")[0]?.trim();

              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{row.lokale}</p>
                    <p className="text-sm text-slate-500">
                      {row.courseTitle} · kl. {row.timeSpan}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-sm",
                        assignment?.assigneeUserId && !assignment.published
                          ? "border-amber-300 bg-amber-50"
                          : "border-slate-200",
                      )}
                      value={assignment?.assigneeUserId ?? ""}
                      onChange={(e) => {
                        upsertPedelAssignment({
                          date: selectedDate,
                          type: "lokale",
                          targetKey: row.id,
                          label: `${row.lokale} — ${row.courseTitle}`,
                          assigneeUserId: e.target.value,
                          courseId: row.courseId,
                          courseTitle: row.courseTitle,
                          dueBy: dueBy || undefined,
                        });
                        reload();
                      }}
                    >
                      <option value="">Ikke tildelt</option>
                      {assistants.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    {assignment?.published && (
                      <span className="text-xs text-emerald-700">Sendt</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
