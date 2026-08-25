"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ModuleEditDialog } from "@/components/mockup/module-edit-dialog";
import {
  ModulePlanBoard,
  type EditingModule,
} from "@/components/mockup/module-plan-board";
import {
  createEmptyModule,
  type CourseDay,
  type CourseModule,
} from "@/lib/mock-data";
import { moveModuleInPlan } from "@/lib/module-plan-utils";
import {
  formatTemplateSavedAt,
  getTemplateById,
  resetTemplate,
  saveTemplate,
} from "@/lib/template-storage";
import {
  courseDaysToTemplate,
  templateToCourseDays,
} from "@/lib/template-utils";

export function TemplateEditorView({ templateId }: { templateId: string }) {
  const baseTemplate = getTemplateById(templateId);
  const [days, setDays] = useState<CourseDay[]>(() =>
    baseTemplate ? templateToCourseDays(baseTemplate) : [],
  );
  const [editingModule, setEditingModule] = useState<EditingModule>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  const template = baseTemplate;

  useEffect(() => {
    const fresh = getTemplateById(templateId);
    if (!fresh) return;
    setDays(templateToCourseDays(fresh));
    hydratedRef.current = true;
  }, [templateId]);

  const persist = useCallback(
    (nextDays: CourseDay[], options: { silent?: boolean } = {}) => {
      if (!template || !hydratedRef.current) return;
      const updated = courseDaysToTemplate(template, nextDays);
      const meta = saveTemplate(updated);
      setLastSavedAt(meta.updatedAt);
      if (!options.silent) {
        setSaveNotice("Skabelon gemt");
        window.setTimeout(() => setSaveNotice(null), 2500);
      }
    },
    [template],
  );

  useEffect(() => {
    if (!hydratedRef.current || !template) return;
    persist(days, { silent: true });
  }, [days, persist, template]);

  if (!template) {
    return (
      <div className="space-y-4">
        <Link
          href="/skabeloner"
          className="text-sm text-emerald-700 hover:underline"
        >
          ← Tilbage til skabeloner
        </Link>
        <p className="text-slate-600">Skabelonen findes ikke.</p>
      </div>
    );
  }

  function updateDay(dayId: string, updater: (day: CourseDay) => CourseDay) {
    setDays((prev) => prev.map((d) => (d.id === dayId ? updater(d) : d)));
  }

  function addModule(dayId: string) {
    const mod = createEmptyModule();
    updateDay(dayId, (day) => ({
      ...day,
      modules: [...day.modules, mod],
    }));
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
    setDays((prev) =>
      moveModuleInPlan(prev, fromDayId, moduleId, toDayId, toIndex),
    );
    if (editingModule?.moduleId === moduleId) {
      setEditingModule({ dayId: toDayId, moduleId });
    }
  }

  function handleReset() {
    if (
      !window.confirm(
        "Dette nulstiller skabelonen til standardversionen. Fortsæt?",
      )
    ) {
      return;
    }
    resetTemplate(templateId);
    const fresh = getTemplateById(templateId);
    if (fresh) {
      setDays(templateToCourseDays(fresh));
      setEditingModule(null);
      setLastSavedAt(null);
      setSaveNotice("Skabelon nulstillet til standard");
      window.setTimeout(() => setSaveNotice(null), 2500);
    }
  }

  function handleSave() {
    persist(days);
  }

  const editingDay = editingModule
    ? days.find((d) => d.id === editingModule.dayId)
    : undefined;
  const editingModuleData = editingDay?.modules.find(
    (m) => m.id === editingModule?.moduleId,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/skabeloner"
          className="text-sm text-emerald-700 hover:underline"
        >
          ← Tilbage til skabeloner
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {template.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {template.sheetName} · {template.dayCount} dage ·{" "}
              {template.sourceFile}
            </p>
            {lastSavedAt && (
              <p className="mt-1 text-xs text-slate-500">
                Sidst gemt {formatTemplateSavedAt(lastSavedAt)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {saveNotice && (
              <span className="text-sm font-medium text-emerald-700">
                {saveNotice}
              </span>
            )}
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              Nulstil standard
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4" />
              Gem skabelon
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardTitle className="text-base">Modulplan i skabelon</CardTitle>
        <CardDescription className="mt-1">
          Rediger moduler, tidspunkter og UBAK-fordeling. Ændringer bruges næste
          gang skabelonen vælges på et kursus. Træk moduler via håndtaget.
        </CardDescription>

        <div className="mt-4">
          <ModulePlanBoard
            days={days}
            editingModule={editingModule}
            onSelectModule={(dayId, moduleId) =>
              setEditingModule({ dayId, moduleId })
            }
            onAddModule={addModule}
            onMoveModule={moveModule}
            onToggleModuleReady={(dayId, moduleId, klar) =>
              updateModule(dayId, moduleId, { klar })
            }
            onToggleHeldagsturPunkt={toggleHeldagsturPunkt}
          />
        </div>
      </Card>

      {editingModuleData && editingDay && (
        <ModuleEditDialog
          open
          module={editingModuleData}
          dayLabel={editingDay.label}
          onClose={() => setEditingModule(null)}
          onChange={(patch) =>
            updateModule(editingModule!.dayId, editingModule!.moduleId, patch)
          }
          onRemove={() => {
            removeModule(editingModule!.dayId, editingModule!.moduleId);
            setEditingModule(null);
          }}
        />
      )}
    </div>
  );
}
