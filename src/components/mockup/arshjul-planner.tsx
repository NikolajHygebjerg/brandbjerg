"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Copy,
  Eye,
  FilePlus,
  Plus,
  Save,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  copyCoursesToYear,
  formatWeekRange,
  getWeekDates,
  historySummary,
  loadPlansFromStorage,
  loadActiveYearFromStorage,
  recalcEndDate,
  saveActiveYearToStorage,
  savePlansToStorage,
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
const BASE_YEARS = [2026, 2025, 2024, 2023, 2022, 2021];
const COURSE_TYPES = [
  "UL (åben)",
  "UL (lukket)",
  "UL",
  "HL",
  "0",
];

function weekLabel(week: number) {
  return `Uge ${week}`;
}

function inputClass(extra = "") {
  return `rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm ${extra}`;
}

function mergePlansWithDefaults(
  stored: AnnualPlan[],
  defaults: AnnualPlan[],
): AnnualPlan[] {
  const byYear = new Map<number, AnnualPlan>();
  for (const d of defaults) byYear.set(d.year, d);
  for (const s of stored) byYear.set(s.year, s);
  return Array.from(byYear.values()).sort((a, b) => b.year - a.year);
}

export function ArshjulPlanner() {
  const [plans, setPlans] = useState<AnnualPlan[]>(defaultAnnualPlans);
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(2026);
  const [selectedWeek, setSelectedWeek] = useState(3);
  const [newTitle, setNewTitle] = useState("");
  const [newStudents, setNewStudents] = useState(20);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [newYearInput, setNewYearInput] = useState("2027");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [yearError, setYearError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadPlansFromStorage();
    const merged = stored?.length
      ? mergePlansWithDefaults(stored, defaultAnnualPlans)
      : defaultAnnualPlans;
    setPlans(merged);

    const savedYear = loadActiveYearFromStorage();
    if (savedYear && merged.some((p) => p.year === savedYear)) {
      setActiveYear(savedYear);
    }
    setHydrated(true);
  }, []);

  const displayYears = useMemo(() => {
    const years = new Set<number>([
      ...BASE_YEARS,
      ...plans.map((p) => p.year),
    ]);
    const maxExisting = Math.max(...plans.map((p) => p.year), 2026);
    years.add(maxExisting + 1);
    return Array.from(years).sort((a, b) => b - a);
  }, [plans]);

  function selectYear(y: number) {
    setActiveYear(y);
    saveActiveYearToStorage(y);
  }

  const activePlan = plans.find((p) => p.year === activeYear);
  const isEditable = activePlan != null && activePlan.planStatus !== "godkendt";
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

  function persistPlans(next: AnnualPlan[], message: string) {
    setPlans(next);
    savePlansToStorage(next);
    saveActiveYearToStorage(activeYear);
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(null), 4000);
  }

  function saveDraft() {
    if (!activePlan) return;
    setPlans((prev) => {
      const next = prev.map((p) =>
        p.year === activeYear
          ? { ...p, planStatus: "udkast" as PlanStatus, readonly: false }
          : p,
      );
      savePlansToStorage(next);
      saveActiveYearToStorage(activeYear);
      const saved = next.find((p) => p.year === activeYear);
      setSaveMessage(
        `Kladde gemt for ${activeYear} (mål: ${saved?.targetStudents ?? 0}, ${saved?.courses.length ?? 0} kurser)`,
      );
      setTimeout(() => setSaveMessage(null), 4000);
      return next;
    });
  }

  function updateActivePlan(updater: (plan: AnnualPlan) => AnnualPlan) {
    setPlans((prev) =>
      prev.map((p) => (p.year === activeYear ? updater(p) : p)),
    );
  }

  function saveApproved() {
    if (!activePlan) return;
    const next = plans.map((p) =>
      p.year === activeYear
        ? { ...p, planStatus: "godkendt" as PlanStatus, readonly: true }
        : p,
    );
    persistPlans(
      next,
      `${activeYear} godkendt — planen er låst og klar til statusark`,
    );
  }

  function setTarget(value: number) {
    updateActivePlan((p) => ({ ...p, targetStudents: value }));
  }

  function updateCourse(id: string, patch: Partial<BrandbjergPlannedCourse>) {
    updateActivePlan((p) => ({
      ...p,
      courses: p.courses.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...patch };
        if (patch.startDate !== undefined || patch.dayCount !== undefined) {
          updated.endDate = recalcEndDate(
            updated.startDate,
            updated.dayCount ?? 5,
          );
        }
        if (patch.weekNumber !== undefined && patch.weekNumber !== c.weekNumber) {
          const dates = getWeekDates(
            activeYear,
            patch.weekNumber,
            updated.dayCount ?? 5,
          );
          updated.startDate = dates.startDate;
          updated.endDate = dates.endDate;
        }
        return updated;
      }),
    }));
  }

  function addCourse() {
    if (!newTitle.trim() || !isEditable) return;
    const history =
      previousPlan?.courses.find(
        (c) =>
          c.title.toLowerCase().trim() === newTitle.toLowerCase().trim(),
      )?.history ?? {};
    const suggested = suggestStudentCount(history, activeYear, newStudents);
    const dates = getWeekDates(activeYear, selectedWeek, 5);

    updateActivePlan((p) => ({
      ...p,
      courses: [
        ...p.courses,
        {
          id: `bb${activeYear}-${Date.now()}`,
          weekNumber: selectedWeek,
          startDate: dates.startDate,
          endDate: dates.endDate,
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
    if (!isEditable) return;
    updateActivePlan((p) => ({
      ...p,
      courses: p.courses.filter((c) => c.id !== id),
    }));
  }

  const targetYear = parseInt(newYearInput, 10);
  const copySourcePlan =
    plans
      .filter((p) => !targetYear || p.year < targetYear)
      .sort((a, b) => b.year - a.year)[0] ??
    plans.sort((a, b) => b.year - a.year)[0];

  function openNewYearDialog(presetYear?: number) {
    const nextYear =
      presetYear ?? Math.max(...plans.map((p) => p.year)) + 1;
    setNewYearInput(String(nextYear));
    setYearError(null);
    setShowCopyDialog(true);
  }

  function createNewYear(mode: "copy" | "blank") {
    const toYear = parseInt(newYearInput, 10);
    if (!toYear) {
      setYearError("Angiv et gyldigt årstal");
      return;
    }
    if (plans.some((p) => p.year === toYear)) {
      setYearError(`${toYear} findes allerede — vælg det i årslisten ovenfor`);
      selectYear(toYear);
      setShowCopyDialog(false);
      return;
    }
    setYearError(null);

    let courses: BrandbjergPlannedCourse[] = [];
    if (mode === "copy") {
      const source =
        plans.filter((p) => p.year < toYear).sort((a, b) => b.year - a.year)[0] ??
        plans.sort((a, b) => b.year - a.year)[0];
      if (!source) return;
      courses = copyCoursesToYear(source.courses, source.year, toYear);
    }

    const next = [
      ...plans,
      {
        year: toYear,
        targetStudents: brandbjergAnnualTarget2026,
        planStatus: "udkast" as PlanStatus,
        courses,
      },
    ];
    persistPlans(
      next,
      mode === "copy"
        ? `${toYear} oprettet med kurser kopieret fra tidligere år`
        : `${toYear} oprettet som tomt udkast`,
    );
    setActiveYear(toYear);
    saveActiveYearToStorage(toYear);
    setShowCopyDialog(false);
  }

  function createNewYearFromCopy() {
    createNewYear("copy");
  }

  function createNewYearBlank() {
    createNewYear("blank");
  }

  if (!hydrated) {
    return (
      <Card>
        <CardDescription>Indlæser årshjul…</CardDescription>
      </Card>
    );
  }

  if (!activePlan) {
    return (
      <div className="space-y-4">
        <Card>
          <CardTitle>Vælg eller opret årshjul</CardTitle>
          <CardDescription>
            Der findes ingen plan for {activeYear}. Kopier fra et tidligere år
            eller start med et tomt årshjul.
          </CardDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => openNewYearDialog(activeYear)}>
              <Copy className="h-4 w-4" />
              Opret {activeYear}
            </Button>
          </div>
        </Card>
        {showCopyDialog && (
          <NewYearDialog
            newYearInput={newYearInput}
            setNewYearInput={setNewYearInput}
            copySourceYear={copySourcePlan?.year ?? 2026}
            yearError={yearError}
            onCopy={createNewYearFromCopy}
            onBlank={createNewYearBlank}
            onCancel={() => {
              setShowCopyDialog(false);
              setYearError(null);
            }}
          />
        )}
      </div>
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
                {!isEditable && " · Godkendt plan (skrivebeskyttet)"}
                {isEditable && " · Redigerbar kladde"}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {displayYears.map((y) => {
              const plan = plans.find((p) => p.year === y);
              const exists = Boolean(plan);
              const isDraft = exists && plan!.planStatus !== "godkendt";
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    if (exists) selectYear(y);
                    else openNewYearDialog(y);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    activeYear === y
                      ? "bg-emerald-700 text-white"
                      : exists
                        ? isDraft
                          ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "border border-dashed border-slate-300 bg-white text-slate-500 hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                  title={
                    exists
                      ? isDraft
                        ? `${y} — kladde`
                        : `${y} — godkendt`
                      : `Opret årshjul ${y}`
                  }
                >
                  {y}
                  {!exists && " (+)"}
                  {isDraft && activeYear !== y && " ·"}
                </button>
              );
            })}
            <Button
              onClick={() => openNewYearDialog()}
              variant="secondary"
              className="h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Nyt år
            </Button>
          </div>
        </div>
      </Card>

      {showCopyDialog && (
        <NewYearDialog
          newYearInput={newYearInput}
          setNewYearInput={setNewYearInput}
          copySourceYear={copySourcePlan?.year ?? 2026}
          yearError={yearError}
          onCopy={createNewYearFromCopy}
          onBlank={createNewYearBlank}
          onCancel={() => {
            setShowCopyDialog(false);
            setYearError(null);
          }}
        />
      )}

      {/* Gem kladde / Godkend */}
      {isEditable && (
        <Card className="border-slate-200 bg-slate-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Gem dine rettelser
              </p>
              <p className="text-xs text-slate-500">
                Rediger titel, dato, ansvarlig, type, budget og mål — gem som
                kladde eller godkend hele planen.
              </p>
              {saveMessage && (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  {saveMessage}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveDraft} variant="secondary">
                <Save className="h-4 w-4" />
                Gem kladde
              </Button>
              <Button onClick={saveApproved}>
                <CheckCircle2 className="h-4 w-4" />
                Godkend
              </Button>
            </div>
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
              {activeYear === 2026 && !isEditable
                ? `Budget i statusark: ${brandbjergBudgetTotal2026} kursistpladser`
                : "Hele gruppen planlægger og følger løbende målet"}
            </CardDescription>
          </div>
          {isEditable ? (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-emerald-900">Mål</label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value) || 0)}
                className="w-28 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold"
              />
            </div>
          ) : (
            <span className="text-2xl font-bold text-emerald-900">{target}</span>
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
        </div>
      </Card>

      {/* Status */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            planStatus === "godkendt"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {planStatusLabels[planStatus === "godkendt" ? "godkendt" : "udkast"]}
        </span>
        {planStatus === "godkendt" && (
          <>
            <Button href="/planlaegning/statusark">Gå til statusark</Button>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Eye className="h-3.5 w-3.5" />
              Planen er låst — opret nyt år for at planlægge fremad
            </span>
          </>
        )}
      </div>

      {/* Årsoversigt — øverst */}
      <Card>
        <CardTitle>Årsoversigt {activeYear}</CardTitle>
        <CardDescription>
          Samlet oversigt — rediger direkte i tabellen eller uge for uge nedenfor
        </CardDescription>
        <div className="mt-4 max-h-96 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Uge</th>
                <th className="px-3 py-2 font-medium">Start</th>
                <th className="px-3 py-2 font-medium">Slut</th>
                <th className="px-3 py-2 font-medium">Titel</th>
                <th className="px-3 py-2 font-medium">Ansv.</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Budget</th>
              </tr>
            </thead>
            <tbody>
              {WEEKS.filter((w) =>
                weekCourses.some((c) => c.weekNumber === w),
              ).flatMap((week) =>
                weekCourses
                  .filter((c) => c.weekNumber === week)
                  .map((c) => (
                    <OverviewRow
                      key={c.id}
                      course={c}
                      planningYear={activeYear}
                      editable={isEditable}
                      onUpdate={(patch) => updateCourse(c.id, patch)}
                    />
                  )),
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardTitle>Vælg uge</CardTitle>
          <CardDescription>52 uger — flere kurser kan ligge sideløbende</CardDescription>
          <div className="mt-3 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-4 gap-1 sm:grid-cols-5">
              {WEEKS.map((week) => {
                const items = weekCourses.filter((c) => c.weekNumber === week);
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
            {isEditable
              ? "Rediger alle felter — husk at gemme kladde eller godkende"
              : "Godkendt plan — skrivebeskyttet"}
          </CardDescription>

          {isEditable && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                placeholder="Ny kursustitel"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className={`flex-1 ${inputClass()}`}
              />
              <input
                type="number"
                min={1}
                value={newStudents}
                onChange={(e) =>
                  setNewStudents(Number(e.target.value) || 1)
                }
                className={`w-20 ${inputClass()}`}
                title="Budget kursister"
              />
              <Button onClick={addCourse}>
                <Plus className="h-4 w-4" />
                Tilføj
              </Button>
            </div>
          )}

          <div className="mt-4 space-y-3">
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
                  editable={isEditable}
                  onUpdate={(patch) => updateCourse(course.id, patch)}
                  onRemove={() => removeCourse(course.id)}
                />
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function NewYearDialog({
  newYearInput,
  setNewYearInput,
  copySourceYear,
  yearError,
  onCopy,
  onBlank,
  onCancel,
}: {
  newYearInput: string;
  setNewYearInput: (v: string) => void;
  copySourceYear: number;
  yearError: string | null;
  onCopy: () => void;
  onBlank: () => void;
  onCancel: () => void;
}) {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardTitle className="text-blue-900">Opret nyt årshjul</CardTitle>
      <CardDescription className="text-blue-800">
        Vælg år og om du vil kopiere kurser fra et tidligere år, eller starte
        helt forfra med et tomt årshjul.
      </CardDescription>
      {yearError && (
        <p className="mt-2 text-sm font-medium text-amber-800">{yearError}</p>
      )}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-blue-900">Nyt år</label>
          <input
            type="number"
            value={newYearInput}
            onChange={(e) => setNewYearInput(e.target.value)}
            className="mt-1 block w-28 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button onClick={onCopy} variant="secondary" className="justify-start">
          <Copy className="h-4 w-4" />
          Kopier fra {copySourceYear}
        </Button>
        <Button onClick={onBlank} variant="secondary" className="justify-start">
          <FilePlus className="h-4 w-4" />
          Start tomt årshjul
        </Button>
        <Button onClick={onCancel} variant="ghost" className="text-blue-800">
          Annuller
        </Button>
      </div>
    </Card>
  );
}

function CourseRow({
  course,
  planningYear,
  editable,
  onUpdate,
  onRemove,
}: {
  course: BrandbjergPlannedCourse;
  planningYear: number;
  editable: boolean;
  onUpdate: (patch: Partial<BrandbjergPlannedCourse>) => void;
  onRemove: () => void;
}) {
  const suggested = suggestStudentCount(
    course.history,
    planningYear,
    course.budgetStudents,
  );
  const hasHistory = Object.keys(course.history).length > 0;

  if (!editable) {
    return (
      <div className="rounded-lg border border-slate-100 p-3">
        <p className="font-medium text-slate-900">{course.title}</p>
        <p className="text-xs text-slate-500">
          {formatWeekRange(course.startDate, course.endDate)}
          {course.responsible && ` · ${course.responsible}`}
          {course.type && ` · ${course.type}`}
          {` · ${course.budgetStudents} kurs.`}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-slate-500">Titel</span>
          <input
            type="text"
            value={course.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className={`mt-0.5 block w-full ${inputClass()}`}
          />
        </label>
        <label>
          <span className="text-xs font-medium text-slate-500">Startdato</span>
          <input
            type="date"
            value={course.startDate ?? ""}
            onChange={(e) =>
              onUpdate({ startDate: e.target.value || null })
            }
            className={`mt-0.5 block w-full ${inputClass()}`}
          />
        </label>
        <label>
          <span className="text-xs font-medium text-slate-500">Slutdato</span>
          <input
            type="date"
            value={course.endDate ?? ""}
            onChange={(e) => onUpdate({ endDate: e.target.value || null })}
            className={`mt-0.5 block w-full ${inputClass()}`}
          />
        </label>
        <label>
          <span className="text-xs font-medium text-slate-500">Ansvarlig</span>
          <input
            type="text"
            value={course.responsible}
            onChange={(e) => onUpdate({ responsible: e.target.value })}
            placeholder="fx CZ, MLL, AG"
            className={`mt-0.5 block w-full ${inputClass()}`}
          />
        </label>
        <label>
          <span className="text-xs font-medium text-slate-500">Type</span>
          <input
            type="text"
            list="course-types"
            value={course.type}
            onChange={(e) => onUpdate({ type: e.target.value })}
            placeholder="fx UL (åben), HL"
            className={`mt-0.5 block w-full ${inputClass()}`}
          />
          <datalist id="course-types">
            {COURSE_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <label>
          <span className="text-xs font-medium text-slate-500">Kursusuge</span>
          <select
            value={course.weekNumber}
            onChange={(e) =>
              onUpdate({ weekNumber: Number(e.target.value) })
            }
            className={`mt-0.5 block w-full ${inputClass()}`}
          >
            {WEEKS.map((w) => (
              <option key={w} value={w}>
                Uge {w}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-xs font-medium text-slate-500">
            Budget kursister
          </span>
          <div className="mt-0.5 flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={course.budgetStudents}
              onChange={(e) =>
                onUpdate({ budgetStudents: Number(e.target.value) || 0 })
              }
              className={`w-full ${inputClass()}`}
            />
            {hasHistory && suggested !== course.budgetStudents && (
              <button
                type="button"
                onClick={() => onUpdate({ budgetStudents: suggested })}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-800 hover:bg-purple-100"
                title={`Forslag: ${suggested}`}
              >
                <Sparkles className="h-3 w-3" />
                {suggested}
              </button>
            )}
          </div>
        </label>
      </div>
      {hasHistory && (
        <p className="mt-2 text-xs text-slate-400">
          {historySummary(course.history, planningYear)}
        </p>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="mt-3 text-xs text-red-600 hover:underline"
      >
        Fjern kursus
      </button>
    </div>
  );
}

function OverviewRow({
  course,
  planningYear,
  editable,
  onUpdate,
}: {
  course: BrandbjergPlannedCourse;
  planningYear: number;
  editable: boolean;
  onUpdate: (patch: Partial<BrandbjergPlannedCourse>) => void;
}) {
  if (!editable) {
    return (
      <tr className="border-b border-slate-50">
        <td className="px-3 py-2">{course.weekNumber}</td>
        <td className="px-3 py-2 text-xs">{course.startDate ?? "—"}</td>
        <td className="px-3 py-2 text-xs">{course.endDate ?? "—"}</td>
        <td className="px-3 py-2 font-medium">{course.title}</td>
        <td className="px-3 py-2">{course.responsible || "—"}</td>
        <td className="px-3 py-2 text-xs">{course.type || "—"}</td>
        <td className="px-3 py-2">{course.budgetStudents}</td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-50 bg-white">
      <td className="px-2 py-1">
        <select
          value={course.weekNumber}
          onChange={(e) => onUpdate({ weekNumber: Number(e.target.value) })}
          className={inputClass("w-16 text-xs")}
        >
          {WEEKS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1">
        <input
          type="date"
          value={course.startDate ?? ""}
          onChange={(e) => onUpdate({ startDate: e.target.value || null })}
          className={inputClass("text-xs")}
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="date"
          value={course.endDate ?? ""}
          onChange={(e) => onUpdate({ endDate: e.target.value || null })}
          className={inputClass("text-xs")}
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="text"
          value={course.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className={inputClass("min-w-[8rem] text-xs")}
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="text"
          value={course.responsible}
          onChange={(e) => onUpdate({ responsible: e.target.value })}
          className={inputClass("w-16 text-xs")}
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="text"
          value={course.type}
          onChange={(e) => onUpdate({ type: e.target.value })}
          className={inputClass("w-24 text-xs")}
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="number"
          min={0}
          value={course.budgetStudents}
          onChange={(e) =>
            onUpdate({ budgetStudents: Number(e.target.value) || 0 })
          }
          className={inputClass("w-16 text-xs")}
        />
      </td>
    </tr>
  );
}
