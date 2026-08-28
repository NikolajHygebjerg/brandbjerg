"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { canAccessRengoringAdmin, isRengoringsassistent } from "@/lib/auth-permissions";
import { getUserById, listUsersByRole } from "@/lib/auth-storage";
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
  getAllVaerelserGridForDate,
} from "@/lib/rengoring-room-utils";
import { RengoringVaerelserTab } from "@/components/mockup/rengoring-vaerelser-tab";
import {
  getLokalerForRengoringDate,
  type RengoringLokaleRow,
} from "@/lib/rengoring-lokale-utils";
import { syncAutoRengoringTasksForDate } from "@/lib/rengoring-auto-tasks";
import { KONTOR_UPDATED_EVENT } from "@/lib/kontor-storage";
import { ANSAT_VAERELSE_BOOKING_UPDATED_EVENT } from "@/lib/ansat-vaerelse-booking-storage";
import {
  assignLeaderTask,
  completeRengoringTask,
  getIncompleteTasksForAssignee,
  getLeaderTasksForDate,
  getTasksForAssignee,
  RENGORING_TASKS_UPDATED_EVENT,
  type RengoringTask,
} from "@/lib/rengoring-task-storage";
import { RengoringDelegationTab } from "@/components/mockup/rengoring-delegation-tab";
import { RengoringTargetDialog } from "@/components/mockup/rengoring-target-dialog";
import {
  hasRengoringNote,
  RENGORING_NOTES_UPDATED_EVENT,
} from "@/lib/rengoring-notes-storage";
import { lokaleTargetKey } from "@/lib/rengoring-delegation-utils";

type Tab = "vaerelser" | "lokaler";
type MainTab = "oversigt" | "uddelegering";
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

export function RengoringPage() {
  const { user } = useAuth();
  const today = todayIso();

  if (user && isRengoringsassistent(user.role)) {
    return <RengoringAssistantView userId={user.id} today={today} />;
  }

  return <RengoringLeaderView today={today} />;
}

type TargetSelection = {
  type: "vaerelse" | "lokale";
  targetKey: string;
  label: string;
};

function RengoringAssistantView({
  userId,
  today,
}: {
  userId: string;
  today: string;
}) {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState<TargetSelection | null>(
    null,
  );
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    function onUpdate() {
      syncAutoRengoringTasksForDate(today);
      reload();
    }
    syncAutoRengoringTasksForDate(today);
    window.addEventListener(RENGORING_TASKS_UPDATED_EVENT, onUpdate);
    window.addEventListener(KONTOR_UPDATED_EVENT, onUpdate);
    window.addEventListener(ANSAT_VAERELSE_BOOKING_UPDATED_EVENT, onUpdate);
    window.addEventListener(RENGORING_NOTES_UPDATED_EVENT, reload);
    return () => {
      window.removeEventListener(RENGORING_TASKS_UPDATED_EVENT, onUpdate);
      window.removeEventListener(KONTOR_UPDATED_EVENT, onUpdate);
      window.removeEventListener(
        ANSAT_VAERELSE_BOOKING_UPDATED_EVENT,
        onUpdate,
      );
      window.removeEventListener(RENGORING_NOTES_UPDATED_EVENT, reload);
    };
  }, [reload, today]);

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
                className="flex items-center justify-between gap-2 rounded-lg bg-white px-4 py-3 ring-1 ring-emerald-200"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() =>
                    setSelectedTarget({
                      type: task.type,
                      targetKey: task.targetKey,
                      label: task.label,
                    })
                  }
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{task.label}</p>
                    {hasRengoringNote(task.type, task.targetKey) && (
                      <StickyNote
                        className="size-3.5 shrink-0 text-emerald-600"
                        aria-label="Har gemt notat"
                      />
                    )}
                  </div>
                  {task.dueBy && (
                    <p className="text-xs font-medium text-amber-800">
                      Før kl. {task.dueBy}
                    </p>
                  )}
                  {task.note && (
                    <p className="text-sm text-slate-500">{task.note}</p>
                  )}
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Tryk for notat og pedelopgaver
                  </p>
                </button>
                <Button
                  className="h-8 shrink-0"
                  onClick={() => {
                    completeRengoringTask(task);
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

      {selectedTarget && user && (
        <RengoringTargetDialog
          open
          onClose={() => setSelectedTarget(null)}
          type={selectedTarget.type}
          targetKey={selectedTarget.targetKey}
          label={selectedTarget.label}
          userId={userId}
          userName={user.name}
        />
      )}
    </div>
  );
}

function RengoringLeaderView({ today }: { today: string }) {
  const { user } = useAuth();
  const [selectedTarget, setSelectedTarget] = useState<TargetSelection | null>(
    null,
  );
  const showDelegation = user && canAccessRengoringAdmin(user.role);
  const [mainTab, setMainTab] = useState<MainTab>("oversigt");
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "uddelegering" && user && canAccessRengoringAdmin(user.role)) {
      setMainTab("uddelegering");
    }
  }, [user]);
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
      syncAutoRengoringTasksForDate(today);
      reload();
    }
    syncAutoRengoringTasksForDate(today);
    window.addEventListener(RENGORING_UPDATED_EVENT, onUpdate);
    window.addEventListener(KONTOR_UPDATED_EVENT, onUpdate);
    window.addEventListener(ANSAT_VAERELSE_BOOKING_UPDATED_EVENT, onUpdate);
    window.addEventListener(RENGORING_TASKS_UPDATED_EVENT, onUpdate);
    window.addEventListener(RENGORING_NOTES_UPDATED_EVENT, reload);
    return () => {
      window.removeEventListener(RENGORING_UPDATED_EVENT, onUpdate);
      window.removeEventListener(KONTOR_UPDATED_EVENT, onUpdate);
      window.removeEventListener(ANSAT_VAERELSE_BOOKING_UPDATED_EVENT, onUpdate);
      window.removeEventListener(RENGORING_TASKS_UPDATED_EVENT, onUpdate);
      window.removeEventListener(RENGORING_NOTES_UPDATED_EVENT, reload);
    };
  }, [reload, today]);

  useEffect(() => {
    const d = parseIsoDate(selectedDate);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
  }, [selectedDate]);

  const leaderTasks = useMemo(
    () => getLeaderTasksForDate(today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, tick],
  );

  const assistants = useMemo(
    () => listUsersByRole("rengoringsassistent"),
    [tick],
  );

  const vaerelser = useMemo(
    () => getAllVaerelserGridForDate(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, tick],
  );

  const lokaler = useMemo(
    () => getLokalerForRengoringDate(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, tick],
  );

  const monthGrid = useMemo(
    () => buildMonthGrid(calendarYear, calendarMonth),
    [calendarYear, calendarMonth],
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

  if (!hydrated) {
    return (
      <Card>
        <CardDescription>Indlæser rengøring…</CardDescription>
      </Card>
    );
  }

  const totalDagens = leaderTasks.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rengøring</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dagens opgaver og planlægning af værelser og lokaler
        </p>
      </div>

      {showDelegation && (
        <div className="flex gap-1 rounded-lg border border-emerald-200 bg-emerald-50/50 p-1">
          <TabButton
            active={mainTab === "oversigt"}
            onClick={() => setMainTab("oversigt")}
          >
            Oversigt
          </TabButton>
          <TabButton
            active={mainTab === "uddelegering"}
            onClick={() => setMainTab("uddelegering")}
          >
            Uddelegering
          </TabButton>
        </div>
      )}

      {mainTab === "uddelegering" && showDelegation ? (
        <RengoringDelegationTab today={today} />
      ) : (
        <>
      <LeaderDagensOpgaverCard
        today={today}
        tasks={leaderTasks}
        assistants={assistants}
        totalCount={totalDagens}
        onAssign={(taskId, assigneeUserId) => {
          assignLeaderTask(taskId, assigneeUserId);
          reload();
        }}
        onComplete={(task) => {
          completeRengoringTask(task);
          reload();
        }}
        onTaskClick={(task) =>
          setSelectedTarget({
            type: task.type,
            targetKey: task.targetKey,
            label: task.label,
          })
        }
      />

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
        <RengoringVaerelserTab
          selectedDate={selectedDate}
          today={today}
          calendarYear={calendarYear}
          calendarMonth={calendarMonth}
          monthGrid={monthGrid}
          vaerelser={vaerelser}
          vaerelseFilter={vaerelseFilter}
          onSelectDate={setSelectedDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onYearChange={handleYearChange}
          onFilterChange={setVaerelseFilter}
          onToggleKlar={(room, klar) => {
            setVaerelseKlar(room, selectedDate, klar);
            reload();
          }}
          onRoomClick={(room) =>
            setSelectedTarget({
              type: "vaerelse",
              targetKey: room,
              label: `Værelse ${room}`,
            })
          }
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
          onLokaleClick={(l) =>
            setSelectedTarget({
              type: "lokale",
              targetKey: lokaleTargetKey(l.lokale),
              label: l.lokale,
            })
          }
        />
      )}
        </>
      )}

      {selectedTarget && user && (
        <RengoringTargetDialog
          open
          onClose={() => setSelectedTarget(null)}
          type={selectedTarget.type}
          targetKey={selectedTarget.targetKey}
          label={selectedTarget.label}
          userId={user.id}
          userName={user.name}
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

function LokalerTab({
  selectedDate,
  today,
  lokaler,
  onSelectDate,
  onToggleKlar,
  onLokaleClick,
}: {
  selectedDate: string;
  today: string;
  lokaler: RengoringLokaleRow[];
  onSelectDate: (d: string) => void;
  onToggleKlar: (id: string, klar: boolean) => void;
  onLokaleClick: (l: RengoringLokaleRow) => void;
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
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onLokaleClick(l)}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{l.lokale}</p>
                    {hasRengoringNote("lokale", lokaleTargetKey(l.lokale)) && (
                      <StickyNote
                        className="size-3.5 shrink-0 text-emerald-600"
                        aria-label="Har gemt notat"
                      />
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {l.courseTitle}
                    {l.timeSpan ? ` · ${l.timeSpan}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Tryk for notat og pedelopgaver
                  </p>
                </button>
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

function LeaderDagensOpgaverCard({
  today,
  tasks,
  assistants,
  totalCount,
  onAssign,
  onComplete,
  onTaskClick,
}: {
  today: string;
  tasks: RengoringTask[];
  assistants: { id: string; name: string }[];
  totalCount: number;
  onAssign: (taskId: string, assigneeUserId: string) => void;
  onComplete: (task: RengoringTask) => void;
  onTaskClick: (task: RengoringTask) => void;
}) {
  const unassignedCount = tasks.filter((t) => !t.assigneeUserId).length;

  return (
    <Card className="border-emerald-200 bg-emerald-50/60">
      <CardTitle className="text-base text-emerald-900">Dagens opgaver</CardTitle>
      <CardDescription className="mt-1 text-emerald-800/80">
        {formatDateDa(today)} · {totalCount}{" "}
        {totalCount === 1 ? "opgave" : "opgaver"}
        {unassignedCount > 0 && (
          <> · {unassignedCount} ikke tildelt</>
        )}
      </CardDescription>

      {totalCount === 0 ? (
        <p className="mt-4 text-sm text-emerald-800">
          Ingen opgaver i dag — alt er klart.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {tasks.map((task) => {
            const assignee = task.assigneeUserId
              ? getUserById(task.assigneeUserId)
              : null;
            return (
              <li
                key={task.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 ring-1",
                  task.assigneeUserId
                    ? "ring-emerald-200"
                    : "ring-amber-300 bg-amber-50/30",
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onTaskClick(task)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{task.label}</p>
                    {hasRengoringNote(task.type, task.targetKey) && (
                      <StickyNote
                        className="size-3.5 shrink-0 text-emerald-600"
                        aria-label="Har gemt notat"
                      />
                    )}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                      {task.type === "vaerelse" ? "Værelse" : "Lokale"}
                    </span>
                    {task.dueBy && (
                      <span className="text-xs font-medium text-amber-800">
                        Før kl. {task.dueBy}
                      </span>
                    )}
                  </div>
                  {task.note && (
                    <p className="mt-0.5 text-sm text-slate-500">{task.note}</p>
                  )}
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Tryk for notat og pedelopgaver
                  </p>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={task.assigneeUserId}
                    onChange={(e) => onAssign(task.id, e.target.value)}
                  >
                    <option value="">Ikke tildelt</option>
                    {assistants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {assignee && (
                    <span className="hidden text-xs text-slate-500 sm:inline">
                      Tildelt: {assignee.name}
                    </span>
                  )}
                  <Button
                    className="h-8 shrink-0"
                    variant="outline"
                    onClick={() => onComplete(task)}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Udført
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
