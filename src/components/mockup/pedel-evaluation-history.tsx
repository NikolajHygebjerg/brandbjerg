"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  listPedelEvaluations,
  PEDEL_EVALUATION_UPDATED_EVENT,
  type PedelEvaluationRecord,
} from "@/lib/pedel-evaluation-storage";
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

function kindLabel(kind: PedelEvaluationRecord["kind"]): string {
  switch (kind) {
    case "course":
      return "Kursus";
    case "day":
      return "Dag";
    case "room":
      return "Lokale";
    case "entry":
      return "Punkt";
  }
}

function EvaluationCard({ record }: { record: PedelEvaluationRecord }) {
  const [expanded, setExpanded] = useState(false);

  const headline =
    record.kind === "course"
      ? `${record.courseTitle} — kursus`
      : record.kind === "day"
        ? `${record.dayLabel} · ${record.date}`
        : record.kind === "room"
          ? `${record.lokale} · ${record.dayLabel}`
          : `${record.entrySnapshot?.overskrift || record.lokale} · ${record.entrySnapshot?.tidFra}`;

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
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-800 hover:underline"
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

export function PedelEvaluationHistory() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(PEDEL_EVALUATION_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(PEDEL_EVALUATION_UPDATED_EVENT, refresh);
  }, []);

  const evaluations = useMemo(() => listPedelEvaluations(), [tick]);

  if (evaluations.length === 0) {
    return (
      <Card className="border-slate-200">
        <div className="flex items-center gap-3">
          <BookOpen className="size-5 text-slate-400" />
          <div>
            <CardTitle className="text-base">Mine evalueringer</CardTitle>
            <CardDescription>
              Ingen evalueringer endnu — brug Evaluering (dag/kursus) eller Eva
              (lokale/punkt) i dagsplanen.
            </CardDescription>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-3">
        <BookOpen className="size-5 text-blue-700" />
        <div>
          <CardTitle className="text-base">Mine evalueringer</CardTitle>
          <CardDescription>
            {evaluations.length} gemte evalueringer fra pedel og rengøring
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
