"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KitchenEvaluationDialog } from "@/components/mockup/kitchen-evaluation-dialog";
import {
  forplejningTyper,
  type ForplejningType,
} from "@/lib/kitchen-options";
import type { KitchenWeekMealRow } from "@/lib/kitchen-utils";
import {
  groupMealsByForplejning,
  slotMatchesForplejning,
} from "@/lib/kitchen-week-calendar";
import {
  type KitchenDayMealPlan,
  type KitchenMealSlotPlan,
  type KitchenWeekMealPlan,
  updateKitchenWeekMealPlan,
} from "@/lib/kitchen-meal-plan-storage";
import {
  findEvaluation,
  hasEvaluation,
  KITCHEN_EVALUATION_UPDATED_EVENT,
  saveMealEvaluation,
} from "@/lib/kitchen-evaluation-storage";
import type { CourseListEntry } from "@/lib/course-list";
import { cn } from "@/lib/utils";

function newSlotId(): string {
  return `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function KitchenMealSlotEditor({
  slot,
  courseMeals,
  courses,
  year,
  weekNumber,
  date,
  dayName,
  weekStats,
  onChange,
  onRemove,
  canRemove,
}: {
  slot: KitchenMealSlotPlan;
  courseMeals: KitchenWeekMealRow[];
  courses: CourseListEntry[];
  year: number;
  weekNumber: number;
  date: string;
  dayName: string;
  weekStats: {
    budgetTotal: number;
    enrolledTotal: number;
    staffOnDuty: number;
    courseCount: number;
    mealCount: number;
  };
  onChange: (next: KitchenMealSlotPlan) => void;
  onRemove?: () => void;
  canRemove: boolean;
}) {
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalTick, setEvalTick] = useState(0);

  useEffect(() => {
    function refresh() {
      setEvalTick((t) => t + 1);
    }
    window.addEventListener(KITCHEN_EVALUATION_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(KITCHEN_EVALUATION_UPDATED_EVENT, refresh);
  }, []);

  const matchingMeals = courseMeals.filter((m) =>
    slotMatchesForplejning(slot.forplejning, m.forplejning),
  );

  const hasEva = useMemo(
    () => hasEvaluation("meal", year, weekNumber, date, slot.id),
    [year, weekNumber, date, slot.id, evalTick],
  );

  const existingEval = useMemo(
    () => findEvaluation("meal", year, weekNumber, date, slot.id),
    [year, weekNumber, date, slot.id, evalTick],
  );

  const courseTitles = new Map(courses.map((c) => [c.id, c.title]));

  function getOverride(courseId: string) {
    return slot.courseOverrides.find((o) => o.courseId === courseId);
  }

  function setHouseMenu(menuText: string) {
    onChange({ ...slot, menuText, appliesToAll: true });
  }

  function setCourseOverride(
    courseId: string,
    patch: Partial<{ menuText: string; note: string }>,
  ) {
    const title = courseTitles.get(courseId) ?? "Kursus";
    const existing = getOverride(courseId);
    const nextOverrides = existing
      ? slot.courseOverrides.map((o) =>
          o.courseId === courseId ? { ...o, ...patch } : o,
        )
      : [
          ...slot.courseOverrides,
          {
            courseId,
            courseTitle: title,
            menuText: patch.menuText ?? "",
            note: patch.note ?? "",
          },
        ];
    onChange({ ...slot, courseOverrides: nextOverrides, appliesToAll: false });
  }

  function clearCourseOverride(courseId: string) {
    onChange({
      ...slot,
      courseOverrides: slot.courseOverrides.filter((o) => o.courseId !== courseId),
      appliesToAll: slot.courseOverrides.length <= 1,
    });
  }

  return (
    <div className="rounded-lg border border-amber-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{slot.label}</p>
          <p className="text-xs text-slate-500">{slot.forplejning}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            className={cn(
              "h-7 px-2 text-xs",
              hasEva && "ring-1 ring-emerald-400",
            )}
            onClick={() => setEvalOpen(true)}
          >
            Eva
          </Button>
          {canRemove && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Fjern måltid"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      <KitchenEvaluationDialog
        open={evalOpen}
        title={`Eva — ${slot.label}`}
        subtitle={`${dayName} · ${date}`}
        initialText={existingEval?.text ?? ""}
        contextLines={[
          `${weekStats.enrolledTotal} tilmeldte / ${weekStats.budgetTotal} budget i ugen`,
          slot.menuText ? `Madplan: ${slot.menuText}` : "Ingen madplan udfyldt endnu",
          ...matchingMeals.map(
            (m) =>
              `${m.courseTitle}: ${m.antalPersoner} pers. · ${m.specifikation}`,
          ),
        ]}
        onClose={() => setEvalOpen(false)}
        onSave={(text) => {
          saveMealEvaluation({
            year,
            weekNumber,
            date,
            dayName,
            slot,
            text,
            courses,
            weekStats,
            matchingMeals,
          });
        }}
      />

      <label className="mt-3 block">
        <span className="text-xs font-medium text-slate-600">
          Madplan for hele huset
        </span>
        <textarea
          value={slot.menuText}
          onChange={(e) => setHouseMenu(e.target.value)}
          rows={2}
          placeholder="Fx rugbrød, ost, æg, frugt…"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      {slot.note !== undefined && (
        <label className="mt-2 block">
          <span className="text-xs font-medium text-slate-600">Note</span>
          <input
            type="text"
            value={slot.note}
            onChange={(e) => onChange({ ...slot, note: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      )}

      {matchingMeals.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Kurser med godkendt forplejning
          </p>
          {matchingMeals.map((meal) => {
            const override = getOverride(meal.courseId);
            const usesHouse = !override?.menuText;
            return (
              <div
                key={`${meal.courseId}-${meal.moduleId}`}
                className="rounded-lg bg-amber-50/60 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-amber-950">
                    {meal.courseTitle}
                  </p>
                  <span className="text-xs text-amber-800">
                    {meal.antalPersoner} pers. · {meal.specifikation}
                    {meal.lokale ? ` · ${meal.lokale}` : ""}
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-900/80">
                  Fra kursusplan: {meal.specifikation}
                  {meal.note ? ` — ${meal.note}` : ""}
                </p>
                <label className="mt-2 block">
                  <span className="text-xs text-slate-600">
                    {usesHouse
                      ? "Bruger hus-madplan (tilpas her for dette kursus)"
                      : "Egen madplan for kursus"}
                  </span>
                  <textarea
                    value={override?.menuText ?? ""}
                    onChange={(e) =>
                      setCourseOverride(meal.courseId, {
                        menuText: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder={
                      usesHouse && slot.menuText
                        ? `Som hus: ${slot.menuText}`
                        : "Særlig madplan for dette kursus…"
                    }
                    className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm"
                  />
                </label>
                {override && (
                  <button
                    type="button"
                    onClick={() => clearCourseOverride(meal.courseId)}
                    className="mt-1 text-xs text-amber-800 hover:underline"
                  >
                    Brug hus-madplan igen
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function KitchenDayMealPlanCard({
  dayPlan,
  weekMeals,
  courses,
  year,
  weekNumber,
  dayDefs,
  stats,
  weekStats,
  onPlanChange,
}: {
  dayPlan: KitchenDayMealPlan;
  weekMeals: KitchenWeekMealRow[];
  courses: CourseListEntry[];
  year: number;
  weekNumber: number;
  dayDefs: Array<{ date: string; dayName: string }>;
  stats: {
    budgetTotal: number;
    enrolledTotal: number;
    courseCount: number;
  };
  weekStats: {
    budgetTotal: number;
    enrolledTotal: number;
    staffOnDuty: number;
    courseCount: number;
    mealCount: number;
  };
  onPlanChange: (plan: KitchenWeekMealPlan) => void;
}) {
  const [addingSlot, setAddingSlot] = useState(false);
  const [newForplejning, setNewForplejning] =
    useState<ForplejningType>("Disp.1");

  const mealsByType = useMemo(
    () => groupMealsByForplejning(weekMeals, dayPlan.date),
    [weekMeals, dayPlan.date],
  );

  const flatMeals = useMemo(() => {
    const all: KitchenWeekMealRow[] = [];
    for (const list of mealsByType.values()) all.push(...list);
    return all;
  }, [mealsByType]);

  function updateDay(updater: (day: KitchenDayMealPlan) => KitchenDayMealPlan) {
    const next = updateKitchenWeekMealPlan(year, weekNumber, dayDefs, (plan) => ({
      ...plan,
      days: plan.days.map((d) =>
        d.date === dayPlan.date ? updater(d) : d,
      ),
    }));
    onPlanChange(next);
  }

  function updateSlot(slotId: string, nextSlot: KitchenMealSlotPlan) {
    updateDay((day) => ({
      ...day,
      slots: day.slots.map((s) => (s.id === slotId ? nextSlot : s)),
    }));
  }

  function removeSlot(slotId: string) {
    updateDay((day) => ({
      ...day,
      slots: day.slots.filter((s) => s.id !== slotId),
    }));
  }

  function addExtraSlot() {
    updateDay((day) => ({
      ...day,
      slots: [
        ...day.slots,
        {
          id: newSlotId(),
          forplejning: newForplejning,
          label: newForplejning,
          menuText: "",
          note: "",
          appliesToAll: true,
          courseOverrides: [],
        },
      ],
    }));
    setAddingSlot(false);
  }

  const defaultSlotIds = new Set([
    "morgenmad",
    "formiddag",
    "frokost",
    "eftermiddag",
    "aftensmad",
    "aften",
  ]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
        <CardTitle className="text-base text-amber-950">
          {dayPlan.dayName} ·{" "}
          {new Date(`${dayPlan.date}T12:00:00`).toLocaleDateString("da-DK", {
            day: "numeric",
            month: "long",
          })}
        </CardTitle>
        <CardDescription>
          Forventet {stats.budgetTotal} kursister (budget) · {stats.enrolledTotal}{" "}
          tilmeldte · {stats.courseCount} kursus
          {stats.courseCount !== 1 ? "er" : ""} med forplejning
        </CardDescription>
      </div>

      <div className="space-y-3 p-4">
        {dayPlan.slots.map((slot) => (
          <KitchenMealSlotEditor
            key={slot.id}
            slot={slot}
            courseMeals={flatMeals}
            courses={courses}
            year={year}
            weekNumber={weekNumber}
            date={dayPlan.date}
            dayName={dayPlan.dayName}
            weekStats={weekStats}
            canRemove={!defaultSlotIds.has(slot.id)}
            onChange={(next) => updateSlot(slot.id, next)}
            onRemove={() => removeSlot(slot.id)}
          />
        ))}

        {addingSlot ? (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 p-3">
            <label className="text-sm">
              <span className="text-xs font-medium text-slate-600">Type</span>
              <select
                value={newForplejning}
                onChange={(e) =>
                  setNewForplejning(e.target.value as ForplejningType)
                }
                className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              >
                {forplejningTyper.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" onClick={addExtraSlot} className="h-9">
              Tilføj
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAddingSlot(false)}
              className="h-9"
            >
              Annuller
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAddingSlot(true)}
            className="gap-2"
          >
            <Plus className="size-4" />
            Tilføj måltid
          </Button>
        )}
      </div>
    </Card>
  );
}

export function KitchenWeekStaffEditor({
  staffCount,
  defaultStaff,
  year,
  weekNumber,
  dayDefs,
  onPlanChange,
}: {
  staffCount: number;
  defaultStaff: number;
  year: number;
  weekNumber: number;
  dayDefs: Array<{ date: string; dayName: string }>;
  onPlanChange: (plan: KitchenWeekMealPlan) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <Users className="size-5 text-slate-500" aria-hidden />
      <label className="flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-700">Medarbejdere på arbejde</span>
        <input
          type="number"
          min={0}
          value={staffCount}
          onChange={(e) => {
            const val = Number(e.target.value);
            const next = updateKitchenWeekMealPlan(
              year,
              weekNumber,
              dayDefs,
              (plan) => ({
                ...plan,
                staffOnDuty: Number.isFinite(val) ? val : defaultStaff,
              }),
            );
            onPlanChange(next);
          }}
          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm font-semibold"
        />
      </label>
      <span className="text-xs text-slate-500">
        Forslag: {defaultStaff} (køkken + kursusledere i ugen)
      </span>
    </div>
  );
}
