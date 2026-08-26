"use client";

import { formatDate } from "@/lib/mock-data";
import type { EnrollmentBenchmark, MarketingEffort } from "@/lib/kommunikation-types";
import { marketingEffortTypeLabels } from "@/lib/kommunikation-types";
import {
  dateToTimelinePercent,
  todayTimelinePercent,
  timelineStartDate,
} from "@/lib/kommunikation-utils";

const effortColors: Record<string, string> = {
  facebook: "bg-blue-500",
  some: "bg-purple-500",
  avis: "bg-amber-500",
};

type MarketingTimelineProps = {
  courseStartDate: string;
  benchmarks: EnrollmentBenchmark[];
  efforts: MarketingEffort[];
  enrolled: number;
  onEditBenchmarks?: () => void;
};

export function MarketingTimeline({
  courseStartDate,
  benchmarks,
  efforts,
  enrolled,
  onEditBenchmarks,
}: MarketingTimelineProps) {
  const timelineStart = timelineStartDate(courseStartDate);
  const todayPct = todayTimelinePercent(courseStartDate);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Tidslinje · 6 mdr. før → kursusstart
        </p>
        {onEditBenchmarks && (
          <button
            type="button"
            onClick={onEditBenchmarks}
            className="text-xs font-medium text-purple-700 hover:underline"
          >
            Rediger benchmark-tal
          </button>
        )}
      </div>

      <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 pt-8">
        <div className="relative h-24">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />

          {benchmarks.map((b) => {
            const at = new Date(courseStartDate);
            at.setMonth(at.getMonth() - b.monthsBefore);
            const pct = dateToTimelinePercent(
              at.toISOString().slice(0, 10),
              courseStartDate,
            );
            return (
              <div
                key={b.monthsBefore}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pct}%` }}
                title={`${b.monthsBefore} mdr. før: ${b.targetCount} tilmeldte`}
              >
                <div className="flex flex-col items-center">
                  <span className="mb-1 whitespace-nowrap text-[10px] font-semibold text-slate-600">
                    {b.targetCount}
                  </span>
                  <div className="h-3 w-3 rounded-full border-2 border-emerald-600 bg-white" />
                  <span className="mt-1 text-[9px] text-slate-400">
                    −{b.monthsBefore}m
                  </span>
                </div>
              </div>
            );
          })}

          {efforts.map((effort) => {
            const left = dateToTimelinePercent(effort.startDate, courseStartDate);
            const right = dateToTimelinePercent(effort.endDate, courseStartDate);
            const width = Math.max(right - left, 2);
            return (
              <div
                key={effort.id}
                className={`absolute top-[65%] h-5 rounded-md ${effortColors[effort.type] ?? "bg-slate-400"} opacity-90`}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`${marketingEffortTypeLabels[effort.type]} · ${formatDate(effort.startDate)}–${formatDate(effort.endDate)} · ${effort.price.toLocaleString("da-DK")} kr.`}
              />
            );
          })}

          {todayPct != null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500"
              style={{ left: `${todayPct}%` }}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-red-600">
                I dag · {enrolled} tilm.
              </span>
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-between text-[10px] text-slate-500">
          <span>{formatDate(timelineStart.toISOString().slice(0, 10))}</span>
          <span>{formatDate(courseStartDate)}</span>
        </div>
      </div>

      {efforts.length > 0 && (
        <ul className="space-y-2">
          {efforts.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-900">
                {marketingEffortTypeLabels[e.type]}
              </span>
              <span className="text-slate-600">
                {formatDate(e.startDate)} – {formatDate(e.endDate)}
              </span>
              <span className="font-medium text-slate-800">
                {e.price.toLocaleString("da-DK")} kr.
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full border-2 border-emerald-600 bg-white" />
          Benchmark
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded bg-blue-500" />
          Indsats
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-0.5 bg-red-500" />
          I dag
        </span>
      </div>
    </div>
  );
}
