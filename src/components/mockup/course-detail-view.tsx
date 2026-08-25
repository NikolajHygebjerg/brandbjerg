"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
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
} from "@/lib/module-plan-utils";
import {
  getTemplateForDayCount,
  programUbak5Dage,
} from "@/lib/program-templates/liv-i-haven-5dage";
import {
  getStaff,
  hojskolelaerere,
  kortKursusLedere,
} from "@/lib/brandbjerg-staff";
import { loadCoursePlan, saveCoursePlan } from "@/lib/course-plan-storage";

type Tab = "oversigt" | "modulplan" | "tilmeldinger";

export function CourseDetailView({ course: initial }: { course: Course }) {
  const [course, setCourse] = useState(initial);
  const [tab, setTab] = useState<Tab>("oversigt");
  const [editingModule, setEditingModule] = useState<EditingModule>(null);
  const [lastActiveDayId, setLastActiveDayId] = useState(
    initial.days[0]?.id ?? "",
  );
  const [mockAccountantView, setMockAccountantView] = useState(false);
  const { registerSession } = useCourseDetailSession();

  const leader = getStaff(course.courseLeaderId);
  const hosts = course.hostIds.map((id) => getStaff(id)).filter(Boolean);
  const dayCount = countInclusiveDays(course.startDate, course.endDate);
  const templateForCourse = getTemplateForDayCount(dayCount);

  useEffect(() => {
    const stored = loadCoursePlan(initial.id);
    if (stored?.days?.length) {
      setCourse((prev) => ({
        ...prev,
        days: stored.days,
        modulePlanMode: stored.modulePlanMode ?? prev.modulePlanMode,
        moduleTemplateName:
          stored.moduleTemplateName ?? prev.moduleTemplateName,
      }));
      setLastActiveDayId(stored.days[0]?.id ?? "");
    }
  }, [initial.id]);

  useEffect(() => {
    if (course.days.length === 0) return;
    saveCoursePlan(course.id, {
      days: course.days,
      modulePlanMode: course.modulePlanMode,
      moduleTemplateName: course.moduleTemplateName,
    });
  }, [
    course.id,
    course.days,
    course.modulePlanMode,
    course.moduleTemplateName,
  ]);

  function updateCourse(patch: Partial<Course>) {
    setCourse((prev) => ({ ...prev, ...patch }));
  }

  function updateChecklist(patch: Partial<CourseChecklist>) {
    setCourse((prev) => ({
      ...prev,
      checklist: { ...prev.checklist, ...patch },
    }));
  }

  function markProgramDone() {
    updateChecklist({ programPlanned: true });
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
                  value={course.courseLeaderId}
                  onChange={(e) =>
                    updateCourse({ courseLeaderId: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <optgroup label="Højskolelærere — korte kurser">
                    {kortKursusLedere.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.initials})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Højskolelærere">
                    {hojskolelaerere
                      .filter((t) => t.group === "hojskolelaerer")
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
                {leader && (
                  <p className="mt-1 text-xs text-slate-400">{leader.subjects}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Ekstra kursusværter
                </label>
                <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-100 p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Korte kurser
                  </p>
                  {kortKursusLedere
                    .filter((t) => t.id !== course.courseLeaderId)
                    .map((t) => (
                      <HostCheckbox
                        key={t.id}
                        id={t.id}
                        name={`${t.name} (${t.initials})`}
                        checked={course.hostIds.includes(t.id)}
                        onChange={(checked) => {
                          const hostIds = checked
                            ? [...course.hostIds, t.id]
                            : course.hostIds.filter((id) => id !== t.id);
                          updateCourse({ hostIds });
                        }}
                      />
                    ))}
                  <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Højskolelærere
                  </p>
                  {hojskolelaerere
                    .filter(
                      (t) =>
                        t.group === "hojskolelaerer" &&
                        t.id !== course.courseLeaderId,
                    )
                    .map((t) => (
                      <HostCheckbox
                        key={t.id}
                        id={t.id}
                        name={t.name}
                        checked={course.hostIds.includes(t.id)}
                        onChange={(checked) => {
                          const hostIds = checked
                            ? [...course.hostIds, t.id]
                            : course.hostIds.filter((id) => id !== t.id);
                          updateCourse({ hostIds });
                        }}
                      />
                    ))}
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
            <CardTitle>Datoer, pris & budget</CardTitle>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
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
              <Field label="Kursuspris">
                <input
                  type="number"
                  value={course.price}
                  onChange={(e) =>
                    updateCourse({ price: Number(e.target.value) })
                  }
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                />
              </Field>
              <Field label="Kapacitet">
                <input
                  type="number"
                  value={course.capacity}
                  onChange={(e) =>
                    updateCourse({ capacity: Number(e.target.value) })
                  }
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                />
              </Field>
              <Field label="Budget">
                <input
                  type="number"
                  value={course.budget}
                  onChange={(e) =>
                    updateCourse({ budget: Number(e.target.value) })
                  }
                  className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
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
            <p className="mt-3 text-sm text-slate-600">
              Pris: {formatDKK(course.price)} · Budget:{" "}
              {formatDKK(course.budget)} · Marketing:{" "}
              {formatDKK(course.marketingBudget)}
            </p>
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
                        ? `Indlæs ${templateForCourse.sheetName} fra ${templateForCourse.sourceFile} med UBAK, FT, PTS og Løn.`
                        : `Ingen skabelon for ${dayCount} dage endnu (Program_UBAK findes for 5 dage).`}
                    </p>
                  </button>
                </div>

                {course.moduleTemplateName && (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-medium text-slate-800">
                      Aktiv skabelon: {course.moduleTemplateName}
                    </span>
                    {templateForCourse && (
                      <Button
                        variant="secondary"
                        className="h-8 text-xs"
                        onClick={reloadFromTemplate}
                      >
                        Genindlæs skabelon
                      </Button>
                    )}
                  </div>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  Klik på et modul for at redigere. Alle dage vises side om side
                  som i Program_UBAK.
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
                editingModule={editingModule}
                onSelectModule={(dayId, moduleId) => {
                  setLastActiveDayId(dayId);
                  setEditingModule({ dayId, moduleId });
                }}
                onAddModule={(dayId) => addManualModule(dayId)}
              />

              {editingModuleData && editingDay && (
                <ModuleEditDialog
                  open
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
            {course.enrolled} tilmeldte · {course.paid} betalt ·{" "}
            {course.capacity - course.enrolled} pladser tilbage
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
