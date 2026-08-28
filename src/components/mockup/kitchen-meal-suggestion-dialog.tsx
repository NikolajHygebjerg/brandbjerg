"use client";

import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDummyDayMealSuggestions } from "@/lib/kitchen-meal-library-storage";
import type { KitchenMealSlotPlan } from "@/lib/kitchen-meal-plan-storage";

type KitchenMealSuggestionDialogProps = {
  open: boolean;
  dayLabel: string;
  slots: KitchenMealSlotPlan[];
  onClose: () => void;
  onApply: (slotId: string, menuText: string) => void;
};

export function KitchenMealSuggestionDialog({
  open,
  dayLabel,
  slots,
  onClose,
  onApply,
}: KitchenMealSuggestionDialogProps) {
  const suggestions = getDummyDayMealSuggestions(slots);

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
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
            <Sparkles className="mt-0.5 size-5 text-violet-600" />
            <div>
              <h2 className="font-semibold text-slate-900">
                Forslag til madplan
              </h2>
              <p className="text-sm text-slate-500">{dayLabel}</p>
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

        <div className="border-b border-violet-100 bg-violet-50 px-5 py-3 text-sm text-violet-900">
          Dummy-forslag — AI-motoren til madplanlægning kommer senere. Forslag
          hentes midlertidigt fra madplanbiblioteket.
        </div>

        <div className="space-y-4 px-5 py-4">
          {suggestions.map(({ slotId, label, forplejning, suggestion }) => (
            <div
              key={slotId}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <p className="text-sm font-medium text-slate-900">
                {label}{" "}
                <span className="font-normal text-slate-500">
                  ({forplejning})
                </span>
              </p>
              <p className="mt-2 text-sm text-slate-700">{suggestion}</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-2 h-8 text-xs"
                onClick={() => {
                  onApply(slotId, suggestion);
                }}
              >
                Brug forslag
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-5 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Luk
          </Button>
        </div>
      </div>
    </div>
  );
}
