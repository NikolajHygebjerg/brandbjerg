"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  findKursistModuleEva,
  saveKursistModuleComment,
  saveKursistSmileyRating,
} from "@/lib/kursist-eva-storage";
import { SMILEY_OPTIONS, type SmileyScore } from "@/lib/smiley-ratings";
import type { CourseDay, CourseModule } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type KursistEvaSmileyPanelProps = {
  open: boolean;
  participantId: string;
  courseId: string;
  day: CourseDay;
  module: CourseModule;
  moduleTitle: string;
  onClose: () => void;
};

export function KursistEvaSmileyPanel({
  open,
  participantId,
  courseId,
  day,
  module,
  moduleTitle,
  onClose,
}: KursistEvaSmileyPanelProps) {
  const [selectedScore, setSelectedScore] = useState<SmileyScore | null>(null);
  const [comment, setComment] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [commentSaved, setCommentSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const existing = findKursistModuleEva(courseId, module.id, participantId);
    setSelectedScore(existing?.score ?? null);
    setComment(existing?.comment ?? "");
    setSavedFlash(false);
    setCommentSaved(false);
  }, [open, courseId, module.id, participantId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleSmiley(score: SmileyScore) {
    saveKursistSmileyRating({
      participantId,
      courseId,
      moduleId: module.id,
      score,
      moduleTitle,
      dayLabel: day.label,
      dayDate: day.date,
      tidFra: module.tidFra,
      tidTil: module.tidTil,
      comment,
    });
    setSelectedScore(score);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1200);
  }

  function handleSaveComment() {
    saveKursistModuleComment(courseId, module.id, participantId, comment);
    setCommentSaved(true);
    window.setTimeout(() => setCommentSaved(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
              Eva · {day.label}
            </p>
            <h2 className="mt-0.5 font-semibold text-slate-900">{moduleTitle}</h2>
            <p className="text-xs tabular-nums text-slate-500">
              Kl. {module.tidFra}–{module.tidTil}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Luk"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-center text-sm font-medium text-slate-800">
            Hvad synes du om dette punkt?
          </p>

          {savedFlash && (
            <p className="mt-2 text-center text-xs font-medium text-emerald-600">
              Gemt!
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
            {SMILEY_OPTIONS.map(({ score, emoji, label }) => (
              <button
                key={score}
                type="button"
                aria-label={label}
                onClick={() => handleSmiley(score)}
                className={cn(
                  "flex h-14 w-14 flex-col items-center justify-center rounded-xl border transition active:scale-95 sm:h-16 sm:w-16",
                  selectedScore === score
                    ? "border-teal-500 bg-teal-50 ring-2 ring-teal-300"
                    : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50",
                )}
              >
                <span className="text-3xl sm:text-4xl" aria-hidden>
                  {emoji}
                </span>
              </button>
            ))}
          </div>

          {selectedScore !== null && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">
                  Tilføj kommentar (valgfrit)
                </span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Skriv evt. hvad der var godt eller kunne være bedre…"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  Din smiley er allerede gemt
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 text-xs"
                  onClick={handleSaveComment}
                >
                  {commentSaved ? "Gemt!" : "Gem kommentar"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-5 py-3 text-right">
          <Button type="button" variant="ghost" onClick={onClose}>
            Luk
          </Button>
        </div>
      </div>
    </div>
  );
}
