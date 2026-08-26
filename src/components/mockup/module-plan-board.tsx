"use client";

import { useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import { ModuleQuestionAlert } from "@/components/mockup/module-questions";
import {
  heldagsturPunktLabels,
  punktDisplayTitle,
  type HeldagsturPunkt,
} from "@/lib/heldagstur-utils";
import {
  formatDate,
  isHeldagsturModule,
  timingTotal,
  type CourseDay,
  type CourseModule,
} from "@/lib/mock-data";
import { moduleUnderviserLabel } from "@/lib/module-display-utils";

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
  courseId?: string;
  editingModule: EditingModule;
  onSelectModule: (dayId: string, moduleId: string) => void;
  onAddModule: (dayId: string) => void;
  onMoveModule: (
    fromDayId: string,
    moduleId: string,
    toDayId: string,
    toIndex: number,
  ) => void;
  onToggleModuleReady: (
    dayId: string,
    moduleId: string,
    klar: boolean,
  ) => void;
  onToggleHeldagsturPunkt: (
    dayId: string,
    moduleId: string,
    punktId: string,
    klar: boolean,
  ) => void;
};

const DRAG_MIME = "application/x-brandbjerg-module";

export function ModulePlanBoard({
  days,
  courseId,
  editingModule,
  onSelectModule,
  onAddModule,
  onMoveModule,
  onToggleModuleReady,
  onToggleHeldagsturPunkt,
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
            onToggleModuleReady={onToggleModuleReady}
            onToggleHeldagsturPunkt={onToggleHeldagsturPunkt}
            courseId={courseId}
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
  onToggleModuleReady,
  onToggleHeldagsturPunkt,
  courseId,
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
  onToggleModuleReady: (
    dayId: string,
    moduleId: string,
    klar: boolean,
  ) => void;
  onToggleHeldagsturPunkt: (
    dayId: string,
    moduleId: string,
    punktId: string,
    klar: boolean,
  ) => void;
  courseId?: string;
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
                onToggleReady={(klar) =>
                  onToggleModuleReady(day.id, mod.id, klar)
                }
                onToggleHeldagsturPunkt={(punktId, klar) =>
                  onToggleHeldagsturPunkt(day.id, mod.id, punktId, klar)
                }
                courseId={courseId}
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
  onToggleReady,
  onToggleHeldagsturPunkt,
  courseId,
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
  onToggleReady: (klar: boolean) => void;
  onToggleHeldagsturPunkt: (punktId: string, klar: boolean) => void;
  courseId?: string;
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

  if (isHeldagsturModule(mod)) {
    const punkter = mod.heldagstur?.punkter ?? [];
    return (
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`group flex gap-1 ${dragRing}`}
      >
        <DragHandle onDragStart={handleDragStart} onDragEnd={onDragEnd} />
        <div className="relative min-w-0 flex-1">
          {courseId && (
            <div className="absolute right-2 top-2 z-10">
              <ModuleQuestionAlert courseId={courseId} moduleId={mod.id} />
            </div>
          )}
          <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-lg border-2 border-dashed px-3 py-2.5 pr-8 text-left transition hover:shadow-sm ${
              active
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-blue-300 bg-blue-50/80 hover:border-blue-400"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-800">
              <span className="rounded bg-blue-200 px-1.5 py-0.5">Heldagstur</span>
            </div>
            <p className="mt-1.5 text-[11px] font-semibold tabular-nums text-slate-600">
              {mod.tidFra}–{mod.tidTil}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {mod.overskrift || "Heldagstur"}
            </p>
            {punkter.length === 0 && (
              <p className="mt-2 text-xs text-blue-700">
                Klik for at oprette dagsplan
              </p>
            )}
          </button>

          {punkter.length > 0 && (
            <ul className="mt-1 space-y-1 border-l-2 border-blue-200 pl-2">
              {punkter.map((punkt) => (
                <HeldagsturPunktTile
                  key={punkt.id}
                  punkt={punkt}
                  onToggleKlar={(klar) =>
                    onToggleHeldagsturPunkt(punkt.id, klar)
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  if (mod.erMaltid) {
    return (
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`group flex gap-1 ${dragRing}`}
      >
        <DragHandle onDragStart={handleDragStart} onDragEnd={onDragEnd} />
        <div className="relative min-w-0 flex-1">
          <ReadyCheckbox
            checked={mod.klar}
            onChange={onToggleReady}
            className="absolute right-2 top-2 z-10"
          />
          {courseId && (
            <div className="absolute right-8 top-2 z-10">
              <ModuleQuestionAlert courseId={courseId} moduleId={mod.id} />
            </div>
          )}
          <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-lg border-2 border-dashed px-3 py-2.5 pr-12 text-left transition hover:shadow-sm ${
              active
                ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                : mod.klar
                  ? "border-emerald-300 bg-emerald-50/80"
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
      <div className="relative min-w-0 flex-1">
        <ReadyCheckbox
          checked={mod.klar}
          onChange={onToggleReady}
          className="absolute right-2 top-2 z-10"
        />
        {courseId && (
          <div className="absolute right-8 top-2 z-10">
            <ModuleQuestionAlert courseId={courseId} moduleId={mod.id} />
          </div>
        )}
        <button
          type="button"
          onClick={onClick}
          className={`w-full rounded-lg border px-3 py-2.5 pr-12 text-left transition hover:shadow-sm ${
            active
              ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
              : mod.klar
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-start justify-between gap-2 pr-4">
            <span className="text-[11px] font-semibold tabular-nums text-slate-500">
              {mod.tidFra}–{mod.tidTil}
            </span>
          </div>

        <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-slate-900">
          {mod.overskrift || "Nyt modul"}
        </p>

        {moduleUnderviserLabel(mod) && (
          <p className="mt-1 text-xs text-slate-600">
            {moduleUnderviserLabel(mod)}
          </p>
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
    </div>
  );
}

function HeldagsturPunktTile({
  punkt,
  onToggleKlar,
}: {
  punkt: HeldagsturPunkt;
  onToggleKlar: (klar: boolean) => void;
}) {
  const typeClass =
    punkt.type === "maltid"
      ? "border-amber-200 bg-amber-50/90"
      : "border-slate-200 bg-white";

  return (
    <li
      className={`relative rounded-md border px-2 py-1.5 pr-8 ${typeClass}`}
      onClick={(e) => e.stopPropagation()}
    >
      <ReadyCheckbox
        checked={punkt.klar}
        onChange={onToggleKlar}
        className="absolute right-1 top-1.5 z-10"
      />
      <p className="text-[10px] font-bold uppercase text-slate-500">
        {heldagsturPunktLabels[punkt.type]}
      </p>
      <p className="text-[10px] tabular-nums text-slate-500">
        {punkt.tidFra}–{punkt.tidTil}
      </p>
      <p className="text-xs font-medium text-slate-900">
        {punktDisplayTitle(punkt)}
      </p>
    </li>
  );
}

function ReadyCheckbox({
  checked,
  onChange,
  className = "",
}: {
  checked: boolean;
  onChange: (klar: boolean) => void;
  className?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-center ${className}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        aria-label={checked ? "Modul er klar" : "Markér modul som klar"}
      />
    </label>
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
