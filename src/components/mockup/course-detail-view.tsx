"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, FileSpreadsheet, LayoutTemplate, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import { useCourseDetailSession } from "@/context/course-detail-session";
import {
  createEmptyModule,
  formatDate,
  formatDKK,
  moduleDurationMinutes,
  moduleLibrary,
  timingTotal,
  type Course,
  type CourseChecklist,
  type CourseDay,
  type CourseModule,
  type ModuleLon,
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

type Tab = "oversigt" | "modulplan" | "tilmeldinger";

export function CourseDetailView({ course: initial }: { course: Course }) {
  const [course, setCourse] = useState(initial);
  const [tab, setTab] = useState<Tab>("oversigt");
  const [selectedDayId, setSelectedDayId] = useState(
    initial.days[0]?.id ?? "",
  );
  const [expandedModule, setExpandedModule] = useState<string | null>(
    initial.days[0]?.modules[0]?.id ?? null,
  );
  const [mockAccountantView, setMockAccountantView] = useState(false);
  const { registerSession } = useCourseDetailSession();

  const leader = getStaff(course.courseLeaderId);
  const hosts = course.hostIds.map((id) => getStaff(id)).filter(Boolean);
  const selectedDay = course.days.find((d) => d.id === selectedDayId);
  const dayCount = countInclusiveDays(course.startDate, course.endDate);
  const templateForCourse = getTemplateForDayCount(dayCount);

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

  function addModuleFromLibrary(libId: string) {
    if (!selectedDay) return;
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
    updateDay(selectedDay.id, (day) => ({
      ...day,
      modules: [...day.modules, mod],
    }));
    setExpandedModule(mod.id);
  }

  function addManualModule() {
    if (!selectedDay) return;
    const mod = createEmptyModule();
    updateDay(selectedDay.id, (day) => ({
      ...day,
      modules: [...day.modules, mod],
    }));
    setExpandedModule(mod.id);
  }

  function removeModule(dayId: string, moduleId: string) {
    updateDay(dayId, (day) => ({
      ...day,
      modules: day.modules.filter((m) => m.id !== moduleId),
    }));
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
    setSelectedDayId(days[0]?.id ?? "");
    setExpandedModule(days[0]?.modules[0]?.id ?? null);
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
              <div className="grid gap-6 lg:grid-cols-4">
                <Card className="lg:col-span-1">
                  <CardTitle>Dage</CardTitle>
                  <div className="mt-3 space-y-1">
                    {course.days.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => setSelectedDayId(day.id)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                          selectedDayId === day.id
                            ? "bg-emerald-100 font-medium text-emerald-900"
                            : "hover:bg-slate-100"
                        }`}
                      >
                        {day.label}
                        <span className="block text-xs text-slate-500">
                          {formatDate(day.date)} · {day.modules.length} moduler
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>

                <div className="space-y-4 lg:col-span-3">
                  {selectedDay && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <select
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value)
                              addModuleFromLibrary(e.target.value);
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
                        <Button onClick={addManualModule} variant="secondary">
                          <Plus className="h-4 w-4" />
                          Opret modul manuelt
                        </Button>
                      </div>

                      {selectedDay.modules.length === 0 ? (
                        <Card>
                          <CardDescription>
                            Ingen moduler på {selectedDay.label} endnu.
                          </CardDescription>
                        </Card>
                      ) : (
                        selectedDay.modules.map((mod) => (
                          <ModuleCard
                            key={mod.id}
                            module={mod}
                            expanded={expandedModule === mod.id}
                            onToggle={() =>
                              setExpandedModule(
                                expandedModule === mod.id ? null : mod.id,
                              )
                            }
                            onChange={(patch) =>
                              updateModule(selectedDay.id, mod.id, patch)
                            }
                            onRemove={() =>
                              removeModule(selectedDay.id, mod.id)
                            }
                          />
                        ))
                      )}
                    </>
                  )}
                </div>
              </div>

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

function ModuleCard({
  module: mod,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  module: CourseModule;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<CourseModule>) => void;
  onRemove: () => void;
}) {
  const duration = moduleDurationMinutes(mod);
  const timingSum = timingTotal(mod);

  return (
    <Card className={mod.klar ? "border-emerald-200" : mod.erMaltid ? "border-amber-100 bg-amber-50/30" : ""}>
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">
              {mod.overskrift || "Nyt modul"}
            </CardTitle>
            {mod.erMaltid && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Måltid
              </span>
            )}
            {mod.klar && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Klar
              </span>
            )}
          </div>
          <CardDescription>
            {mod.tidFra}–{mod.tidTil}
            {mod.rolle ? ` · ${mod.rolle}` : ""}
            {mod.underviser ? ` · ${mod.underviser}` : ""}
            {mod.lon ? ` · Løn ${mod.lon}` : ""}
            {!mod.erMaltid && timingSum > 0
              ? ` · UBAK ${mod.timing.ubak} FT ${mod.timing.ft} PTS ${mod.timing.pts}`
              : ""}
          </CardDescription>
        </button>
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            onClick={() => onChange({ klar: !mod.klar })}
            variant={mod.klar ? "secondary" : "primary"}
            className="h-8 text-xs"
          >
            {mod.klar ? "Fjern klar" : "Markér klar"}
          </Button>
          <span className="text-center text-xs text-slate-400">
            {expanded ? "Luk" : "Rediger"}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <Input
            label="Overskrift"
            value={mod.overskrift}
            onChange={(v) => onChange({ overskrift: v })}
          />
          <div>
            <label className="text-xs font-medium text-slate-500">Rolle</label>
            <select
              value={mod.rolle}
              onChange={(e) => onChange({ rolle: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Vælg rolle…</option>
              <option value="Kursusleder">Kursusleder</option>
              <option value="Foredragsholder">Foredragsholder</option>
              <option value="Køkken">Køkken</option>
              <option value="Vært">Vært</option>
            </select>
          </div>
          <Input
            label="Underviser / ansvarlig"
            value={mod.underviser}
            onChange={(v) => onChange({ underviser: v })}
          />
          <div>
            <label className="text-xs font-medium text-slate-500">
              Undervisertype
            </label>
            <select
              value={mod.underviserType}
              onChange={(e) =>
                onChange({
                  underviserType: e.target.value as "intern" | "ekstern",
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="intern">Intern underviser</option>
              <option value="ekstern">Ekstern underviser</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">
              Løn (foredragsholder)
            </label>
            <select
              value={mod.lon}
              onChange={(e) => onChange({ lon: e.target.value as ModuleLon })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Ingen løn</option>
              <option value="A">A-løn</option>
              <option value="B">B-løn</option>
            </select>
          </div>
          <Input
            label="Pris (DKK)"
            type="number"
            value={String(mod.pris)}
            onChange={(v) => onChange({ pris: Number(v) })}
          />
          <Input
            label="Tid fra"
            value={mod.tidFra}
            onChange={(v) => onChange({ tidFra: v })}
          />
          <Input
            label="Tid til"
            value={mod.tidTil}
            onChange={(v) => onChange({ tidTil: v })}
          />
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-500">
              Brødtekst til hjemmesiden
            </label>
            <textarea
              value={mod.broedtekst}
              onChange={(e) => onChange({ broedtekst: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-500">
              Interne noter
            </label>
            <textarea
              value={mod.interneNoter}
              onChange={(e) => onChange({ interneNoter: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <Input
            label="Ønsker til pedel"
            value={mod.onskerPedel}
            onChange={(v) => onChange({ onskerPedel: v })}
          />
          <Input
            label="Ønsker til køkken"
            value={mod.onskerKoekken}
            onChange={(v) => onChange({ onskerKoekken: v })}
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(mod.erMaltid)}
              onChange={(e) => onChange({ erMaltid: e.target.checked })}
            />
            Måltid (tæller ikke med i UBAK-totaler)
          </label>

          <div className="sm:col-span-2 rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              UBAK — minutter i modulet
            </p>
            <p className="text-xs text-slate-500">
              Modulvarighed: {duration} min · Fordeling i alt: {timingSum} min
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <TimingField
                label="UBAK"
                value={mod.timing.ubak}
                onChange={(v) =>
                  onChange({ timing: { ...mod.timing, ubak: v } })
                }
              />
              <TimingField
                label="FT"
                value={mod.timing.ft}
                onChange={(v) =>
                  onChange({ timing: { ...mod.timing, ft: v } })
                }
              />
              <TimingField
                label="PTS"
                value={mod.timing.pts}
                onChange={(v) =>
                  onChange({ timing: { ...mod.timing, pts: v } })
                }
              />
              <TimingField
                label="BH"
                value={mod.timing.bh}
                onChange={(v) =>
                  onChange({ timing: { ...mod.timing, bh: v } })
                }
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
            >
              <Trash2 className="h-4 w-4" />
              Fjern modul
            </button>
          </div>
        </div>
      )}
    </Card>
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

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </div>
  );
}

function TimingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </div>
  );
}
