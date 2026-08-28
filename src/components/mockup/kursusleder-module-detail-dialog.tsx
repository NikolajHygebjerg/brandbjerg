"use client";

import { useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LokaleSetupReferencePhotos } from "@/components/mockup/lokale-setup-reference-photos";
import { punktDisplayTitle } from "@/lib/heldagstur-utils";
import {
  formatDate,
  isHeldagsturModule,
  isWorkshopModule,
  type Course,
  type CourseDay,
  type CourseModule,
} from "@/lib/mock-data";
import { moduleUnderviserLabel } from "@/lib/module-display-utils";
import { resolveModuleLokaleSpec } from "@/lib/lokale-spec-utils";
import { visibleWorkshopOptions } from "@/lib/workshop-utils";

type KursuslederModuleDetailDialogProps = {
  open: boolean;
  course: Course;
  day: CourseDay;
  module: CourseModule;
  onClose: () => void;
  hideInterneNoter?: boolean;
};

export function KursuslederModuleDetailDialog({
  open,
  course,
  day,
  module: mod,
  onClose,
  hideInterneNoter = false,
}: KursuslederModuleDetailDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const ansvarlig = moduleUnderviserLabel(mod);
  const lokaleSpec = resolveModuleLokaleSpec(course, mod);
  const isMeal = Boolean(mod.erMaltid);
  const isWorkshops = isWorkshopModule(mod);
  const isHeldagstur = isHeldagsturModule(mod);
  const meal = mod.maltid;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`flex items-start justify-between border-b px-5 py-4 ${
            isMeal
              ? "border-amber-200 bg-amber-50"
              : isHeldagstur
                ? "border-blue-200 bg-blue-50"
                : isWorkshops
                  ? "border-violet-200 bg-violet-50"
                  : "border-teal-200 bg-teal-50"
          }`}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-800">
              {day.label} · {formatDate(day.date)}
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900">
              {mod.overskrift || "Modul"}
            </h2>
            <p className="mt-0.5 text-sm tabular-nums text-slate-600">
              Kl. {mod.tidFra}–{mod.tidTil}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/60"
            aria-label="Luk"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {ansvarlig && (
            <DetailRow label="Ansvarlig" value={ansvarlig} />
          )}
          {mod.underviserEmail && (
            <DetailRow label="E-mail" value={mod.underviserEmail} />
          )}
          {mod.rolle && mod.underviser && (
            <DetailRow label="Rolle" value={mod.rolle} />
          )}

          {mod.broedtekst.trim() && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Beskrivelse
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {mod.broedtekst}
              </p>
            </div>
          )}

          {isMeal && meal && (
            <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                Forplejning
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <DetailRow label="Type" value={meal.forplejning} inline />
                <DetailRow label="Specifikation" value={meal.specifikation} inline />
                {meal.lokale && (
                  <DetailRow label="Lokale" value={meal.lokale} inline />
                )}
                {meal.antalPersoner > 0 && (
                  <DetailRow
                    label="Antal personer"
                    value={String(meal.antalPersoner)}
                    inline
                  />
                )}
                {meal.note.trim() && (
                  <DetailRow label="Note" value={meal.note} inline />
                )}
              </dl>
            </section>
          )}

          {isWorkshops && (
            <section className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-800">
                Workshops
              </p>
              <ul className="mt-3 space-y-2">
                {visibleWorkshopOptions(mod).map((opt) => (
                  <li
                    key={opt.id}
                    className="rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-slate-900">{opt.overskrift}</p>
                    {opt.underviser && (
                      <p className="text-xs text-slate-600">{opt.underviser}</p>
                    )}
                    {opt.broedtekst && (
                      <p className="mt-1 text-xs text-slate-600">{opt.broedtekst}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isHeldagstur && mod.heldagstur && (
            <section className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
                Heldagstur — dagsplan
              </p>
              <ul className="mt-3 space-y-2">
                {mod.heldagstur.punkter.map((punkt) => (
                  <li
                    key={punkt.id}
                    className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-slate-900">
                      {punktDisplayTitle(punkt)}
                    </p>
                    <p className="text-xs tabular-nums text-slate-500">
                      {punkt.tidFra}–{punkt.tidTil}
                    </p>
                    {punkt.type === "besoeg" && punkt.besoeg?.broedtekst && (
                      <p className="mt-1 text-xs text-slate-600">
                        {punkt.besoeg.broedtekst}
                      </p>
                    )}
                    {punkt.type === "besoeg" && punkt.besoeg?.kontaktperson && (
                      <p className="mt-1 text-xs text-slate-500">
                        Kontakt: {punkt.besoeg.kontaktperson}
                        {punkt.besoeg.kontaktTelefon
                          ? ` · ${punkt.besoeg.kontaktTelefon}`
                          : ""}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!isMeal && lokaleSpec.lokale.trim() && (
            <section className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                <MapPin className="size-3.5" />
                Lokale
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <DetailRow label="Lokale" value={lokaleSpec.lokale} inline />
                {lokaleSpec.antalPersoner > 0 && (
                  <DetailRow
                    label="Antal personer"
                    value={String(lokaleSpec.antalPersoner)}
                    inline
                  />
                )}
                {lokaleSpec.bordopstilling && (
                  <DetailRow
                    label="Bordopstilling"
                    value={lokaleSpec.bordopstilling}
                    inline
                  />
                )}
                {lokaleSpec.noter.trim() && (
                  <DetailRow label="Noter" value={lokaleSpec.noter} inline />
                )}
              </dl>
              <div className="mt-3">
                <LokaleSetupReferencePhotos spec={lokaleSpec} />
              </div>
            </section>
          )}

          {!hideInterneNoter && mod.interneNoter.trim() && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Interne noter
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {mod.interneNoter}
              </p>
            </div>
          )}

          {mod.ubakBeskrivelse?.trim() && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                UBAK-beskrivelse
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {mod.ubakBeskrivelse}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-right">
          <Button variant="secondary" onClick={onClose}>
            Luk
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  inline = false,
}: {
  label: string;
  value: string;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div className="flex gap-3">
        <dt className="w-32 shrink-0 text-slate-500">{label}</dt>
        <dd className="font-medium text-slate-900">{value}</dd>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
