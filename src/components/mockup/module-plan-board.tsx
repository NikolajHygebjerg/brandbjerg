"use client";

import { CheckCircle2, Plus } from "lucide-react";
import { formatDate, timingTotal, type CourseDay, type CourseModule } from "@/lib/mock-data";

type EditingModule = {
  dayId: string;
  moduleId: string;
} | null;

type ModulePlanBoardProps = {
  days: CourseDay[];
  editingModule: EditingModule;
  onSelectModule: (dayId: string, moduleId: string) => void;
  onAddModule: (dayId: string) => void;
};

export function ModulePlanBoard({
  days,
  editingModule,
  onSelectModule,
  onAddModule,
}: ModulePlanBoardProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <div className="flex min-w-max divide-x divide-slate-200">
        {days.map((day) => (
          <DayColumn
            key={day.id}
            day={day}
            activeModuleId={
              editingModule?.dayId === day.id ? editingModule.moduleId : null
            }
            onSelectModule={(moduleId) => onSelectModule(day.id, moduleId)}
            onAddModule={() => onAddModule(day.id)}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  day,
  activeModuleId,
  onSelectModule,
  onAddModule,
}: {
  day: CourseDay;
  activeModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
  onAddModule: () => void;
}) {
  return (
    <section className="flex w-[220px] shrink-0 flex-col bg-slate-50/50 sm:w-[240px]">
      <header className="border-b border-slate-200 bg-white px-3 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{day.label}</h3>
        <p className="text-xs text-slate-500">{formatDate(day.date)}</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {day.modules.length} moduler
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-2 p-2">
        {day.modules.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-400">
            Ingen moduler endnu
          </p>
        ) : (
          day.modules.map((mod) => (
            <ModuleTile
              key={mod.id}
              module={mod}
              active={activeModuleId === mod.id}
              onClick={() => onSelectModule(mod.id)}
            />
          ))
        )}

        <button
          type="button"
          onClick={onAddModule}
          className="mt-1 flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-2 py-2 text-xs font-medium text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Tilføj modul
        </button>
      </div>
    </section>
  );
}

function ModuleTile({
  module: mod,
  active,
  onClick,
}: {
  module: CourseModule;
  active: boolean;
  onClick: () => void;
}) {
  const timingSum = timingTotal(mod);
  const hasTiming = !mod.erMaltid && timingSum > 0;
  const meal = mod.maltid;

  if (mod.erMaltid) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-lg border-2 border-dashed px-3 py-2.5 text-left transition hover:shadow-sm ${
          active
            ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
            : "border-amber-300 bg-amber-50/90 hover:border-amber-400"
        }`}
      >
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
          <span className="rounded bg-amber-200 px-1.5 py-0.5">
            {meal?.forplejning || "Måltid"}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] font-semibold tabular-nums text-slate-600">
          {mod.tidFra}–{mod.tidTil}
        </p>
        <p className="mt-1 text-sm font-medium leading-snug text-slate-900">
          {meal?.specifikation || mod.overskrift || "Forplejning"}
        </p>
        {meal?.lokale && (
          <p className="mt-1 text-xs text-slate-600">{meal.lokale}</p>
        )}
        {meal?.note && (
          <p className="mt-1 line-clamp-2 text-[10px] italic text-slate-500">
            {meal.note}
          </p>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border px-3 py-2.5 text-left transition hover:shadow-sm ${
        active
          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
          : mod.klar
            ? "border-emerald-200 bg-emerald-50/60"
            : mod.erMaltid
              ? "border-amber-200 bg-amber-50/80"
              : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold tabular-nums text-slate-500">
          {mod.tidFra}–{mod.tidTil}
        </span>
        {mod.klar && (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        )}
      </div>

      <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-slate-900">
        {mod.overskrift || "Nyt modul"}
      </p>

      {mod.rolle && (
        <p className="mt-1 text-xs text-slate-600">{mod.rolle}</p>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        {mod.erMaltid && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
            Måltid
          </span>
        )}
        {mod.lon && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
            Løn {mod.lon}
          </span>
        )}
        {hasTiming && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
            U {mod.timing.ubak} F {mod.timing.ft} P {mod.timing.pts}
          </span>
        )}
      </div>
    </button>
  );
}

export type { EditingModule };
