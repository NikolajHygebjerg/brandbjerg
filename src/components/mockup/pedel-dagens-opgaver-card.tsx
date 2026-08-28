"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getUserById } from "@/lib/auth-storage";
import {
  addDaysIso,
  formatDateDa,
  formatDateDaShort,
} from "@/lib/date-utils";
import type { PedelTask } from "@/lib/pedel-task-storage";
import { cn } from "@/lib/utils";

function taskTypeLabel(task: PedelTask): string {
  if (task.source === "afdeling") return "Fra afdeling";
  return "Lokale";
}

function taskDateLabel(task: PedelTask, today: string, tomorrow: string): string | null {
  if (task.source === "afdeling") return null;
  if (task.date === today) return "I dag";
  if (task.date === tomorrow) return "I morgen";
  return formatDateDaShort(task.date);
}

export function PedelDagensOpgaverCard({
  today,
  tasks,
  assistants,
  showAssign = false,
  onAssign,
  onComplete,
  onTaskClick,
}: {
  today: string;
  tasks: PedelTask[];
  assistants?: { id: string; name: string }[];
  showAssign?: boolean;
  onAssign?: (taskId: string, assigneeUserId: string) => void;
  onComplete: (task: PedelTask) => void;
  onTaskClick?: (task: PedelTask) => void;
}) {
  const tomorrow = addDaysIso(today, 1);
  const unassignedCount = tasks.filter((t) => !t.assigneeUserId).length;

  return (
    <Card className="border-blue-200 bg-blue-50/60">
      <CardTitle className="text-base text-blue-900">Dagens opgaver</CardTitle>
      <CardDescription className="mt-1 text-blue-800/80">
        I dag og i morgen · {formatDateDa(today)} – {formatDateDaShort(tomorrow)}
        {" · "}
        {tasks.length} {tasks.length === 1 ? "opgave" : "opgaver"}
        {showAssign && unassignedCount > 0 && (
          <> · {unassignedCount} ikke tildelt</>
        )}
      </CardDescription>

      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-blue-800">
          Ingen åbne opgaver for i dag og i morgen — alt er klart.
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
                  "flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 ring-1",
                  showAssign && !task.assigneeUserId
                    ? "ring-amber-300 bg-amber-50/30"
                    : "ring-blue-200",
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onTaskClick?.(task)}
                  disabled={!onTaskClick}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{task.label}</p>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-600">
                      {taskTypeLabel(task)}
                    </span>
                    {dateLabel && (
                      <span className="text-xs font-medium text-blue-800">
                        {dateLabel}
                      </span>
                    )}
                    {task.dueBy && (
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
                  {showAssign && onAssign && assistants && (
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
                    variant={showAssign ? "outline" : "primary"}
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
