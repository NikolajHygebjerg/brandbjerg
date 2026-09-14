"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { triggerKursuslederPrint } from "@/components/mockup/kursusleder-print-trigger";
import {
  applyDocumentPlaceholders,
  getDocumentTemplate,
} from "@/lib/document-template-storage";
import type { Course } from "@/lib/mock-data";

function DialogShell({
  title,
  description,
  children,
  onClose,
  onPrint,
  printLabel = "Send til skolens printer",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  onPrint?: () => void;
  printLabel?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        role="dialog"
        aria-labelledby="afvikling-dialog-title"
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <CardTitle className="text-base">
            <span id="afvikling-dialog-title">{title}</span>
          </CardTitle>
          {description && (
            <CardDescription className="mt-1">{description}</CardDescription>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Luk
          </Button>
          {onPrint && (
            <Button type="button" className="gap-2" onClick={onPrint}>
              <Printer className="h-4 w-4" />
              {printLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function KursuslederVelkomstDialog({
  open,
  onClose,
  course,
  draft,
  onDraftChange,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  course: Course;
  draft: string;
  onDraftChange: (text: string) => void;
  onSave: () => void;
}) {
  if (!open) return null;

  const template = getDocumentTemplate("velkomst-afvikling");
  const suggested = applyDocumentPlaceholders(template.body, {
    kursusTitel: course.title,
  });

  return (
    <DialogShell
      title="Velkomst"
      description="Forslag fra skabelon (KK) — gemmes kun på dette kursus"
      onClose={onClose}
    >
      <p className="mb-3 text-xs text-slate-500">
        Master-skabelon redigeres under{" "}
        <Link href="/skabeloner" className="font-medium text-teal-700 underline">
          Skabeloner → dokumenter
        </Link>
        . Ændringer her påvirker ikke skabelonen.
      </p>
      {!draft.trim() && (
        <Button
          type="button"
          variant="secondary"
          className="mb-3 text-xs"
          onClick={() => onDraftChange(suggested)}
        >
          Indsæt forslag fra skabelon
        </Button>
      )}
      <textarea
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        rows={12}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed"
        placeholder={suggested}
      />
      <div className="mt-3 flex justify-end">
        <Button type="button" onClick={onSave}>
          Gem på kursus
        </Button>
      </div>
    </DialogShell>
  );
}

export function KursuslederPrintPreviewDialog({
  open,
  onClose,
  title,
  description,
  printTarget,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  printTarget: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <DialogShell
      title={title}
      description={description}
      onClose={onClose}
      onPrint={() => {
        triggerKursuslederPrint(printTarget);
        onClose();
      }}
    >
      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-inner">
        {children}
      </div>
    </DialogShell>
  );
}

export function DrikkevarerPrintDialog({
  open,
  onClose,
  course,
  courseNote,
  onCourseNoteChange,
  onSaveNote,
}: {
  open: boolean;
  onClose: () => void;
  course: Course;
  courseNote: string;
  onCourseNoteChange: (v: string) => void;
  onSaveNote: () => void;
}) {
  if (!open) return null;

  const template = getDocumentTemplate("drikkevarerseddel");
  const body = applyDocumentPlaceholders(template.body, {
    kursusTitel: course.title,
  });

  return (
    <DialogShell
      title="Print drikkevarerseddel"
      description="Master som Drikkevarerseddel — NY Master.pdf"
      onClose={onClose}
      onPrint={() => {
        window.open("/documents/drikkevarerseddel-master.pdf", "_blank");
      }}
      printLabel="Åbn PDF til print"
    >
      <p className="mb-2 text-xs text-slate-500">
        Rediger master under{" "}
        <Link href="/skabeloner" className="text-teal-700 underline">
          Skabeloner
        </Link>
        .
      </p>
      <pre className="mb-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-800">
        {body}
      </pre>
      <label className="block text-xs font-medium text-slate-600">
        Kursusnote (valgfri — printes sammen med sedlen)
      </label>
      <textarea
        value={courseNote}
        onChange={(e) => onCourseNoteChange(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <div className="mt-2 flex justify-end">
        <Button type="button" variant="secondary" onClick={onSaveNote}>
          Gem kursusnote
        </Button>
      </div>
      <iframe
        title="Drikkevarerseddel PDF"
        src="/documents/drikkevarerseddel-master.pdf"
        className="mt-4 h-64 w-full rounded border border-slate-200"
      />
    </DialogShell>
  );
}
