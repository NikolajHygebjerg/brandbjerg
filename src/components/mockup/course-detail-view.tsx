"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, LayoutTemplate, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import {
  CourseBudgetPanel,
  defaultBudgetManualLines,
} from "@/components/mockup/course-budget-panel";
import { ModuleEditDialog } from "@/components/mockup/module-edit-dialog";
import {
  ModulePlanBoard,
  type EditingModule,
} from "@/components/mockup/module-plan-board";
import { useCourseDetailSession } from "@/context/course-detail-session";
import {
  createEmptyModule,
  formatDate,
  formatDKK,
  getIncompleteModules,
  moduleLibrary,
  type Course,
  type CourseChecklist,
  type CourseDay,
  type CourseModule,
} from "@/lib/mock-data";
import {
  buildDaysFromTemplate,
  buildEmptyDays,
  computeProgramTotals,
  countInclusiveDays,
  minToHours,
  moveModuleInPlan,
} from "@/lib/module-plan-utils";
import {
  programUbak5Dage,
} from "@/lib/program-templates/liv-i-haven-5dage";
import {
  getTemplateForDayCount,
} from "@/lib/template-storage";
import {
  getPersonById,
  listCourseLeaderCandidates,
  listStaffUsers,
  resolvePersonId,
} from "@/lib/person-utils";
import { AUTH_UPDATED_EVENT } from "@/lib/auth-storage";
import type { User } from "@/lib/auth-types";
import {
  createPlanSnapshot,
  formatPlanSavedAt,
  loadCoursePlan,
  saveCoursePlan,
  type ProgramSaveStatus,
} from "@/lib/course-plan-storage";
import type { BudgetManualLines, CourseBudgetInput } from "@/lib/budget/budget-types";
import {
  buildKitchenPlanSummary,
} from "@/lib/kitchen-utils";
import { canSendKitchenPlan, validateKitchenPlan } from "@/lib/kitchen-plan-rules";
import {
  revokeKitchenPlan,
  sendKitchenPlan,
} from "@/lib/kitchen-storage";
import { KitchenPlanWarnings } from "@/components/mockup/kitchen-plan-warnings";
import { CourseLokaleSpecPanel } from "@/components/mockup/course-lokale-spec-panel";
import {
  getBudgetAntal,
  getRealiseretAntal,
} from "@/lib/course-enrollment-counts";

type Tab = "oversigt" | "modulplan" | "tilmeldinger";

export function CourseDetailView({ course: initial }: { course: Course }) {
  const [course, setCourse] = useState(initial);
  const [tab, setTab] = useState<Tab>("oversigt");
  const [editingModule, setEditingModule] = useState<EditingModule>(null);
  const [lastActiveDayId, setLastActiveDayId] = useState(
    initial.days[0]?.id ?? "",
  );
  const [mockAccountantView, setMockAccountantView] = useState(false);
  const [planStatus, setPlanStatus] = useState<ProgramSaveStatus>("kladde");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [budgetManual, setBudgetManual] = useState<BudgetManualLines>(
    defaultBudgetManualLines,
  );
  const [budgetInputOverrides, setBudgetInputOverrides] = useState<
    Partial<CourseBudgetInput>
  >({});
  const hydratedRef = useRef(false);
  const { registerSession } = useCourseDetailSession();
  const [courseLeaders, setCourseLeaders] = useState<User[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);

  const leader = getPersonById(course.courseLeaderId);
  const hosts = course.hostIds
    .map((id) => getPersonById(id))
    .filter(Boolean);

  useEffect(() => {
    function refreshPeople() {
      setCourseLeaders(listCourseLeaderCandidates());
      setStaffUsers(listStaffUsers());
    }
    refreshPeople();
    window.addEventListener(AUTH_UPDATED_EVENT, refreshPeople);
    return () => window.removeEventListener(AUTH_UPDATED_EVENT, refreshPeople);
  }, []);
  const dayCount = countInclusiveDays(course.startDate, course.endDate);
  const templateForCourse = getTemplateForDayCount(dayCount);

  useEffect(() => {
    const stored = loadCoursePlan(initial.id);
    if (stored) {
      setCourse((prev) => ({
        ...prev,
        days: stored.days.length > 0 ? stored.days : prev.days,
        modulePlanMode: stored.modulePlanMode ?? prev.modulePlanMode,
        moduleTemplateName: stored.moduleTemplateName ?? prev.moduleTemplateName,
        checklist: stored.checklist ?? prev.checklist,
        courseLokaleSpec: stored.courseLokaleSpec ?? prev.courseLokaleSpec,
        pedelGenerelleNoter: stored.pedelGenerelleNoter ?? prev.pedelGenerelleNoter,
        kursetsHovedsigte: stored.kursetsHovedsigte ?? prev.kursetsHovedsigte,
      }));
      if (stored.days.length > 0) {
        setLastActiveDayId(stored.days[0]?.id ?? "");
      }
      if (stored.budgetManual) setBudgetManual(stored.budgetManual);
      if (stored.budgetInput) setBudgetInputOverrides(stored.budgetInput);
      setPlanStatus(stored.programStatus);
      setLastSavedAt(stored.updatedAt);
    }
    hydratedRef.current = true;
  }, [initial.id]);

  const persistPlan = useCallback(
    (
      options: {
        status?: ProgramSaveStatus;
        markProgramDone?: boolean;
        silent?: boolean;
      } = {},
    ) => {
      if (!hydratedRef.current) return null;

      const status =
        options.status ??
        (options.markProgramDone ? "faerdig" : planStatus);
      const snapshot = createPlanSnapshot(
        {
          ...course,
          budgetManual,
          budgetInput: budgetInputOverrides,
        },
        status,
        options.markProgramDone ? { programPlanned: true } : undefined,
      );
      const saved = saveCoursePlan(course.id, snapshot);

      setPlanStatus(saved.programStatus);
      setLastSavedAt(saved.updatedAt);

      if (options.markProgramDone) {
        setCourse((prev) => ({
          ...prev,
          checklist: { ...prev.checklist, programPlanned: true },
        }));
      }

      if (!options.silent) {
        setSaveNotice(
          saved.programStatus === "faerdig"
            ? "Program gemt som færdigt"
            : "Kladde gemt",
        );
        window.setTimeout(() => setSaveNotice(null), 3000);
      }

      return saved;
    },
    [course, planStatus, budgetManual, budgetInputOverrides],
  );

  useEffect(() => {
    if (!hydratedRef.current) return;
    persistPlan({ silent: true });
  }, [
    course.days,
    course.price,
    course.capacity,
    course.enrolled,
    course.startDate,
    course.endDate,
    course.modulePlanMode,
    course.moduleTemplateName,
    course.checklist,
    course.courseLokaleSpec,
    course.pedelGenerelleNoter,
    course.kursetsHovedsigte,
    budgetManual,
    budgetInputOverrides,
    persistPlan,
  ]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const onBeforeUnload = () => {
      persistPlan({ silent: true });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      persistPlan({ silent: true });
    };
  }, [persistPlan]);

  function handleSaveDraft() {
    persistPlan({ status: "kladde" });
  }

  function handleProgramFinished() {
    persistPlan({ status: "faerdig", markProgramDone: true });
  }

  function updateCourse(patch: Partial<Course>) {
    setCourse((prev) => ({ ...prev, ...patch }));
  }

  function updateChecklist(patch: Partial<CourseChecklist>) {
    setCourse((prev) => ({
      ...prev,
      checklist: { ...prev.checklist, ...patch },
    }));
  }

  useEffect(() => {
    if (!hydratedRef.current) return;

    const canSend = canSendKitchenPlan(course);
    const alreadySent = course.checklist.kitchenPlanSent;

    if (canSend && !alreadySent) {
      const summary = buildKitchenPlanSummary(course);
      sendKitchenPlan(course);
      updateChecklist({
        kitchenPlanSent: true,
        kitchenPlan: summary,
      });
      return;
    }

    if (!canSend && alreadySent) {
      revokeKitchenPlan(course.id);
      updateChecklist({ kitchenPlanSent: false });
    }
  }, [course.days, course.checklist.kitchenPlanSent, course.id]);

  function markProgramDone() {
    handleProgramFinished();
  }

  useEffect(() => {
    registerSession({
      course,
      updateChecklist,
      onMarkProgramDone: markProgramDone,
      onGoToModulplan: () => setTab("modulplan"),
      mockAccountantView,
      setMockAccountantView,
    });

    return () => registerSession(null);
  }, [course, mockAccountantView, registerSession]);

  function updateDay(dayId: string, updater: (day: CourseDay) => CourseDay) {
    setCourse((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.id === dayId ? updater(d) : d)),
    }));
  }

  function addModuleFromLibrary(dayId: string, libId: string) {
    const lib = moduleLibrary.find((m) => m.id === libId);
    if (!lib) return;
    const mod: CourseModule = {
      ...createEmptyModule(),
      source: "liste",
      overskrift: lib.title,
      broedtekst: `${lib.title} — modul fra bibliotek.`,
      tidFra: "13:00",
      tidTil: "14:30",
      timing: { ubak: 45, ft: 30, pts: 0, bh: 0 },
      rolle: "Kursusleder",
    };
    updateDay(dayId, (day) => ({
      ...day,
      modules: [...day.modules, mod],
    }));
    setLastActiveDayId(dayId);
    setEditingModule({ dayId, moduleId: mod.id });
  }

  function addManualModule(dayId: string) {
    const mod = createEmptyModule();
    updateDay(dayId, (day) => ({
      ...day,
      modules: [...day.modules, mod],
    }));
    setLastActiveDayId(dayId);
    setEditingModule({ dayId, moduleId: mod.id });
  }

  function removeModule(dayId: string, moduleId: string) {
    updateDay(dayId, (day) => ({
      ...day,
      modules: day.modules.filter((m) => m.id !== moduleId),
    }));
    if (
      editingModule?.dayId === dayId &&
      editingModule.moduleId === moduleId
    ) {
      setEditingModule(null);
    }
  }

  function updateModule(
    dayId: string,
    moduleId: string,
    patch: Partial<CourseModule>,
  ) {
    updateDay(dayId, (day) => ({
      ...day,
      modules: day.modules.map((m) =>
        m.id === moduleId ? { ...m, ...patch } : m,
      ),
    }));
  }

  function toggleHeldagsturPunkt(
    dayId: string,
    moduleId: string,
    punktId: string,
    klar: boolean,
  ) {
    updateDay(dayId, (day) => ({
      ...day,
      modules: day.modules.map((m) => {
        if (m.id !== moduleId || !m.heldagstur) return m;
        return {
          ...m,
          heldagstur: {
            punkter: m.heldagstur.punkter.map((p) =>
              p.id === punktId ? { ...p, klar } : p,
            ),
          },
        };
      }),
    }));
  }

  function moveModule(
    fromDayId: string,
    moduleId: string,
    toDayId: string,
    toIndex: number,
  ) {
    setCourse((prev) => ({
      ...prev,
      days: moveModuleInPlan(prev.days, fromDayId, moduleId, toDayId, toIndex),
    }));
    setLastActiveDayId(toDayId);
    if (editingModule?.moduleId === moduleId) {
      setEditingModule({ dayId: toDayId, moduleId });
    }
  }

  function initializeModulplan(mode: "skabelon" | "bunden") {
    if (!course.startDate || dayCount <= 0) return;

    const days =
      mode === "skabelon" && templateForCourse
        ? buildDaysFromTemplate(templateForCourse, course.startDate).map(
            (day, i) => ({
              ...day,
              id: `${course.id}-d${i + 1}`,
            }),
          )
        : buildEmptyDays(course.startDate, dayCount).map((day, i) => ({
            ...day,
            id: `${course.id}-d${i + 1}`,
          }));

    updateCourse({
      days,
      modulePlanMode: mode,
      moduleTemplateName:
        mode === "skabelon" && templateForCourse
          ? `${templateForCourse.sheetName} (${templateForCourse.sourceFile})`
          : undefined,
    });
    setLastActiveDayId(days[0]?.id ?? "");
    setEditingModule(null);
  }

  function reloadFromTemplate() {
    if (!templateForCourse || !course.startDate) return;
    if (
      !window.confirm(
        "Dette erstatter alle moduler med skabelonens indhold. Fortsæt?",
      )
    ) {
      return;
    }
    initializeModulplan("skabelon");
  }

  const programTotals =
    course.days.length > 0 ? computeProgramTotals(course.days) : null;

  const incompleteCount = getIncompleteModules(course).length;
  const kitchenValidation = validateKitchenPlan(course);

  const editingDay = editingModule
    ? course.days.find((d) => d.id === editingModule.dayId)
    : undefined;
  const editingModuleData = editingDay?.modules.find(
    (m) => m.id === editingModule?.moduleId,
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "oversigt", label: "Oversigt & økonomi" },
    { id: "modulplan", label: "Modulplan" },
    { id: "tilmeldinger", label: "Tilmeldinger" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/planlaegning/statusark"
          className="text-sm text-emerald-700 hover:underline"
        >
          ← Tilbage til statusark
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
          <StatusBadge status={course.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Modul 2 — kursusleder planlægger kurset · {formatDate(course.startDate)}{" "}
          – {formatDate(course.endDate)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.id
                ? "bg-emerald-100 text-emerald-900"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "oversigt" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>Kursusleder & værter</CardTitle>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Kursusleder
                </label>
                <select
                  value={resolvePersonId(course.courseLeaderId)}
                  onChange={(e) =>
                    updateCourse({ courseLeaderId: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {courseLeaders.length === 0 ? (
                    <option value="">Ingen højskolelærere oprettet endnu</option>
                  ) : (
                    courseLeaders.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))
                  )}
                </select>
                {leader && (
                  <p className="mt-1 text-xs text-slate-400">
                    {leader.email}
                    {leader.roleLabel ? ` · ${leader.roleLabel}` : ""}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Ekstra kursusværter
                </label>
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-100 p-2">
                  {staffUsers
                    .filter(
                      (person) =>
                        resolvePersonId(person.id) !==
                        resolvePersonId(course.courseLeaderId),
                    )
                    .map((person) => (
                      <HostCheckbox
                        key={person.id}
                        id={person.id}
                        name={person.name}
                        checked={course.hostIds.some(
                          (id) => resolvePersonId(id) === person.id,
                        )}
                        onChange={(checked) => {
                          const leaderId = resolvePersonId(
                            course.courseLeaderId,
                          );
                          const normalizedHosts = course.hostIds
                            .map((id) => resolvePersonId(id))
                            .filter((id) => id !== leaderId);
                          const hostIds = checked
                            ? [...normalizedHosts, person.id]
                            : normalizedHosts.filter((id) => id !== person.id);
                          updateCourse({ hostIds });
                        }}
                      />
                    ))}
                  {staffUsers.length === 0 && (
                    <p className="text-xs text-slate-500">
                      Ingen brugere oprettet endnu
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Valgt leder: {leader?.name} · Værter:{" "}
                {hosts.length > 0
                  ? hosts.map((h) => h?.name).join(", ")
                  : "Ingen"}
              </p>
            </div>
          </Card>

          <Card>
            <CardTitle>Datoer & deltagere</CardTitle>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Startdato">
                <input
                  type="date"
                  value={course.startDate}
                  onChange={(e) => updateCourse({ startDate: e.target.value })}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                />
              </Field>
              <Field label="Slutdato">
                <input
                  type="date"
                  value={course.endDate}
                  onChange={(e) => updateCourse({ endDate: e.target.value })}
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                />
              </Field>
              <Field label="Budget antal">
                <input
                  type="number"
                  value={course.capacity}
                  onChange={(e) =>
                    updateCourse({ capacity: Number(e.target.value) })
                  }
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                />
              </Field>
              <Field label="Realiseret antal">
                <input
                  type="number"
                  readOnly
                  value={getRealiseretAntal(course)}
                  className="w-full cursor-default rounded border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-700"
                  title="Hentes automatisk fra tilmeldinger"
                />
              </Field>
              <Field label="Markedsføringsbudget">
                <input
                  type="number"
                  value={course.marketingBudget}
                  onChange={(e) =>
                    updateCourse({ marketingBudget: Number(e.target.value) })
                  }
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                />
              </Field>
            </dl>
          </Card>

          <CourseBudgetPanel
            course={course}
            budgetManual={budgetManual}
            budgetInputOverrides={budgetInputOverrides}
            onUpdateCourse={updateCourse}
            onUpdateBudgetManual={setBudgetManual}
            onUpdateBudgetInput={(patch) =>
              setBudgetInputOverrides((prev) => ({ ...prev, ...patch }))
            }
          />

          <CourseLokaleSpecPanel course={course} onUpdate={updateCourse} />

          <Card className="lg:col-span-2">
            <CardTitle>Kursets hovedsigte (UBAK)</CardTitle>
            <CardDescription className="mt-1">
              Beskriv kursets hovedsigte og forhold det til skolens værdigrundlag
              — vises på UBAK_beskriv-arket under Kontor.
            </CardDescription>
            <textarea
              value={course.kursetsHovedsigte ?? ""}
              onChange={(e) => updateCourse({ kursetsHovedsigte: e.target.value })}
              rows={4}
              placeholder="Her skal kursets hovedsigte beskrives og forholdes til skolens værdigrundlag…"
              className="mt-4 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-800"
            />
          </Card>
        </div>
      )}

      {tab === "modulplan" && (
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white">
            <CardTitle>Opret modulplan</CardTitle>
            <CardDescription className="mt-1">
              Vælg om programmet bygges fra Program_UBAK-skabelon eller fra
              bunden. Alle felter kan redigeres bagefter.
            </CardDescription>

            {!course.startDate || dayCount <= 0 ? (
              <p className="mt-4 text-sm text-amber-800">
                Angiv start- og slutdato under Oversigt for at oprette
                modulplanen ({dayCount || 0} dage registreret).
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-600">
                  Kursus: {dayCount} dage · {formatDate(course.startDate)} –{" "}
                  {formatDate(course.endDate)}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => initializeModulplan("bunden")}
                    className={`rounded-xl border p-4 text-left transition ${
                      course.modulePlanMode === "bunden"
                        ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <LayoutTemplate className="h-4 w-4" />
                      Fra bunden
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Opret {dayCount} tomme dage og tilføj moduler manuelt
                      eller fra modullisten.
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={!templateForCourse}
                    onClick={() => initializeModulplan("skabelon")}
                    className={`rounded-xl border p-4 text-left transition ${
                      !templateForCourse
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                        : course.modulePlanMode === "skabelon"
                          ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <FileSpreadsheet className="h-4 w-4" />
                      Fra skabelon
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {templateForCourse
                        ? `Indlæs ${templateForCourse.name} med UBAK, FT, PTS og Løn.`
                        : `Ingen skabelon for ${dayCount} dage — opret en under Skabeloner.`}
                    </p>
                  </button>
                </div>

                {course.moduleTemplateName && (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-medium text-slate-800">
                      Aktiv skabelon: {course.moduleTemplateName}
                    </span>
                    {templateForCourse && (
                      <>
                        <Button
                          variant="secondary"
                          className="h-8 text-xs"
                          onClick={reloadFromTemplate}
                        >
                          Genindlæs skabelon
                        </Button>
                        <Link
                          href={`/skabeloner/${templateForCourse.id}`}
                          className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Tilpas skabelon
                        </Link>
                      </>
                    )}
                  </div>
                )}

                {!course.moduleTemplateName && templateForCourse && (
                  <p className="text-sm text-slate-500">
                    Skabelonen kan tilpasses under{" "}
                    <Link
                      href="/skabeloner"
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      Skabeloner
                    </Link>
                    .
                  </p>
                )}
              </div>
            )}
          </Card>

          {course.days.length === 0 ? (
            <Card>
              <CardDescription>
                Vælg &quot;Fra bunden&quot; eller &quot;Fra skabelon&quot; ovenfor
                for at starte modulplanen.
              </CardDescription>
            </Card>
          ) : (
            <>
              <Card className="border-slate-200 bg-slate-50">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {planStatus === "faerdig" || course.checklist.programPlanned
                        ? "Program færdigt"
                        : "Kladde"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {lastSavedAt
                        ? `Sidst gemt ${formatPlanSavedAt(lastSavedAt)} · gemmes automatisk ved navigation og genindlæsning`
                        : "Gemmes automatisk når du redigerer"}
                    </p>
                    {saveNotice && (
                      <p className="mt-1 text-xs font-medium text-emerald-700">
                        {saveNotice}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="h-9"
                      onClick={handleSaveDraft}
                    >
                      <Save className="h-4 w-4" />
                      Gem kladde
                    </Button>
                    <Button className="h-9" onClick={handleProgramFinished}>
                      <CheckCircle2 className="h-4 w-4" />
                      Program færdigt
                    </Button>
                  </div>
                </div>
                {incompleteCount > 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    {incompleteCount} modul(er) mangler udfyldning — du kan
                    stadig gemme kladde og fortsætte senere.
                  </p>
                )}
                {!kitchenValidation.ok && course.days.length > 0 && (
                  <div className="mt-3">
                    <KitchenPlanWarnings validation={kitchenValidation} />
                  </div>
                )}
              </Card>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  Klik på et modul for at redigere. Træk via håndtaget for at
                  flytte mellem dage og tidspunkter — klokkeslettet opdateres
                  automatisk.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={lastActiveDayId}
                    onChange={(e) => setLastActiveDayId(e.target.value)}
                  >
                    {course.days.map((day) => (
                      <option key={day.id} value={day.id}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value && lastActiveDayId) {
                        addModuleFromLibrary(lastActiveDayId, e.target.value);
                      }
                      e.target.value = "";
                    }}
                  >
                    <option value="">Tilføj fra modulliste…</option>
                    {moduleLibrary.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ModulePlanBoard
                days={course.days}
                courseId={course.id}
                editingModule={editingModule}
                onSelectModule={(dayId, moduleId) => {
                  setLastActiveDayId(dayId);
                  setEditingModule({ dayId, moduleId });
                }}
                onAddModule={(dayId) => addManualModule(dayId)}
                onMoveModule={moveModule}
                onToggleModuleReady={(dayId, moduleId, klar) =>
                  updateModule(dayId, moduleId, { klar })
                }
                onToggleHeldagsturPunkt={toggleHeldagsturPunkt}
              />

              {editingModuleData && editingDay && (
                <ModuleEditDialog
                  open
                  courseId={course.id}
                  courseDefaults={course}
                  module={editingModuleData}
                  dayLabel={editingDay.label}
                  onClose={() => setEditingModule(null)}
                  onChange={(patch) =>
                    updateModule(
                      editingModule!.dayId,
                      editingModule!.moduleId,
                      patch,
                    )
                  }
                  onRemove={() => {
                    removeModule(editingModule!.dayId, editingModule!.moduleId);
                    setEditingModule(null);
                  }}
                />
              )}

              {programTotals && (
                <Card className="border-slate-300 bg-slate-50">
                  <CardTitle className="text-base">
                    Programtotaler (Program_UBAK)
                  </CardTitle>
                  <CardDescription>
                    Summering på tværs af alle dage — måltider tæller ikke med
                  </CardDescription>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <TotalItem
                      label="UV (UBAK + FT)"
                      value={`${programTotals.uvMinutter} min (${minToHours(programTotals.uvMinutter)} t)`}
                    />
                    <TotalItem
                      label="UBAK"
                      value={`${programTotals.ubakMinutter} min (${minToHours(programTotals.ubakMinutter)} t)`}
                    />
                    <TotalItem
                      label="FT"
                      value={`${programTotals.ftMinutter} min (${minToHours(programTotals.ftMinutter)} t) · ${programTotals.ftPct.toFixed(0)}%`}
                    />
                    <TotalItem
                      label="PTS"
                      value={`${programTotals.ptsMinutter} min (${minToHours(programTotals.ptsMinutter)} t)`}
                    />
                    <TotalItem
                      label="BH"
                      value={`${programTotals.bhMinutter} min (${minToHours(programTotals.bhMinutter)} t) · ${programTotals.bhPct.toFixed(0)}%`}
                    />
                  </dl>
                  {dayCount === 5 && (
                    <p className="mt-3 text-xs text-slate-500">
                      Reference fra {programUbak5Dage.sourceFile}: UV 135 min,
                      UBAK 75 min, FT 60 min (44%), PTS 90 min.
                    </p>
                  )}
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {tab === "tilmeldinger" && (
        <Card>
          <CardTitle>Tilmeldinger</CardTitle>
          <CardDescription>
            {getRealiseretAntal(course)} tilmeldte · {course.paid} betalt ·{" "}
            {Math.max(0, getBudgetAntal(course) - getRealiseretAntal(course))}{" "}
            pladser tilbage
          </CardDescription>
          <Button href="/tilmeldinger" className="mt-4" variant="secondary">
            Se alle tilmeldinger
          </Button>
          <Button href={`/katalog/${course.id}`} className="mt-4 ml-2" variant="outline">
            Offentlig tilmeldingsside
          </Button>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function TotalItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function HostCheckbox({
  id,
  name,
  checked,
  onChange,
}: {
  id: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {name}
    </label>
  );
}
