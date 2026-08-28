"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  KURSUSLEDER_EVALUATION_UPDATED_EVENT,
  listKursuslederEvaluations,
  type KursuslederEvaluationRecord,
} from "@/lib/kursusleder-evaluation-storage";
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

function kindLabel(kind: KursuslederEvaluationRecord["kind"]): string {
  return kind === "course" ? "Kursus" : "Punkt";
}

function EvaluationCard({ record }: { record: KursuslederEvaluationRecord }) {
  const [expanded, setExpanded] = useState(false);

  const headline =
    record.kind === "course"
      ? `${record.courseTitle} — kursus`
      : `${record.moduleSnapshot?.overskrift || "Modul"} · ${record.dayLabel}`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{headline}</p>
          <p className="text-xs text-slate-500">
            {kindLabel(record.kind)} · {record.courseTitle} · opdateret{" "}
            {formatWhen(record.updatedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 hover:underline"
        >
          {expanded ? (
            <>
              Skjul <ChevronUp className="size-3.5" />
            </>
          ) : (
            <>
              Læs <ChevronDown className="size-3.5" />
            </>
          )}
        </button>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
        {expanded ? record.text : truncate(record.text, 120)}
      </p>
    </div>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function KursuslederEvaluationHistory({
  courseId,
}: {
  courseId?: string;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KURSUSLEDER_EVALUATION_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(KURSUSLEDER_EVALUATION_UPDATED_EVENT, refresh);
  }, []);

  const evaluations = useMemo(
    () => listKursuslederEvaluations(courseId ? { courseId } : undefined),
    [courseId, tick],
  );

  if (evaluations.length === 0) {
    return (
      <Card className="border-slate-200">
        <div className="flex items-center gap-3">
          <BookOpen className="size-5 text-slate-400" />
          <div>
            <CardTitle className="text-base">Mine evalueringer</CardTitle>
            <CardDescription>
              Ingen evalueringer endnu — brug Evaluering (kursus) eller Eva
              (punkt) i programmet.
            </CardDescription>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <BookOpen className="size-5 text-teal-700" />
        <div>
          <CardTitle className="text-base">Mine evalueringer</CardTitle>
          <CardDescription>
            {evaluations.length} gemte evalueringer
            {courseId ? " for dette kursus" : ""}
          </CardDescription>
        </div>
      </div>
      <div className={cn("mt-4 max-h-96 space-y-3 overflow-y-auto")}>
        {evaluations.map((record) => (
          <EvaluationCard key={record.id} record={record} />
        ))}
      </div>
    </Card>
  );
}
