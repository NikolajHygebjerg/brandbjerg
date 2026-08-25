"use client";

import { useMemo, useState } from "react";
import type { StatusarkCourse, WeeklyEnrollment } from "@/lib/brandbjerg-statusark";
import {
  enrollmentWeeksWithActivity,
  formatCalendarWeek,
  peakEnrollmentWeek,
} from "@/lib/statusark-utils";

export function EnrollmentSparkline({
  weeks,
  className = "",
}: {
  weeks: WeeklyEnrollment[];
  className?: string;
}) {
  const sorted = useMemo(() => enrollmentWeeksWithActivity(weeks), [weeks]);
  if (sorted.length === 0) {
    return (
      <span className={`text-xs text-slate-400 ${className}`}>Ingen endnu</span>
    );
  }

  const max = Math.max(...sorted.map((w) => Math.abs(w.count)), 1);
  const width = 120;
  const height = 28;
  const step = width / Math.max(sorted.length - 1, 1);

  const points = sorted
    .map((w, i) => {
      const x = i * step;
      const y = height - (Math.abs(w.count) / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const peak = peakEnrollmentWeek(sorted);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={width}
        height={height}
        className="shrink-0 overflow-visible"
        aria-hidden
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-emerald-600"
          points={points}
        />
        {sorted.map((w, i) => {
          const x = i * step;
          const y = height - (Math.abs(w.count) / max) * (height - 4) - 2;
          return (
            <circle
              key={`${w.year}-${w.week}`}
              cx={x}
              cy={y}
              r={2}
              className={w.count < 0 ? "fill-red-400" : "fill-emerald-600"}
            />
          );
        })}
      </svg>
      {peak && (
        <span className="hidden text-[10px] text-slate-400 sm:inline">
          Top uge {formatCalendarWeek(peak.year, peak.week)}: {peak.count}
        </span>
      )}
    </div>
  );
}

export function EnrollmentTimelinePanel({ course }: { course: StatusarkCourse }) {
  const sorted = enrollmentWeeksWithActivity(course.enrollmentByWeek);
  const [showRecords, setShowRecords] = useState(false);

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Ingen tilmeldinger registreret endnu — data kommer fra tilmeldingsdatabasen
        uge for uge.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Tilmeldinger pr. kalenderuge (database)
        </p>
        <button
          type="button"
          onClick={() => setShowRecords((v) => !v)}
          className="text-xs font-medium text-emerald-700 hover:underline"
        >
          {showRecords ? "Skjul detaljer" : "Vis alle uger"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {sorted.map((w) => (
          <span
            key={`${w.year}-${w.week}`}
            title={`Uge ${formatCalendarWeek(w.year, w.week)}: ${w.count > 0 ? "+" : ""}${w.count}`}
            className={`inline-flex min-w-[2.5rem] flex-col items-center rounded px-1.5 py-1 text-[10px] ${
              w.count < 0
                ? "bg-red-50 text-red-700"
                : w.count >= 5
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            <span className="font-medium opacity-70">
              {formatCalendarWeek(w.year, w.week)}
            </span>
            <span className="font-semibold">{w.count > 0 ? "+" : ""}{w.count}</span>
          </span>
        ))}
      </div>

      {showRecords && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          I den færdige platform gemmes hver tilmelding med dato og valgfri
          kampagnekilde (UTM). Ugentlige tal aggregeres automatisk til statusarket
          — og historikken bevares til KMR-analyse af hvilke markedsføringstiltag
          der driver tilmeldinger.
        </p>
      )}
    </div>
  );
}
