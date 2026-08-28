"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  KITCHEN_EVALUATION_UPDATED_EVENT,
  listKitchenEvaluations,
  type KitchenEvaluationRecord,
} from "@/lib/kitchen-evaluation-storage";
import { weekLabel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EvaluationCard({ record }: { record: KitchenEvaluationRecord }) {
  const [expanded, setExpanded] = useState(false);

  const headline =
    record.kind === "week"
      ? `${weekLabel(record.weekNumber)} ${record.year} — ugeevaluering`
      : `${record.dayName} ${record.date?.slice(5).replace("-", "/")} · ${record.slotLabel}`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{headline}</p>
          <p className="text-xs text-slate-500">
            Opdateret {formatWhen(record.updatedAt)}
            {record.kind === "meal" && record.forplejning
              ? ` · ${record.forplejning}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:underline"
        >
          {expanded ? (
            <>
              Skjul <ChevronUp className="size-3.5" />
            </>
          ) : (
            <>
              Læs evaluering <ChevronDown className="size-3.5" />
            </>
          )}
        </button>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
        {expanded ? record.text : truncate(record.text, 120)}
      </p>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {record.weekStats && (
            <p>
              Uge: {record.weekStats.budgetTotal} budget ·{" "}
              {record.weekStats.enrolledTotal} tilmeldte ·{" "}
              {record.weekStats.courseCount} kurser · {record.weekStats.staffOnDuty}{" "}
              medarbejdere
            </p>
          )}
          {record.plannedMenu && (
            <p>
              <span className="font-medium">Madplan:</span> {record.plannedMenu}
            </p>
          )}
          {record.courses.length > 0 && (
            <div>
              <p className="font-medium text-slate-700">Kurser:</p>
              <ul className="mt-1 list-inside list-disc">
                {record.courses.map((c) => (
                  <li key={c.courseId}>
                    {c.courseTitle} — {c.enrolled}/{c.budgetStudents} pers. ·{" "}
                    {c.responsible}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {record.mealCourses && record.mealCourses.length > 0 && (
            <div>
              <p className="font-medium text-slate-700">Serveringer:</p>
              <ul className="mt-1 list-inside list-disc">
                {record.mealCourses.map((m) => (
                  <li key={`${m.courseId}-${m.moduleId}`}>
                    {m.courseTitle}: {m.antalPersoner} pers. · {m.specifikation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function KitchenEvaluationHistory({ activeYear }: { activeYear: number }) {
  const [tick, setTick] = useState(0);
  const [showAllYears, setShowAllYears] = useState(false);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KITCHEN_EVALUATION_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(KITCHEN_EVALUATION_UPDATED_EVENT, refresh);
  }, []);

  const evaluations = useMemo(
    () =>
      listKitchenEvaluations(
        showAllYears ? undefined : { year: activeYear },
      ),
    [activeYear, showAllYears, tick],
  );

  if (evaluations.length === 0) {
    return (
      <Card className="border-slate-200">
        <div className="flex items-center gap-3">
          <BookOpen className="size-5 text-slate-400" />
          <div>
            <CardTitle className="text-base">Mine evalueringer</CardTitle>
            <CardDescription>
              Ingen evalueringer endnu — brug Evaluering (uge) eller Eva (måltid)
              i madplanen.
            </CardDescription>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="size-5 text-amber-700" />
          <div>
            <CardTitle className="text-base">Mine evalueringer</CardTitle>
            <CardDescription>
              {evaluations.length} gemte evalueringer — klar til opslag og fremtidig
              AI-rådgivning
            </CardDescription>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-8 text-xs"
          onClick={() => setShowAllYears((v) => !v)}
        >
          {showAllYears ? `Kun ${activeYear}` : "Alle år"}
        </Button>
      </div>
      <div className={cn("mt-4 max-h-96 space-y-3 overflow-y-auto")}>
        {evaluations.map((record) => (
          <EvaluationCard key={record.id} record={record} />
        ))}
      </div>
    </Card>
  );
}
