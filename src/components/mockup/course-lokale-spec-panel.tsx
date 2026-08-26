"use client";

import { MapPin } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LokaleSpecForm, FieldTextarea } from "@/components/mockup/lokale-spec-form";
import { defaultLokaleSpec, type Course } from "@/lib/mock-data";
import {
  countModulesUsingCourseLokaleSpec,
  hasCourseLokaleSpecConfigured,
} from "@/lib/lokale-spec-utils";

type CourseLokaleSpecPanelProps = {
  course: Course;
  onUpdate: (patch: Partial<Course>) => void;
};

export function CourseLokaleSpecPanel({
  course,
  onUpdate,
}: CourseLokaleSpecPanelProps) {
  const spec = course.courseLokaleSpec ?? defaultLokaleSpec();
  const counts = countModulesUsingCourseLokaleSpec(course);
  const configured = hasCourseLokaleSpecConfigured(course.courseLokaleSpec);

  function updateSpec(patch: Partial<typeof spec>) {
    onUpdate({
      courseLokaleSpec: { ...spec, ...patch },
    });
  }

  return (
    <Card className="lg:col-span-2">
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <div className="min-w-0 flex-1">
          <CardTitle>Lokalespecifikation — hele kurset</CardTitle>
          <CardDescription className="mt-1">
            Standardopsætning for alle moduler i programmet, undtagen køkken/måltider.
            Ændres automatisk på moduler, der ikke er manuelt tilpasset.
          </CardDescription>
        </div>
      </div>

      {counts.total > 0 && (
        <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
          {configured ? (
            <>
              Gælder <span className="font-semibold">{counts.inherited}</span> af{" "}
              {counts.total} moduler
              {counts.manual > 0 && (
                <>
                  {" "}
                  · <span className="font-semibold">{counts.manual}</span> manuelt
                  tilpasset i modulplanen
                </>
              )}
            </>
          ) : (
            <>
              {counts.total} moduler i programmet — udfyld standard her, eller
              tilpas enkeltvis under Modulplan
            </>
          )}
        </p>
      )}

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Lokale og opsætning</p>
        <p className="text-xs text-slate-500">Som i Pedel-arket i praktisk seddel</p>
        <div className="mt-4">
          <LokaleSpecForm
            spec={spec}
            onChange={updateSpec}
            showModuleNoter={false}
          />
        </div>
      </div>

      <div className="mt-4">
        <FieldTextarea
          label="Generelle noter til pedel/rengøring"
          value={course.pedelGenerelleNoter ?? ""}
          onChange={(v) => onUpdate({ pedelGenerelleNoter: v })}
          rows={3}
          placeholder="Fx særlige rengøringsønsker, nøgler, adgang eller andet der gælder hele kurset…"
        />
      </div>
    </Card>
  );
}
