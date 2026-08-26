"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createWorkshopOption,
  type WorkshopOption,
} from "@/lib/workshop-types";

type WorkshopPlanEditorProps = {
  options: WorkshopOption[];
  onChange: (options: WorkshopOption[]) => void;
};

export function WorkshopPlanEditor({
  options,
  onChange,
}: WorkshopPlanEditorProps) {
  function updateOption(id: string, patch: Partial<WorkshopOption>) {
    onChange(options.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function removeOption(id: string) {
    onChange(options.filter((o) => o.id !== id));
  }

  function addOption() {
    onChange([...options, createWorkshopOption()]);
  }

  return (
    <div className="space-y-4">
      {options.length === 0 && (
        <p className="text-sm text-violet-800">
          Tilføj mindst én workshop som kursister kan vælge ved tilmelding.
        </p>
      )}
      {options.map((option, index) => (
        <div
          key={option.id}
          className="rounded-lg border border-violet-200 bg-violet-50/50 p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-violet-900">
              Workshop {index + 1}
            </p>
            <button
              type="button"
              onClick={() => removeOption(option.id)}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Fjern
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Overskrift"
              value={option.overskrift}
              onChange={(v) => updateOption(option.id, { overskrift: v })}
            />
            <Field
              label="Underviser (valgfri)"
              value={option.underviser}
              onChange={(v) => updateOption(option.id, { underviser: v })}
            />
            <Field
              label="Maks antal deltagere"
              type="number"
              value={String(option.maxDeltagere || "")}
              onChange={(v) =>
                updateOption(option.id, {
                  maxDeltagere: Math.max(1, Number(v) || 1),
                })
              }
            />
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-500">
                Brødtekst
              </label>
              <textarea
                value={option.broedtekst}
                onChange={(e) =>
                  updateOption(option.id, { broedtekst: e.target.value })
                }
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" className="gap-2" onClick={addOption}>
        <Plus className="h-4 w-4" />
        Tilføj workshop
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </div>
  );
}
