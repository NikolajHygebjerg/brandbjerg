"use client";

import { Users } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { loadAlerts, markAlertRead } from "@/lib/kontor-storage";
import type { Course } from "@/lib/mock-data";
import type { KontorParticipant } from "@/lib/kontor-types";
import { buildWorkshopEnrollmentOverview } from "@/lib/workshop-utils";

type WorkshopsOverviewPanelProps = {
  course: Course;
  participants: KontorParticipant[];
  onRefresh?: () => void;
};

export function WorkshopsOverviewPanel({
  course,
  participants,
  onRefresh,
}: WorkshopsOverviewPanelProps) {
  const rows = buildWorkshopEnrollmentOverview(course, participants);
  const alerts = loadAlerts().filter(
    (a) =>
      a.courseId === course.id &&
      a.type === "workshop_closed" &&
      !a.read,
  );

  if (rows.length === 0 && alerts.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-violet-200 bg-violet-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-700" />
          <div>
            <CardTitle className="text-base text-violet-950">Workshops</CardTitle>
            <CardDescription className="text-violet-800">
              Oversigt over valg og deltagere
            </CardDescription>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2 border-b border-amber-200 bg-amber-50 px-4 py-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-wrap items-start justify-between gap-2 text-sm text-amber-950"
            >
              <p>{alert.message}</p>
              <button
                type="button"
                onClick={() => {
                  markAlertRead(alert.id);
                  onRefresh?.();
                }}
                className="text-xs font-medium text-amber-900 underline"
              >
                Markér læst
              </button>
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-slate-500">
          Ingen workshops oprettet i modulplanen endnu.
        </p>
      ) : (
        <div className="divide-y divide-slate-200">
          {rows.map((row) => (
            <div key={`${row.moduleId}-${row.option.id}`} className="px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {row.moduleTitle}
                  </p>
                  <p className="font-semibold text-slate-900">
                    {row.option.overskrift}
                  </p>
                  {row.option.underviser.trim() && (
                    <p className="text-sm text-slate-600">
                      {row.option.underviser}
                    </p>
                  )}
                  {row.option.broedtekst.trim() && (
                    <p className="mt-1 text-xs text-slate-500">
                      {row.option.broedtekst}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    row.full
                      ? "bg-red-100 text-red-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {row.full ? "Lukket" : "Åben"} · {row.enrolled}/{row.max}
                </span>
              </div>
              {row.participants.length > 0 ? (
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {row.participants.map((p) => (
                    <li key={p.id} className="flex flex-wrap gap-x-3">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-slate-500">{p.email}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Ingen tilmeldte endnu</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
