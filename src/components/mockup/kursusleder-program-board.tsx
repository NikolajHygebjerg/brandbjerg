"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PedelEvaluationDialog } from "@/components/mockup/pedel-evaluation-dialog";
import { KursuslederModuleDetailDialog } from "@/components/mockup/kursusleder-module-detail-dialog";
import {
  buildModuleContextLines,
  findKursuslederEvaluation,
  hasKursuslederEvaluation,
  KURSUSLEDER_EVALUATION_UPDATED_EVENT,
  saveKursuslederEvaluation,
} from "@/lib/kursusleder-evaluation-storage";
import {
  formatDate,
  isHeldagsturModule,
  isWorkshopModule,
  type Course,
  type CourseDay,
  type CourseModule,
} from "@/lib/mock-data";
import { moduleUnderviserLabel } from "@/lib/module-display-utils";
import {
  getBudgetAntal,
  getRealiseretAntal,
} from "@/lib/course-enrollment-counts";
import { cn } from "@/lib/utils";

type SelectedModule = {
  day: CourseDay;
  module: CourseModule;
} | null;

type EvalTarget = {
  day: CourseDay;
  module: CourseModule;
} | null;

export function KursuslederProgramBoard({ course }: { course: Course }) {
  const [selected, setSelected] = useState<SelectedModule>(null);
  const [evalTarget, setEvalTarget] = useState<EvalTarget>(null);
  const [evalTick, setEvalTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setEvalTick((t) => t + 1);
    }
    window.addEventListener(KURSUSLEDER_EVALUATION_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(KURSUSLEDER_EVALUATION_UPDATED_EVENT, refresh);
  }, []);

  const days = course.days ?? [];

  if (days.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
        Intet program endnu — kontakt planlægning for at få udfyldt modulplan.
      </p>
    );
  }

  const evalDialog =
    evalTarget &&
    (() => {
      const { day, module: mod } = evalTarget;
      const existing = findKursuslederEvaluation("module", course.id, mod.id);
      return (
        <PedelEvaluationDialog
          open
          accent="blue"
          title={`Eva — ${mod.overskrift || "Modul"}`}
          subtitle={`${day.label} · ${formatDate(day.date)} · ${mod.tidFra}–${mod.tidTil}`}
          initialText={existing?.text ?? ""}
          contextLines={buildModuleContextLines(day, mod)}
          onClose={() => setEvalTarget(null)}
          onSave={(text) => {
            saveKursuslederEvaluation({
              kind: "module",
              courseId: course.id,
              courseTitle: course.title,
              text,
              date: day.date,
              dayLabel: day.label,
              moduleId: mod.id,
              module: mod,
              courseMeta: { id: course.id, weekNumber: course.weekNumber },
              enrolled: getRealiseretAntal(course),
              budgetStudents: getBudgetAntal(course),
            });
          }}
        />
      );
    })();

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="flex min-w-max divide-x divide-slate-200">
          {days.map((day) => (
            <DayColumn
              key={day.id}
              day={day}
              course={course}
              evalTick={evalTick}
              onSelectModule={(mod) => setSelected({ day, module: mod })}
              onOpenEval={(mod) => setEvalTarget({ day, module: mod })}
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
        />
      )}

      {evalDialog}
    </>
  );
}

function DayColumn({
  day,
  course,
  evalTick,
  onSelectModule,
  onOpenEval,
}: {
  day: CourseDay;
  course: Course;
  evalTick: number;
  onSelectModule: (mod: CourseModule) => void;
  onOpenEval: (mod: CourseModule) => void;
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
        {day.modules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-400">
            Ingen punkter denne dag
          </div>
        ) : (
          day.modules.map((mod) => (
            <ProgramModuleTile
              key={mod.id}
              module={mod}
              courseId={course.id}
              evalTick={evalTick}
              onOpen={() => onSelectModule(mod)}
              onOpenEval={() => onOpenEval(mod)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ProgramModuleTile({
  module: mod,
  courseId,
  evalTick,
  onOpen,
  onOpenEval,
}: {
  module: CourseModule;
  courseId: string;
  evalTick: number;
  onOpen: () => void;
  onOpenEval: () => void;
}) {
  const ansvarlig = moduleUnderviserLabel(mod);
  const hasEva = useMemo(
    () => hasKursuslederEvaluation("module", courseId, mod.id),
    [courseId, mod.id, evalTick],
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

  const badge = (() => {
    if (mod.erMaltid) {
      return (
        <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
          {mod.maltid?.forplejning || "Måltid"}
        </span>
      );
    }
    if (isWorkshopModule(mod)) {
      return (
        <span className="rounded bg-violet-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-900">
          Workshops
        </span>
      );
    }
    if (isHeldagsturModule(mod)) {
      return (
        <span className="rounded bg-blue-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-900">
          Heldagstur
        </span>
      );
    }
    return null;
  })();

  const title =
    mod.erMaltid && mod.maltid?.specifikation
      ? mod.maltid.specifikation
      : mod.overskrift || "Punkt uden titel";

  return (
    <div className={`overflow-hidden rounded-lg border ${tileClass}`}>
      <button
        type="button"
        onClick={onOpen}
        className="w-full px-3 py-2.5 text-left transition hover:bg-white/40"
      >
        {badge && <div className="mb-1.5">{badge}</div>}
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
          onClick={onOpenEval}
        >
          Eva
        </Button>
      </div>
    </div>
  );
}

export function KursuslederCourseEvalButton({
  course,
}: {
  course: Course;
}) {
  const [open, setOpen] = useState(false);
  const [evalTick, setEvalTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setEvalTick((t) => t + 1);
    }
    window.addEventListener(KURSUSLEDER_EVALUATION_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(KURSUSLEDER_EVALUATION_UPDATED_EVENT, refresh);
  }, []);

  const hasEval = useMemo(
    () => hasKursuslederEvaluation("course", course.id),
    [course.id, evalTick],
  );

  const existing = useMemo(
    () => findKursuslederEvaluation("course", course.id),
    [course.id, evalTick],
  );

  const moduleCount = course.days.reduce((sum, d) => sum + d.modules.length, 0);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className={cn("gap-2", hasEval && "ring-1 ring-emerald-400")}
        onClick={() => setOpen(true)}
      >
        <ClipboardList className="size-4" />
        Evaluering
      </Button>

      <PedelEvaluationDialog
        open={open}
        accent="blue"
        title={`Kursusevaluering — ${course.title}`}
        subtitle="Samlet evaluering af kurset"
        initialText={existing?.text ?? ""}
        contextLines={[
          `${getRealiseretAntal(course)} tilmeldte / ${getBudgetAntal(course)} budget`,
          `${course.days.length} dage · ${moduleCount} punkter`,
        ]}
        onClose={() => setOpen(false)}
        onSave={(text) => {
          saveKursuslederEvaluation({
            kind: "course",
            courseId: course.id,
            courseTitle: course.title,
            text,
            courseMeta: { id: course.id, weekNumber: course.weekNumber },
            enrolled: getRealiseretAntal(course),
            budgetStudents: getBudgetAntal(course),
          });
        }}
      />
    </>
  );
}
