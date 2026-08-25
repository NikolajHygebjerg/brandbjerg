"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import { CourseChecklistPanel } from "@/components/mockup/course-checklist";
import {
  createEmptyModule,
  formatDate,
  formatDKK,
  getTeacher,
  moduleDurationMinutes,
  moduleLibrary,
  teachers,
  ubakTotal,
  type Course,
  type CourseChecklist,
  type CourseDay,
  type CourseModule,
} from "@/lib/mock-data";

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

  const leader = getTeacher(course.courseLeaderId);
  const hosts = course.hostIds.map((id) => getTeacher(id)).filter(Boolean);
  const selectedDay = course.days.find((d) => d.id === selectedDayId);

  function updateCourse(patch: Partial<Course>) {
    setCourse((prev) => ({ ...prev, ...patch }));
  }

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
      ubak: { hojskoleTid: 15, faerdighedstilvaenning: 30, ubak: 45 },
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

  function updateChecklist(patch: Partial<CourseChecklist>) {
    setCourse((prev) => ({
      ...prev,
      checklist: { ...prev.checklist, ...patch },
    }));
  }

  function markProgramDone() {
    updateChecklist({ programPlanned: true });
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

      <CourseChecklistPanel
        course={course}
        onUpdateChecklist={updateChecklist}
        onMarkProgramDone={markProgramDone}
        onGoToModulplan={() => setTab("modulplan")}
        mockAccountantView={mockAccountantView}
      />

      <label className="flex items-center gap-2 text-xs text-slate-500">
        <input
          type="checkbox"
          checked={mockAccountantView}
          onChange={(e) => setMockAccountantView(e.target.checked)}
        />
        Vis bogholder-knap (mock til demo)
      </label>

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
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.type === "intern" ? "intern" : "ekstern"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Ekstra kursusværter
                </label>
                <div className="mt-2 space-y-1">
                  {teachers
                    .filter((t) => t.id !== course.courseLeaderId)
                    .map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={course.hostIds.includes(t.id)}
                          onChange={(e) => {
                            const hostIds = e.target.checked
                              ? [...course.hostIds, t.id]
                              : course.hostIds.filter((id) => id !== t.id);
                            updateCourse({ hostIds });
                          }}
                        />
                        {t.name}
                      </label>
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
          <Card className="border-dashed border-slate-300 bg-slate-50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Modulskabelon</CardTitle>
                <CardDescription>
                  Dage oprettes automatisk ud fra datoer og uploadet skabelon
                </CardDescription>
              </div>
              <Button variant="secondary" className="pointer-events-none">
                <Upload className="h-4 w-4" />
                {course.moduleTemplateName ?? "Upload skabelon (kommer)"}
              </Button>
            </div>
          </Card>

          {course.days.length === 0 ? (
            <Card>
              <CardDescription>
                Angiv start- og slutdato under Oversigt for at generere dage
                automatisk (mock: tom indtil datoer sættes).
              </CardDescription>
            </Card>
          ) : (
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
                          if (e.target.value) addModuleFromLibrary(e.target.value);
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
  const ubakSum = ubakTotal(mod);

  return (
    <Card className={mod.klar ? "border-emerald-200" : ""}>
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {mod.overskrift || "Nyt modul"}
            </CardTitle>
            {mod.klar && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Klar
              </span>
            )}
          </div>
          <CardDescription>
            {mod.tidFra}–{mod.tidTil} · {mod.underviser || "Ingen underviser"} ·{" "}
            {mod.underviserType === "intern" ? "Intern" : "Ekstern"}
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
            label="Underviser"
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
          <Input
            label="Pris (DKK)"
            type="number"
            value={String(mod.pris)}
            onChange={(v) => onChange({ pris: Number(v) })}
          />
          <Input
            label="Overskrift"
            value={mod.overskrift}
            onChange={(v) => onChange({ overskrift: v })}
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
            label="Ønsker til pedel (kommer)"
            value={mod.onskerPedel}
            onChange={(v) => onChange({ onskerPedel: v })}
            placeholder="Konfigureres senere"
          />
          <Input
            label="Ønsker til køkken (kommer)"
            value={mod.onskerKoekken}
            onChange={(v) => onChange({ onskerKoekken: v })}
            placeholder="Konfigureres senere"
          />

          <div className="sm:col-span-2 rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              UBAK — minutter i modulet
            </p>
            <p className="text-xs text-slate-500">
              Modulvarighed: {duration} min · UBAK i alt: {ubakSum} min
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <UbakField
                label="HøjskoleTid"
                value={mod.ubak.hojskoleTid}
                onChange={(v) =>
                  onChange({ ubak: { ...mod.ubak, hojskoleTid: v } })
                }
              />
              <UbakField
                label="Færdighedstilvænning"
                value={mod.ubak.faerdighedstilvaenning}
                onChange={(v) =>
                  onChange({ ubak: { ...mod.ubak, faerdighedstilvaenning: v } })
                }
              />
              <UbakField
                label="UBAK (bred almen karakter)"
                value={mod.ubak.ubak}
                onChange={(v) => onChange({ ubak: { ...mod.ubak, ubak: v } })}
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

function UbakField({
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
