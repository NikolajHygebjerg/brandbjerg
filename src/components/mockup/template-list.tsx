"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, LayoutTemplate, Pencil } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  formatTemplateSavedAt,
  getTemplateMeta,
  isTemplateCustomized,
  listTemplates,
} from "@/lib/template-storage";
import { countTemplateModules } from "@/lib/template-utils";

export function TemplateList() {
  const [templates, setTemplates] = useState(() => listTemplates());
  const [, setTick] = useState(0);

  useEffect(() => {
    setTemplates(listTemplates());
  }, []);

  function refresh() {
    setTemplates(listTemplates());
    setTick((t) => t + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Skabeloner</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tilpas programskabeloner, så de matcher jeres standard hver gang de
          vælges på et kursus.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const customized = isTemplateCustomized(template.id);
          const meta = getTemplateMeta(template.id);
          const moduleCount = countTemplateModules(template);

          return (
            <Card
              key={template.id}
              className="flex flex-col border-slate-200 transition hover:border-emerald-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base leading-snug">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.sheetName} · {template.sourceFile}
                  </CardDescription>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Dage</dt>
                  <dd className="font-medium text-slate-900">
                    {template.dayCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Moduler</dt>
                  <dd className="font-medium text-slate-900">{moduleCount}</dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap gap-2">
                {customized ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    Tilpasset
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    Standard
                  </span>
                )}
                {meta && (
                  <span className="text-xs text-slate-500">
                    Gemt {formatTemplateSavedAt(meta.updatedAt)}
                  </span>
                )}
              </div>

              <div className="mt-auto flex gap-2 pt-4">
                <Link
                  href={`/skabeloner/${template.id}`}
                  onClick={refresh}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  <Pencil className="h-4 w-4" />
                  Rediger skabelon
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-200 bg-slate-50">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
          <div>
            <CardTitle className="text-base">Sådan bruges skabeloner</CardTitle>
            <CardDescription className="mt-2 leading-relaxed">
              Når du opretter en modulplan på et kursus og vælger &quot;Fra
              skabelon&quot;, indlæses den tilpassede version herfra. Ændringer
              på skabelonsiden påvirker ikke eksisterende kursusplaner — kun
              nye indlæsninger og &quot;Genindlæs skabelon&quot;.
            </CardDescription>
          </div>
        </div>
      </Card>
    </div>
  );
}
