"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Copy,
  Eye,
  Plus,
  Send,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  copyCoursesToYear,
  formatWeekRange,
  historySummary,
  suggestStudentCount,
  sumBudgetStudents,
} from "@/lib/arshjul-utils";
import {
  brandbjergAnnualTarget2026,
  brandbjergBudgetTotal2026,
  defaultAnnualPlans,
  type AnnualPlan,
  type BrandbjergPlannedCourse,
} from "@/lib/brandbjerg-arshjul";
import { planStatusLabels, type PlanStatus } from "@/lib/mock-data";

const WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);
const AVAILABLE_YEARS = [2026, 2025, 2024, 2023, 2022, 2021];

function weekLabel(week: number) {
  return `Uge ${week}`;
}

export function ArshjulPlanner() {
  const [plans, setPlans] = useState<AnnualPlan[]>(defaultAnnualPlans);
  const [activeYear, setActiveYear] = useState(2026);
  const [selectedWeek, setSelectedWeek] = useState(3);
  const [newTitle, setNewTitle] = useState("");
  const [newStudents, setNewStudents] = useState(20);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [newYearInput, setNewYearInput] = useState(
    String(Math.max(...plans.map((p) => p.year)) + 1),
  );

  const activePlan = plans.find((p) => p.year === activeYear);
  const isReadonly = activePlan?.readonly ?? false;
  const weekCourses = activePlan?.courses ?? [];
  const target = activePlan?.targetStudents ?? brandbjergAnnualTarget2026;
  const planStatus = activePlan?.planStatus ?? "udkast";

  const plannedTotal = useMemo(
    () => sumBudgetStudents(weekCourses),
    [weekCourses],
  );
  const progress =
    target > 0 ? Math.min(100, Math.round((plannedTotal / target) * 100)) : 0;
  const gap = target - plannedTotal;

  const weekItems = weekCourses.filter((c) => c.weekNumber === selectedWeek);
  const previousPlan = plans
    .filter((p) => p.year < activeYear)
    .sort((a, b) => b.year - a.year)[0];

  function updateActivePlan(updater: (plan: AnnualPlan) => AnnualPlan) {
    setPlans((prev) =>
      prev.map((p) => (p.year === activeYear ? updater(p) : p)),
    );
  }

  function setTarget(value: number) {
    updateActivePlan((p) => ({ ...p, targetStudents: value }));
  }

  function setPlanStatus(status: PlanStatus) {
    updateActivePlan((p) => ({ ...p, planStatus: status }));
  }

  function updateCourse(id: string, patch: Partial<BrandbjergPlannedCourse>) {
    updateActivePlan((p) => ({
      ...p,
      courses: p.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function addCourse() {
    if (!newTitle.trim() || isReadonly) return;
    const history =
      previousPlan?.courses.find(
        (c) =>
          c.title.toLowerCase().trim() === newTitle.toLowerCase().trim(),
      )?.history ?? {};
    const suggested = suggestStudentCount(history, activeYear, newStudents);

    updateActivePlan((p) => ({
      ...p,
      planStatus: "udkast",
      courses: [
        ...p.courses,
        {
          id: `bb${activeYear}-${Date.now()}`,
          weekNumber: selectedWeek,
          startDate: null,
          endDate: null,
          title: newTitle.trim(),
          responsible: "",
          daysPattern: "ma-fre",
          dayCount: 5,
          type: "",
          maxStudents: null,
          budgetStudents: suggested,
          notes: "",
          history,
        },
      ],
    }));
    setNewTitle("");
    setNewStudents(suggested);
  }

  function removeCourse(id: string) {
    if (isReadonly) return;
    updateActivePlan((p) => ({
      ...p,
      planStatus: "udkast",
      courses: p.courses.filter((c) => c.id !== id),
    }));
  }

  function createNewYearFromCopy() {
    const toYear = parseInt(newYearInput, 10);
    if (!toYear || plans.some((p) => p.year === toYear)) return;
    const source = previousPlan ?? plans.find((p) => p.year === 2026);
    if (!source) return;

    const copied = copyCoursesToYear(source.courses, source.year, toYear);
    setPlans((prev) => [
      ...prev,
      {
        year: toYear,
        targetStudents: brandbjergAnnualTarget2026,
        planStatus: "udkast",
        courses: copied,
      },
    ]);
    setActiveYear(toYear);
    setShowCopyDialog(false);
  }

  if (!activePlan) {
    return (
      <Card>
        <CardTitle>Vælg eller opret årshjul</CardTitle>
        <CardDescription>
          Der findes ingen plan for {activeYear}. Kopier fra et tidligere år for
          at starte.
        </CardDescription>
        <Button onClick={() => setShowCopyDialog(true)} className="mt-4">
          <Copy className="h-4 w-4" />
          Opret {activeYear} fra sidste år
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Årsvælger */}
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-emerald-700" />
            <div>
              <CardTitle>Årshjul {activeYear}</CardTitle>
              <CardDescription>
                Brandbjerg Højskole — korte kurser
                {isReadonly && " · Godkendt plan (skrivebeskyttet)"}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {AVAILABLE_YEARS.map((y) => {
              const exists = plans.some((p) => p.year === y);
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    if (exists) {
                      setActiveYear(y);
                    } else {
                      setNewYearInput(String(y));
                      setShowCopyDialog(true);
                    }
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    activeYear === y
                      ? "bg-emerald-700 text-white"
                      : exists
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "border border-dashed border-slate-300 bg-white text-slate-500 hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                  title={
                    exists
                      ? `Se årshjul ${y}`
                      : `Opret årshjul ${y} ved at kopiere fra sidste år`
                  }
                >
                  {y}
                  {!exists && " (+)"}
                </button>
              );
            })}
            <Button
              onClick={() => setShowCopyDialog(true)}
              variant="secondary"
              className="h-8 text-xs"
              disabled={isReadonly}
            >
              <Plus className="h-3.5 w-3.5" />
              Nyt år
            </Button>
          </div>
        </div>
      </Card>

      {showCopyDialog && (
        <Card className="border-blue-200 bg-blue-50">
          <CardTitle className="text-blue-900">Opret nyt årshjul</CardTitle>
          <CardDescription className="text-blue-800">
            Kopierer titler og ugestruktur fra{" "}
            {previousPlan?.year ?? 2026}. Datoer tilpasses automatisk til det nye
            år. Antal kursister foreslås ud fra historik (sidste 5 år — foregående
            år vægtes højest).
          </CardDescription>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-blue-900">Nyt år</label>
              <input
                type="number"
                value={newYearInput}
                onChange={(e) => setNewYearInput(e.target.value)}
                className="mt-1 block w-28 rounded-lg border border-blue-200 px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={createNewYearFromCopy}>
              <Copy className="h-4 w-4" />
              Kopier fra {previousPlan?.year ?? 2026}
            </Button>
            <Button
              onClick={() => setShowCopyDialog(false)}
              variant="ghost"
              className="text-blue-800"
            >
              Annuller
            </Button>
          </div>
        </Card>
      )}

      {/* Mål & progress */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Target className="h-5 w-5" />
              Mål: antal årskursister
            </CardTitle>
            <CardDescription className="text-emerald-800">
              {activeYear === 2026
                ? `Budget i statusark: ${brandbjergBudgetTotal2026} kursistpladser på tværs af kurser`
                : "Hele gruppen planlægger og følger løbende målet"}
            </CardDescription>
          </div>
          {!isReadonly && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-emerald-900">Mål</label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value) || 0)}
                className="w-28 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold"
              />
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-emerald-900">
              Planlagt: {plannedTotal} / {target}
            </span>
            <span className={gap >= 0 ? "text-emerald-700" : "text-amber-700"}>
              {gap >= 0 ? `${gap} mangler` : `${Math.abs(gap)} over mål`}
            </span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-emerald-700">
            {progress}% af målet · {weekCourses.length} kursuslinjer
          </p>
        </div>
      </Card>

      {/* Status & godkendelse */}
      {!isReadonly && (
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              planStatus === "godkendt"
                ? "bg-emerald-100 text-emerald-800"
                : planStatus === "afventer_godkendelse"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {planStatusLabels[planStatus]}
          </span>
          {planStatus === "udkast" && (
            <Button onClick={() => setPlanStatus("afventer_godkendelse")} variant="secondary">
              <Send className="h-4 w-4" />
              Send til godkendelse
            </Button>
          )}
          {planStatus === "afventer_godkendelse" && (
            <Button onClick={() => setPlanStatus("godkendt")}>
              <CheckCircle2 className="h-4 w-4" />
              Godkend årsplan
            </Button>
          )}
          {planStatus === "godkendt" && (
            <Button href="/planlaegning/statusark">
              Gå til statusark
            </Button>
          )}
        </div>
      )}

      {isReadonly && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
          <Eye className="h-4 w-4" />
          Viser godkendt plan fra jeres Statusark 2026 — {weekCourses.length}{" "}
          kurser importeret fra regneark
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardTitle>Vælg uge</CardTitle>
          <CardDescription>52 uger — flere kurser kan ligge sideløbende</CardDescription>
          <div className="mt-3 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-4 gap-1 sm:grid-cols-5">
              {WEEKS.map((week) => {
                const items = weekCourses.filter((c) => c.weekNumber === week);
                const students = sumBudgetStudents(items);
                return (
                  <button
                    key={week}
                    type="button"
                    onClick={() => setSelectedWeek(week)}
                    className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                      selectedWeek === week
                        ? "bg-emerald-700 text-white"
                        : items.length > 0
                          ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                    title={
                      items.length > 0
                        ? `${students} kursister budget`
                        : "Ingen kurser"
                    }
                  >
                    {week}
                    {items.length > 0 && (
                      <span className="mt-0.5 block text-[10px] opacity-80">
                        {items.length} k.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardTitle>{weekLabel(selectedWeek)} — kurser</CardTitle>
          <CardDescription>
            {isReadonly
              ? "Data fra Statusark 2026"
              : "Titler og budget-kursister — forslag baseret på historik"}
          </CardDescription>

          {!isReadonly && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                placeholder="Kursustitel (fx Et liv i balance)"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  const hist =
                    previousPlan?.courses.find(
                      (c) =>
                        c.title.toLowerCase().includes(
                          e.target.value.toLowerCase(),
                        ) && e.target.value.length > 3,
                    )?.history ?? {};
                  if (Object.keys(hist).length > 0) {
                    setNewStudents(suggestStudentCount(hist, activeYear));
                  }
                }}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={1}
                value={newStudents}
                onChange={(e) =>
                  setNewStudents(Number(e.target.value) || 1)
                }
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                title="Budget kursister"
              />
              <Button onClick={addCourse}>
                <Plus className="h-4 w-4" />
                Tilføj
              </Button>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {weekItems.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                Ingen kurser i {weekLabel(selectedWeek)}.
              </p>
            ) : (
              weekItems.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  planningYear={activeYear}
                  readonly={isReadonly}
                  onUpdate={(patch) => updateCourse(course.id, patch)}
                  onRemove={() => removeCourse(course.id)}
                />
              ))
            )}
          </div>

          {weekItems.length > 0 && (
            <p className="mt-3 text-sm font-medium text-slate-700">
              Uge-total: {sumBudgetStudents(weekItems)} kursister (budget)
            </p>
          )}
        </Card>
      </div>

      {/* Fuld oversigt */}
      <Card>
        <CardTitle>Årsoversigt {activeYear}</CardTitle>
        <CardDescription>
          Alle uger med kurser — ansvarlig, type og budget
        </CardDescription>
        <div className="mt-4 max-h-96 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Uge</th>
                <th className="px-3 py-2 font-medium">Dato</th>
                <th className="px-3 py-2 font-medium">Titel</th>
                <th className="px-3 py-2 font-medium">Ansv.</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Budget</th>
                <th className="px-3 py-2 font-medium">Historik (5 år)</th>
              </tr>
            </thead>
            <tbody>
              {WEEKS.filter((w) =>
                weekCourses.some((c) => c.weekNumber === w),
              ).flatMap((week) =>
                weekCourses
                  .filter((c) => c.weekNumber === week)
                  .map((c) => (
                    <tr key={c.id} className="border-b border-slate-50">
                      <td className="px-3 py-2 font-medium">{week}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                        {formatWeekRange(c.startDate, c.endDate)}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {c.title}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {c.responsible || "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {c.type || "—"}
                      </td>
                      <td className="px-3 py-2">{c.budgetStudents}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {historySummary(c.history, activeYear)}
                      </td>
                    </tr>
                  )),
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CourseRow({
  course,
  planningYear,
  readonly,
  onUpdate,
  onRemove,
}: {
  course: BrandbjergPlannedCourse;
  planningYear: number;
  readonly: boolean;
  onUpdate: (patch: Partial<BrandbjergPlannedCourse>) => void;
  onRemove: () => void;
}) {
  const suggested = suggestStudentCount(
    course.history,
    planningYear,
    course.budgetStudents,
  );
  const hasHistory = Object.keys(course.history).length > 0;

  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{course.title}</p>
          <p className="text-xs text-slate-500">
            {formatWeekRange(course.startDate, course.endDate)}
            {course.responsible && ` · ${course.responsible}`}
            {course.type && ` · ${course.type}`}
          </p>
          {hasHistory && (
            <p className="mt-1 text-xs text-slate-400">
              {historySummary(course.history, planningYear)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!readonly ? (
            <>
              <input
                type="number"
                value={course.budgetStudents}
                onChange={(e) =>
                  onUpdate({ budgetStudents: Number(e.target.value) || 0 })
                }
                className="w-16 rounded border border-slate-200 px-2 py-1 text-sm"
              />
              {hasHistory && suggested !== course.budgetStudents && (
                <button
                  type="button"
                  onClick={() => onUpdate({ budgetStudents: suggested })}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-800 hover:bg-purple-100"
                  title={`Forslag baseret på historik: ${suggested}`}
                >
                  <Sparkles className="h-3 w-3" />
                  {suggested}
                </button>
              )}
              <button
                type="button"
                onClick={onRemove}
                className="text-xs text-red-600 hover:underline"
              >
                Fjern
              </button>
            </>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-medium">
              {course.budgetStudents} kurs.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
