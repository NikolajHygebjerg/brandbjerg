"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  deleteSavedMealPlan,
  KITCHEN_MEAL_LIBRARY_UPDATED_EVENT,
  listMealPlanTypes,
  listSavedMealPlans,
  type SavedMealPlanEntry,
} from "@/lib/kitchen-meal-library-storage";
import { cn } from "@/lib/utils";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function KitchenMadplanerList() {
  const [tick, setTick] = useState(0);
  const [activeType, setActiveType] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KITCHEN_MEAL_LIBRARY_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(KITCHEN_MEAL_LIBRARY_UPDATED_EVENT, refresh);
  }, []);

  const types = useMemo(() => listMealPlanTypes(), [tick]);
  const meals = useMemo(
    () => listSavedMealPlans(activeType ?? undefined),
    [activeType, tick],
  );

  useEffect(() => {
    if (activeType === null && types.length > 0) {
      setActiveType(types.find((t) => t === "Frokost") ?? types[0]);
    }
  }, [types, activeType]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Madplaner</h1>
        <p className="mt-1 text-sm text-slate-500">
          Inspirationsbibliotek — alle madplaner fra dagsplanerne gemmes her til
          genbrug og fremtidig AI-rådgivning
        </p>
      </div>

      <Card className="border-violet-200 bg-violet-50/50">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 text-violet-700" />
          <div>
            <CardTitle className="text-base text-violet-900">
              AI-inspirationsgrundlag
            </CardTitle>
            <CardDescription className="text-violet-800">
              Vælg en måltidstype nedenfor for at se tidligere madplaner. En
              senere AI-motor bruger disse data til at foreslå nye menuer.
            </CardDescription>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle className="text-base">Måltidstype</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveType(null)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              activeType === null
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
          >
            Alle
          </button>
          {types.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                activeType === type
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            {activeType ? `${activeType} — ` : ""}
            {meals.length} madplan{meals.length !== 1 ? "er" : ""}
          </p>
        </div>
        {meals.length === 0 ? (
          <p className="px-4 py-8 text-sm text-slate-500">
            Ingen madplaner endnu for{" "}
            {activeType ?? "den valgte type"}. Udfyld madplaner i dagsplanen —
            de gemmes automatisk her.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {meals.map((entry) => (
              <MealPlanLibraryRow
                key={entry.id}
                entry={entry}
                onDelete={() => deleteSavedMealPlan(entry.id)}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MealPlanLibraryRow({
  entry,
  onDelete,
}: {
  entry: SavedMealPlanEntry;
  onDelete: () => void;
}) {
  return (
    <li className="px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
              {entry.forplejning}
            </span>
            <span className="text-xs text-slate-500">
              Brugt {entry.usedCount} gang{entry.usedCount !== 1 ? "e" : ""} ·
              opdateret {formatWhen(entry.updatedAt)}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-900">
            {entry.menuText}
          </p>
          {entry.note && (
            <p className="mt-1 text-sm text-slate-600">{entry.note}</p>
          )}
        </div>
        {entry.id.startsWith("seed-") ? null : (
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Slet madplan"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </li>
  );
}
