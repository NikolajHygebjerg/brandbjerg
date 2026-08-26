"use client";

import { AlertTriangle } from "lucide-react";
import type { KitchenPlanValidation } from "@/lib/kitchen-plan-rules";

type KitchenPlanWarningsProps = {
  validation: KitchenPlanValidation;
  compact?: boolean;
};

export function KitchenPlanWarnings({
  validation,
  compact = false,
}: KitchenPlanWarningsProps) {
  if (validation.ok) return null;

  const grouped = validation.warnings.reduce(
    (acc, w) => {
      const key = w.dayLabel;
      if (!acc[key]) acc[key] = [];
      acc[key].push(w.missing);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    <div
      className={`rounded-lg border border-amber-300 bg-amber-50 ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <p
        className={`flex items-center gap-2 font-medium text-amber-900 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <AlertTriangle className={compact ? "h-4 w-4 shrink-0" : "h-5 w-5 shrink-0"} />
        Køkkenplan mangler standardfelter ({validation.profileLabel})
      </p>
      <ul
        className={`mt-2 space-y-1 text-amber-900 ${
          compact ? "text-[11px]" : "text-xs"
        }`}
      >
        {Object.entries(grouped).map(([day, missing]) => (
          <li key={day}>
            <span className="font-medium">{day}:</span> {missing.join(", ")}
          </li>
        ))}
      </ul>
      {!compact && (
        <p className="mt-2 text-xs text-amber-800">
          Tilføj manglende måltidsmoduler i modulplanen (fx Formiddag og
          Eftermiddag som mellemmåltider). Planen sendes først til køkkenet når
          alle krævede felter er udfyldt og godkendt.
        </p>
      )}
    </div>
  );
}
