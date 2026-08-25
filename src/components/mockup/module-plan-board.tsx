"use client";

import { useState } from "react";
import { CheckCircle2, GripVertical, Plus } from "lucide-react";
import { formatDate, timingTotal, type CourseDay, type CourseModule } from "@/lib/mock-data";

type EditingModule = {
  dayId: string;
  moduleId: string;
} | null;

type DragPayload = {
  dayId: string;
  moduleId: string;
};

type DropTarget = {
  dayId: string;
  index: number;
} | null;

type ModulePlanBoardProps = {
  days: CourseDay[];
  editingModule: EditingModule;
  onSelectModule: (dayId: string, moduleId: string) => void;
  onAddModule: (dayId: string) => void;
  onMoveModule: (
    fromDayId: string,
    moduleId: string,
    toDayId: string,
    toIndex: number,
  ) => void;
};

const DRAG_MIME = "application/x-brandbjerg-module";

export function ModulePlanBoard({
  days,
  editingModule,
  onSelectModule,
  onAddModule,
  onMoveModule,
}: ModulePlanBoardProps) {
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);

  function handleDrop(toDayId: string, toIndex: number) {
    if (!dragging) return;
    onMoveModule(dragging.dayId, dragging.moduleId, toDayId, toIndex);
    setDragging(null);
    setDropTarget(null);
  }

  function clearDragState() {
    setDragging(null);
    setDropTarget(null);
  }

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
            dragging={dragging}
            dropTarget={dropTarget?.dayId === day.id ? dropTarget.index : null}
            onSelectModule={(moduleId) => onSelectModule(day.id, moduleId)}
            onAddModule={() => onAddModule(day.id)}
            onDragStart={(moduleId) =>
              setDragging({ dayId: day.id, moduleId })
            }
            onDragEnd={clearDragState}
            onDragOverIndex={(index) =>
              setDropTarget({ dayId: day.id, index })
            }
            onDropAtIndex={(index) => handleDrop(day.id, index)}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  day,
  activeModuleId,
  dragging,
  dropTarget,
  onSelectModule,
  onAddModule,
  onDragStart,
  onDragEnd,
  onDragOverIndex,
  onDropAtIndex,
}: {
  day: CourseDay;
  activeModuleId: string | null;
  dragging: DragPayload | null;
  dropTarget: number | null;
  onSelectModule: (moduleId: string) => void;
  onAddModule: () => void;
  onDragStart: (moduleId: string) => void;
  onDragEnd: () => void;
  onDragOverIndex: (index: number) => void;
  onDropAtIndex: (index: number) => void;
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

      <div
        className="flex flex-1 flex-col gap-2 p-2"
        onDragOver={(e) => {
          if (!dragging) return;
          e.preventDefault();
          onDragOverIndex(day.modules.length);
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDropAtIndex(day.modules.length);
        }}
      >
        {day.modules.length === 0 ? (
          <div
            className={`rounded-lg border border-dashed px-3 py-6 text-center text-xs transition ${
              dropTarget === 0
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-400"
            }`}
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              e.stopPropagation();
              onDragOverIndex(0);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDropAtIndex(0);
            }}
          >
            {dragging ? "Slip modul her" : "Ingen moduler endnu"}
          </div>
        ) : (
          day.modules.map((mod, index) => (
            <div key={mod.id}>
              <DropIndicator
                visible={dropTarget === index}
                onDragOver={(e) => {
                  if (!dragging) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onDragOverIndex(index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDropAtIndex(index);
                }}
              />
              <ModuleTile
                module={mod}
                dayId={day.id}
                active={activeModuleId === mod.id}
                isDragging={dragging?.moduleId === mod.id}
                isDropTarget={
                  dropTarget === index &&
                  dragging !== null &&
                  dragging.moduleId !== mod.id
                }
                onClick={() => onSelectModule(mod.id)}
                onDragStart={(moduleId) => onDragStart(moduleId)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => {
                  if (!dragging || dragging.moduleId === mod.id) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onDragOverIndex(index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDropAtIndex(index);
                }}
              />
            </div>
          ))
        )}

        {day.modules.length > 0 && (
          <DropIndicator
            visible={dropTarget === day.modules.length}
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              e.stopPropagation();
              onDragOverIndex(day.modules.length);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDropAtIndex(day.modules.length);
            }}
          />
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

function DropIndicator({
  visible,
  onDragOver,
  onDrop,
}: {
  visible: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      className={`h-1 rounded-full transition-all ${
        visible ? "my-1 h-1.5 bg-emerald-500" : "bg-transparent"
      }`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    />
  );
}

function ModuleTile({
  module: mod,
  dayId,
  active,
  isDragging,
  isDropTarget,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  module: CourseModule;
  dayId: string;
  active: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onClick: () => void;
  onDragStart: (moduleId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const timingSum = timingTotal(mod);
  const hasTiming = !mod.erMaltid && timingSum > 0;
  const meal = mod.maltid;

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      DRAG_MIME,
      JSON.stringify({ dayId, moduleId: mod.id }),
    );
    onDragStart(mod.id);
  }

  const dragRing = isDropTarget
    ? "ring-2 ring-emerald-400 ring-offset-1"
    : isDragging
      ? "opacity-40"
      : "";

  if (mod.erMaltid) {
    return (
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`group flex gap-1 ${dragRing}`}
      >
        <DragHandle onDragStart={handleDragStart} onDragEnd={onDragEnd} />
        <button
          type="button"
          onClick={onClick}
          className={`min-w-0 flex-1 rounded-lg border-2 border-dashed px-3 py-2.5 text-left transition hover:shadow-sm ${
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
      </div>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group flex gap-1 ${dragRing}`}
    >
      <DragHandle onDragStart={handleDragStart} onDragEnd={onDragEnd} />
      <button
        type="button"
        onClick={onClick}
        className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-left transition hover:shadow-sm ${
          active
            ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
            : mod.klar
              ? "border-emerald-200 bg-emerald-50/60"
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
        {mod.lokaleSpec?.lokale && (
          <p className="mt-1 text-xs text-slate-500">{mod.lokaleSpec.lokale}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-1">
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
    </div>
  );
}

function DragHandle({
  onDragStart,
  onDragEnd,
}: {
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="flex w-4 shrink-0 cursor-grab items-center justify-center self-stretch rounded text-slate-300 active:cursor-grabbing group-hover:text-slate-400"
      aria-label="Træk for at flytte modul"
    >
      <GripVertical className="h-4 w-4" />
    </div>
  );
}

export type { EditingModule };
