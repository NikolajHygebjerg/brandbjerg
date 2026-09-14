"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  getDocumentTemplate,
  listDocumentTemplates,
  saveDocumentTemplate,
  type DocumentTemplateId,
} from "@/lib/document-template-storage";

export function DocumentTemplatesSection() {
  const [templates, setTemplates] = useState(() => listDocumentTemplates());
  const [editingId, setEditingId] = useState<DocumentTemplateId | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setTemplates(listDocumentTemplates());
  }, []);

  function startEdit(id: DocumentTemplateId) {
    setEditingId(id);
    setDraft(getDocumentTemplate(id).body);
  }

  function save() {
    if (!editingId) return;
    saveDocumentTemplate(editingId, draft);
    setTemplates(listDocumentTemplates());
    setEditingId(null);
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 text-emerald-700" />
        <div>
          <CardTitle className="text-base">Dokumentskabeloner</CardTitle>
          <CardDescription>
            Velkomst ved afvikling og drikkevarerseddel — bruges af kursusleder
            (kursus-specifik tekst gemmes på kurset)
          </CardDescription>
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {templates.map((t) => (
          <li
            key={t.id}
            className="rounded-lg border border-slate-200 bg-slate-50/80 p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{t.title}</p>
                <p className="text-xs text-slate-600">{t.description}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="text-xs"
                onClick={() => startEdit(t.id)}
              >
                Rediger skabelon
              </Button>
            </div>
            {editingId === t.id && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
                />
                <div className="mt-2 flex gap-2">
                  <Button type="button" onClick={save}>
                    Gem skabelon
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingId(null)}
                  >
                    Annuller
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
