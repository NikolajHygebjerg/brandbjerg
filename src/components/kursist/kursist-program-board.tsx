"use client";

import { useEffect, useMemo, useState } from "react";
import { KursuslederModuleDetailDialog } from "@/components/mockup/kursusleder-module-detail-dialog";
import { KursistEvaSmileyPanel } from "@/components/kursist/kursist-eva-smiley-panel";
import { Button } from "@/components/ui/button";
import {
  hasKursistModuleEva,
  KURSIST_EVA_UPDATED_EVENT,
} from "@/lib/kursist-eva-storage";
import {
  formatDate,
  isHeldagsturModule,
  isWorkshopModule,
  type Course,
  type CourseDay,
  type CourseModule,
} from "@/lib/mock-data";
import { moduleUnderviserLabel } from "@/lib/module-display-utils";
import { cn } from "@/lib/utils";

type EvaTarget = {
  day: CourseDay;
  module: CourseModule;
  title: string;
} | null;

type SelectedModule = {
  day: CourseDay;
  module: CourseModule;
} | null;

export function KursistProgramBoard({
  course,
  participantId,
}: {
  course: Course;
  participantId: string;
}) {
  const [selected, setSelected] = useState<SelectedModule>(null);
  const [evaTarget, setEvaTarget] = useState<EvaTarget>(null);
  const [evaTick, setEvaTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setEvaTick((t) => t + 1);
    }
    window.addEventListener(KURSIST_EVA_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(KURSIST_EVA_UPDATED_EVENT, refresh);
  }, []);

  const days = course.days ?? [];

  if (days.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
        Programmet er endnu ikke klar — kontakt kursuslederen.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-max divide-x divide-slate-200">
          {days.map((day) => (
            <DayColumn
              key={day.id}
              day={day}
              course={course}
              participantId={participantId}
              evaTick={evaTick}
              onSelectModule={(mod, title) =>
                setSelected({ day, module: mod })
              }
              onOpenEva={(mod, title) =>
                setEvaTarget({ day, module: mod, title })
              }
            />
          ))}
        </div>
      </div>

      {selected && (
        <KursuslederModuleDetailDialog
          open
          course={course}
          day={selected.day}
          module={selected.module}
          onClose={() => setSelected(null)}
          hideInterneNoter
        />
      )}

      {evaTarget && (
        <KursistEvaSmileyPanel
          open
          participantId={participantId}
          courseId={course.id}
          day={evaTarget.day}
          module={evaTarget.module}
          moduleTitle={evaTarget.title}
          onClose={() => setEvaTarget(null)}
        />
      )}
    </>
  );
}

function DayColumn({
  day,
  course,
  participantId,
  evaTick,
  onSelectModule,
  onOpenEva,
}: {
  day: CourseDay;
  course: Course;
  participantId: string;
  evaTick: number;
  onSelectModule: (mod: CourseModule, title: string) => void;
  onOpenEva: (mod: CourseModule, title: string) => void;
}) {
  return (
    <section className="flex w-[240px] shrink-0 flex-col bg-slate-50/50 sm:w-[260px]">
      <header className="border-b border-slate-200 bg-teal-50 px-3 py-3">
        <h3 className="text-sm font-semibold text-teal-950">{day.label}</h3>
        <p className="text-xs text-teal-800">{formatDate(day.date)}</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-teal-700/70">
          {day.modules.length} punkt{day.modules.length !== 1 ? "er" : ""}
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-2 p-2">
        {day.modules.map((mod) => (
          <ProgramModuleTile
            key={mod.id}
            module={mod}
            courseId={course.id}
            participantId={participantId}
            evaTick={evaTick}
            onOpen={() => onSelectModule(mod, moduleDisplayTitle(mod))}
            onOpenEva={() => onOpenEva(mod, moduleDisplayTitle(mod))}
          />
        ))}
      </div>
    </section>
  );
}

function moduleDisplayTitle(mod: CourseModule): string {
  if (mod.erMaltid && mod.maltid?.specifikation) {
    return mod.maltid.specifikation;
  }
  return mod.overskrift || "Punkt uden titel";
}

function ProgramModuleTile({
  module: mod,
  courseId,
  participantId,
  evaTick,
  onOpen,
  onOpenEva,
}: {
  module: CourseModule;
  courseId: string;
  participantId: string;
  evaTick: number;
  onOpen: () => void;
  onOpenEva: () => void;
}) {
  const ansvarlig = moduleUnderviserLabel(mod);
  const hasEva = useMemo(
    () => hasKursistModuleEva(courseId, mod.id, participantId),
    [courseId, mod.id, participantId, evaTick],
  );

  const tileClass = (() => {
    if (mod.erMaltid) {
      return "border-amber-200 bg-amber-50/80 hover:border-amber-300";
    }
    if (isWorkshopModule(mod)) {
      return "border-violet-200 bg-violet-50/80 hover:border-violet-300";
    }
    if (isHeldagsturModule(mod)) {
      return "border-blue-200 bg-blue-50/80 hover:border-blue-300";
    }
    return "border-slate-200 bg-white hover:border-teal-300";
  })();

  const title = moduleDisplayTitle(mod);

  return (
    <div className={`overflow-hidden rounded-lg border ${tileClass}`}>
      <button
        type="button"
        onClick={onOpen}
        className="w-full px-3 py-2.5 text-left transition hover:bg-white/40"
      >
        <p className="text-[11px] font-semibold tabular-nums text-slate-600">
          {mod.tidFra}–{mod.tidTil}
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-slate-900">
          {title}
        </p>
        {ansvarlig && (
          <p className="mt-1 text-xs text-slate-600">{ansvarlig}</p>
        )}
        <p className="mt-2 text-[10px] font-medium text-teal-700">
          Se detaljer →
        </p>
      </button>
      <div className="flex justify-end border-t border-inherit bg-white/50 px-2 py-1.5">
        <Button
          type="button"
          variant="secondary"
          className={cn("h-7 px-2 text-xs", hasEva && "ring-1 ring-emerald-400")}
          onClick={onOpenEva}
        >
          Eva
        </Button>
      </div>
    </div>
  );
}
