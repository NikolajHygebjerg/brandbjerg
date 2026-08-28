"use client";

import { CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  PedelCompletionFilterBar,
  PedelStatusBadge,
} from "@/components/mockup/pedel-completion-filter";
import { getUserById } from "@/lib/auth-storage";
import {
  addDaysIso,
  formatDateDa,
  formatDateDaShort,
} from "@/lib/date-utils";
import type {
  PedelCompletionFilter,
  PedelTask,
} from "@/lib/pedel-task-storage";
import { cn } from "@/lib/utils";

function taskTypeLabel(task: PedelTask): string {
  if (task.source === "afdeling") return "Fra afdeling";
  return "Lokale";
}

function taskDateLabel(
  task: PedelTask,
  today: string,
  tomorrow: string,
): string | null {
  if (task.source === "afdeling") return null;
  if (task.date === today) return "I dag";
  if (task.date === tomorrow) return "I morgen";
  return formatDateDaShort(task.date);
}

export function PedelDagensOpgaverCard({
  today,
  tasks,
  completionFilter,
  onCompletionFilterChange,
  completionCounts,
  assistants,
  showAssign = false,
  onAssign,
  onToggleComplete,
  onTaskClick,
}: {
  today: string;
  tasks: PedelTask[];
  completionFilter: PedelCompletionFilter;
  onCompletionFilterChange: (filter: PedelCompletionFilter) => void;
  completionCounts?: Partial<Record<PedelCompletionFilter, number>>;
  assistants?: { id: string; name: string }[];
  showAssign?: boolean;
  onAssign?: (taskId: string, assigneeUserId: string) => void;
  onToggleComplete: (task: PedelTask) => void;
  onTaskClick?: (task: PedelTask) => void;
}) {
  const tomorrow = addDaysIso(today, 1);
  const unassignedCount = tasks.filter((t) => !t.assigneeUserId).length;

  return (
    <Card className="border-blue-200 bg-blue-50/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base text-blue-900">Dagens opgaver</CardTitle>
          <CardDescription className="mt-1 text-blue-800/80">
            I dag og i morgen · {formatDateDa(today)} –{" "}
            {formatDateDaShort(tomorrow)}
            {" · "}
            {tasks.length} {tasks.length === 1 ? "opgave" : "opgaver"}
            {showAssign && unassignedCount > 0 && (
              <> · {unassignedCount} ikke tildelt</>
            )}
          </CardDescription>
        </div>
        <PedelCompletionFilterBar
          value={completionFilter}
          onChange={onCompletionFilterChange}
          counts={completionCounts}
        />
      </div>

      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-blue-800">
          {completionFilter === "pending"
            ? "Ingen åbne opgaver for i dag og i morgen — alt er klart."
            : completionFilter === "completed"
              ? "Ingen udførte opgaver at vise endnu."
              : "Ingen opgaver for i dag og i morgen."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {tasks.map((task) => {
            const assignee = task.assigneeUserId
              ? getUserById(task.assigneeUserId)
              : null;
            const dateLabel = taskDateLabel(task, today, tomorrow);

            return (
              <li
                key={task.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 ring-1",
                  task.completed
                    ? "bg-emerald-50/80 ring-emerald-200"
                    : showAssign && !task.assigneeUserId
                      ? "bg-amber-50/30 ring-amber-300"
                      : "bg-white ring-blue-200",
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onTaskClick?.(task)}
                  disabled={!onTaskClick}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "font-medium text-slate-900",
                        task.completed && "text-slate-600 line-through",
                      )}
                    >
                      {task.label}
                    </p>
                    <PedelStatusBadge completed={task.completed} />
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                      {taskTypeLabel(task)}
                    </span>
                    {dateLabel && (
                      <span className="text-xs font-medium text-blue-800">
                        {dateLabel}
                      </span>
                    )}
                    {task.dueBy && !task.completed && (
                      <span className="text-xs font-medium text-amber-800">
                        Klar kl. {task.dueBy}
                      </span>
                    )}
                  </div>
                  {task.note && (
                    <p className="mt-0.5 text-sm text-slate-500">{task.note}</p>
                  )}
                  {task.courseTitle && task.source !== "afdeling" && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {task.courseTitle}
                    </p>
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {showAssign && onAssign && assistants && !task.completed && (
                    <>
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
                    </>
                  )}
                  {!showAssign && assignee && (
                    <span className="text-xs text-slate-500">
                      Tildelt: {assignee.name}
                    </span>
                  )}
                  <Button
                    className="h-8 shrink-0"
                    variant={task.completed ? "outline" : "primary"}
                    onClick={() => onToggleComplete(task)}
                  >
                    {task.completed ? (
                      <>
                        <RotateCcw className="mr-1 h-4 w-4" />
                        Fortryd
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Udført
                      </>
                    )}
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
