"use client";

import { useEffect, useState } from "react";
import { ClipboardList, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type PedelEvaluationDialogProps = {
  open: boolean;
  title: string;
  subtitle: string;
  initialText: string;
  contextLines?: string[];
  accent?: "blue" | "amber";
  onClose: () => void;
  onSave: (text: string) => void;
};

export function PedelEvaluationDialog({
  open,
  title,
  subtitle,
  initialText,
  contextLines = [],
  accent = "blue",
  onClose,
  onSave,
}: PedelEvaluationDialogProps) {
  const [text, setText] = useState(initialText);
  const iconClass = accent === "blue" ? "text-blue-700" : "text-amber-700";

  useEffect(() => {
    if (open) setText(initialText);
  }, [open, initialText]);

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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-3">
            <ClipboardList className={`mt-0.5 size-5 ${iconClass}`} aria-hidden />
            <div>
              <h2 className="font-semibold text-slate-900">{title}</h2>
              <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            </div>
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

        {contextLines.length > 0 && (
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-600">
            <p className="font-medium text-slate-700">Gemmes med opsætningsinfo:</p>
            <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto">
              {contextLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="px-5 py-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Evaluering</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Skriv evaluering — gemmes til senere opslag…"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoFocus
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuller
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave(text);
              onClose();
            }}
          >
            Gem evaluering
          </Button>
        </div>
      </div>
    </div>
  );
}
