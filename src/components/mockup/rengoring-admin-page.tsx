"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { canAccessRengoringAdmin } from "@/lib/auth-permissions";
import { listUsersByRole } from "@/lib/auth-storage";
import { formatDateDa, todayIso } from "@/lib/date-utils";
import {
  createRengoringTask,
  deleteRengoringTask,
  getTasksForDate,
  RENGORING_TASKS_UPDATED_EVENT,
  updateRengoringTask,
} from "@/lib/rengoring-task-storage";
import { getVaerelserForRengoringDate } from "@/lib/rengoring-room-utils";
import { getLokalerForRengoringDate } from "@/lib/rengoring-lokale-utils";
import { useRouter } from "next/navigation";

export function RengoringAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(todayIso());
  const [assigneeId, setAssigneeId] = useState("");
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (user && !canAccessRengoringAdmin(user.role)) {
      router.replace("/rengoring");
    }
  }, [user, router]);

  useEffect(() => {
    function onUpdate() {
      reload();
    }
    window.addEventListener(RENGORING_TASKS_UPDATED_EVENT, onUpdate);
    return () =>
      window.removeEventListener(RENGORING_TASKS_UPDATED_EVENT, onUpdate);
  }, [reload]);

  const assistants = useMemo(
    () => listUsersByRole("rengoringsassistent"),
    [tick],
  );

  const tasks = useMemo(
    () => getTasksForDate(date),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date, tick],
  );

  const vaerelser = useMemo(
    () => getVaerelserForRengoringDate(date),
    [date, tick],
  );

  const lokaler = useMemo(
    () => getLokalerForRengoringDate(date),
    [date, tick],
  );

  useEffect(() => {
    if (!assigneeId && assistants.length > 0) {
      setAssigneeId(assistants[0].id);
    }
  }, [assistants, assigneeId]);

  if (!user || !canAccessRengoringAdmin(user.role)) {
    return (
      <Card>
        <CardDescription>Indlæser…</CardDescription>
      </Card>
    );
  }

  function assignVaerelse(roomNumber: string) {
    if (!assigneeId) return;
    createRengoringTask({
      assigneeUserId: assigneeId,
      date,
      type: "vaerelse",
      targetKey: roomNumber,
      label: `Værelse ${roomNumber}`,
    });
    reload();
  }

  function assignLokale(id: string, label: string) {
    if (!assigneeId) return;
    createRengoringTask({
      assigneeUserId: assigneeId,
      date,
      type: "lokale",
      targetKey: id,
      label,
    });
    reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/rengoring"
          className="text-sm text-emerald-700 hover:underline"
        >
          ← Tilbage til rengøring
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-emerald-700" />
          <h1 className="text-2xl font-bold text-slate-900">Rengøringsadmin</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Tildel opgaver til rengøringsassistenter
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Dato
            </span>
            <input
              type="date"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="min-w-[200px] text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Tildel til
            </span>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              {assistants.length === 0 ? (
                <option value="">Ingen assistenter oprettet</option>
              ) : (
                assistants.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
        {assistants.length === 0 && (
          <p className="mt-3 text-sm text-amber-800">
            Opret rengøringsassistenter under{" "}
            <Link href="/brugere" className="font-medium underline">
              Brugere
            </Link>
            .
          </p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="text-base">
            Værelser · {formatDateDa(date)}
          </CardTitle>
          <CardDescription className="mt-1">
            Klik + for at tildele værelse der skal gøres rent
          </CardDescription>
          <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto">
            {vaerelser.map((v) => (
              <li
                key={v.roomNumber}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <span className="font-medium tabular-nums">{v.roomNumber}</span>
                <Button
                  variant="secondary"
                  className="h-7 px-2"
                  disabled={!assigneeId}
                  onClick={() => assignVaerelse(v.roomNumber)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle className="text-base">Lokaler</CardTitle>
          <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto">
            {lokaler.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <span className="truncate text-sm">
                  {l.lokale} · {l.courseTitle}
                </span>
                <Button
                  variant="secondary"
                  className="h-7 shrink-0 px-2"
                  disabled={!assigneeId}
                  onClick={() => assignLokale(l.id, l.lokale)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardTitle className="text-base">
          Tildelte opgaver · {formatDateDa(date)}
        </CardTitle>
        {tasks.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Ingen opgaver tildelt.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {tasks.map((t) => {
              const assignee = assistants.find((a) => a.id === t.assigneeUserId);
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <span className="font-medium text-slate-900">{t.label}</span>
                    <span className="text-slate-500">
                      {" "}
                      · {assignee?.name ?? "Ukendt"}
                    </span>
                    {t.completed && (
                      <span className="ml-2 text-xs text-emerald-700">Udført</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      deleteRengoringTask(t.id);
                      reload();
                    }}
                    className="text-red-600 hover:underline"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
