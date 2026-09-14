"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import {
  triggerKursuslederPrint,
  triggerPdfPrint,
} from "@/components/mockup/kursusleder-print-trigger";
import {
  applyDocumentPlaceholders,
  getDocumentTemplate,
} from "@/lib/document-template-storage";
import type { Course } from "@/lib/mock-data";

const DRIKKEVARERSEDdel_MASTER_PDF =
  "/documents/drikkevarerseddel-master.pdf";

function DialogShell({
  title,
  description,
  children,
  onClose,
  onPrint,
  printLabel = "Send til skolens printer",
  footerExtra,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  onPrint?: () => void;
  printLabel?: string;
  footerExtra?: React.ReactNode;
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
          {footerExtra}
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
      onPrint={() => triggerKursuslederPrint("kl-print-velkomst")}
      printLabel="Print"
      footerExtra={
        <Button type="button" onClick={onSave}>
          Gem på kursus
        </Button>
      }
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
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <DialogShell
      title="Print drikkevarerseddel"
      description="Forhåndsvisning af master-PDF"
      onClose={onClose}
      onPrint={() => {
        triggerPdfPrint(DRIKKEVARERSEDdel_MASTER_PDF);
        onClose();
      }}
      printLabel="Print"
    >
      <iframe
        title="Drikkevarerseddel PDF"
        src={DRIKKEVARERSEDdel_MASTER_PDF}
        className="h-[min(60vh,480px)] w-full rounded border border-slate-200"
      />
    </DialogShell>
  );
}
