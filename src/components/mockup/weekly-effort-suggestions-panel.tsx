"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Lightbulb, Megaphone, NotebookPen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDate, weekLabel } from "@/lib/mock-data";
import {
  KOMMUNIKATION_UPDATED_EVENT,
  loadExperienceNotes,
  saveExperienceNotes,
} from "@/lib/kommunikation-storage";
import { buildWeeklyEffortSuggestions } from "@/lib/kommunikation-weekly-suggestions";
import { paceStatusClasses } from "@/lib/kommunikation-utils";
import type { WeeklyEffortSuggestionsResult } from "@/lib/kommunikation-types";

type WeeklyEffortSuggestionsPanelProps = {
  year: number;
  open: boolean;
  onClose: () => void;
};

export function WeeklyEffortSuggestionsPanel({
  year,
  open,
  onClose,
}: WeeklyEffortSuggestionsPanelProps) {
  const [tick, setTick] = useState(0);
  const [notes, setNotes] = useState("");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNotes(loadExperienceNotes().notes);
    }
  }, [open]);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
  }, []);

  const result: WeeklyEffortSuggestionsResult | null = useMemo(() => {
    if (!open) return null;
    return buildWeeklyEffortSuggestions(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, year, tick]);

  if (!open || !result) return null;

  function handleSaveNotes() {
    saveExperienceNotes(notes);
    setSavedNotice("Erfaringsnotat gemt — forslag opdateres automatisk.");
    setTick((t) => t + 1);
    setTimeout(() => setSavedNotice(null), 3000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-8">
      <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-xl border-b border-purple-200 bg-gradient-to-r from-purple-700 to-purple-900 px-5 py-4 text-white">
          <div>
            <p className="flex items-center gap-2 text-lg font-bold">
              <Megaphone className="h-5 w-5" />
              Forslag til indsats denne uge
            </p>
            <p className="mt-1 text-sm text-purple-100">
              Baseret på «burde være», budget, salgsvindue og historik
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-purple-100 hover:bg-white/10"
            aria-label="Luk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-950">
            {result.summaryLines.map((line, i) => (
              <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                {line}
              </p>
            ))}
          </div>

          {result.suggestions.length > 0 ? (
            <div className="space-y-3">
              {result.suggestions.map((s, index) => (
                <Card key={s.courseId} className="border-slate-200">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-purple-700">
                        Prioritet {index + 1}
                      </p>
                      <CardTitle className="text-base">{s.title}</CardTitle>
                      <CardDescription>
                        {weekLabel(s.weekNumber)} · {formatDate(s.startDate)} ·{" "}
                        {s.monthsBeforeStart} mdr. til start
                      </CardDescription>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${paceStatusClasses[s.pace]}`}
                    >
                      Mangler {s.gap} ({s.enrolled}/{s.expected} burde være)
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <p>
                      <span className="font-medium">Budget:</span> {s.budget}{" "}
                      pladser
                    </p>
                    <p>
                      <span className="font-medium">Timing:</span> {s.timingReason}
                    </p>
                    {s.suggestedChannel && (
                      <p className="sm:col-span-2">
                        <span className="font-medium">Foreslået kanal:</span>{" "}
                        {s.suggestedChannel}
                        {s.channelReason ? ` — ${s.channelReason}` : ""}
                      </p>
                    )}
                    {s.historicalHint && (
                      <p className="sm:col-span-2 text-slate-600">
                        {s.historicalHint}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/kommunikation/${s.courseId}`}>
                      <Button variant="primary" className="bg-purple-700 hover:bg-purple-800">
                        Opret indsats →
                      </Button>
                    </Link>
                    {s.effortCount > 0 && (
                      <span className="self-center text-xs text-slate-500">
                        {s.effortCount} eksisterende indsats
                        {s.effortCount !== 1 ? "er" : ""}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardDescription>
                Ingen kurser opfylder kriterierne lige nu. Tjek listen over
                udeladte kurser nedenfor.
              </CardDescription>
            </Card>
          )}

          {(result.skippedTooEarly.length > 0 ||
            result.skippedTooLate.length > 0) && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-600">
                <CalendarClock className="h-3.5 w-3.5" />
                Kurser uden for vinduet (selvom tallene er lave)
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {result.skippedTooEarly.map((c) => (
                  <li key={`early-${c.courseId}`}>
                    <span className="font-medium">{c.title}</span> — {c.reason}
                  </li>
                ))}
                {result.skippedTooLate.map((c) => (
                  <li key={`late-${c.courseId}`}>
                    <span className="font-medium">{c.title}</span> — {c.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-950">
              <NotebookPen className="h-4 w-4" />
              Team-erfaringsnotat
            </p>
            <p className="mt-1 text-xs text-amber-900">
              Notér erfaringer her — appen medtager dem i ugens forslag og
              prioritering (fx sæsonregler og timing).
            </p>
            <textarea
              className="mt-3 min-h-[100px] w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fx: Augustkurser skal reklameres i juni–juli, ikke efter sommerferien…"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={handleSaveNotes}>
                Gem erfaringsnotat
              </Button>
              {savedNotice && (
                <span className="text-sm text-emerald-700">{savedNotice}</span>
              )}
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-amber-900">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Ja — et fælles notatfelt giver mening: det fanger viden som ikke
              står i tilmeldingstal, og teamet kan løbende finjustere
              anbefalingerne uden at ændre reglerne i koden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
