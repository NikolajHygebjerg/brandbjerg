"use client";

import { cn } from "@/lib/utils";
import type { PedelCompletionFilter } from "@/lib/pedel-task-storage";

const LABELS: Record<PedelCompletionFilter, string> = {
  all: "Alle",
  pending: "Ikke udførte",
  completed: "Udførte",
};

export function PedelCompletionFilterBar({
  value,
  onChange,
  counts,
}: {
  value: PedelCompletionFilter;
  onChange: (value: PedelCompletionFilter) => void;
  counts?: Partial<Record<PedelCompletionFilter, number>>;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
      {(Object.keys(LABELS) as PedelCompletionFilter[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition",
            value === key
              ? "bg-blue-700 text-white shadow-sm"
              : "text-slate-700 hover:bg-white",
          )}
        >
          {LABELS[key]}
          {counts?.[key] != null && (
            <span className="ml-1.5 tabular-nums opacity-80">
              ({counts[key]})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function PedelStatusBadge({ completed }: { completed: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        completed
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-900",
      )}
    >
      {completed ? "Udført" : "Mangler"}
    </span>
  );
}
