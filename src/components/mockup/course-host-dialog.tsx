"use client";

import { useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SendContractPanel } from "@/components/contracts/send-contract-panel";
import type { CourseHostEntry } from "@/lib/course-host-types";
import { hostEntryToContractSource } from "@/lib/course-host-types";
import type { Course, ModuleLon } from "@/lib/mock-data";
import { formatDate } from "@/lib/mock-data";

type CourseHostDialogProps = {
  host: CourseHostEntry;
  course: Pick<Course, "id" | "title" | "weekNumber" | "startDate" | "endDate">;
  open: boolean;
  onClose: () => void;
  onChange: (host: CourseHostEntry) => void;
  onRemove?: () => void;
  isNew?: boolean;
};

export function CourseHostDialog({
  host,
  course,
  open,
  onClose,
  onChange,
  onRemove,
  isNew = false,
}: CourseHostDialogProps) {
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

  function patch(p: Partial<CourseHostEntry>) {
    onChange({ ...host, ...p });
  }

  const defaultDato =
    host.datoTidsramme ||
    (course.startDate && course.endDate
      ? `${formatDate(course.startDate)} – ${formatDate(course.endDate)}`
      : "");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Luk"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="host-dialog-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-emerald-200 bg-emerald-50 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
              Kursusvært · {isNew ? "Ny" : "Rediger"}
            </p>
            <h2 id="host-dialog-title" className="mt-1 text-lg font-semibold text-slate-900">
              {host.navn || "Ny kursusvært"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/80 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput
                label="Navn"
                value={host.navn}
                onChange={(v) => patch({ navn: v })}
                required
              />
              <FieldInput
                label="Mail"
                type="email"
                value={host.email}
                onChange={(v) => patch({ email: v })}
                required
              />
              <FieldSelect
                label="Type"
                value={host.underviserType}
                onChange={(v) =>
                  patch({ underviserType: v as "intern" | "ekstern" })
                }
                options={[
                  { value: "intern", label: "Intern" },
                  { value: "ekstern", label: "Ekstern" },
                ]}
              />
              <FieldSelect
                label="Løn"
                value={host.lon}
                onChange={(v) => patch({ lon: v as ModuleLon })}
                options={[
                  { value: "", label: "Ingen løn" },
                  { value: "A", label: "A-løn" },
                  { value: "B", label: "B-løn" },
                ]}
              />
              <FieldInput
                label="Pris (DKK)"
                type="number"
                value={String(host.pris)}
                onChange={(v) => patch({ pris: Number(v) || 0 })}
              />
              <FieldInput
                label="Overskrift / rolle"
                value={host.overskrift}
                onChange={(v) => patch({ overskrift: v })}
              />
              <FieldInput
                label="Tid fra"
                value={host.tidFra}
                onChange={(v) => patch({ tidFra: v })}
                placeholder="08:30"
              />
              <FieldInput
                label="Tid til"
                value={host.tidTil}
                onChange={(v) => patch({ tidTil: v })}
                placeholder="17:00"
              />
              <div className="sm:col-span-2">
                <FieldTextarea
                  label="Dato(er) og tidsramme (til kontrakt)"
                  value={host.datoTidsramme || defaultDato}
                  onChange={(v) => patch({ datoTidsramme: v })}
                  rows={2}
                  placeholder={defaultDato}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldTextarea
                  label="Indhold / beskrivelse"
                  value={host.broedtekst}
                  onChange={(v) => patch({ broedtekst: v })}
                  rows={3}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldTextarea
                  label="Interne noter"
                  value={host.interneNoter}
                  onChange={(v) => patch({ interneNoter: v })}
                  rows={2}
                />
              </div>
            </div>

            {host.navn.trim() && host.email.trim() && (
              <SendContractPanel
                course={course}
                source={hostEntryToContractSource(host)}
                contextLabel={
                  host.datoTidsramme ||
                  (host.tidFra && host.tidTil
                    ? `${host.tidFra}–${host.tidTil}`
                    : defaultDato)
                }
                linkKind="host"
                linkId={host.id}
                linkLabel={host.overskrift || host.navn}
                onContractSent={(contractId) => patch({ contractId })}
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          {onRemove && !isNew ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Fjern denne kursusvært?")) {
                  onRemove();
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
            >
              <Trash2 className="h-4 w-4" />
              Fjern vært
            </button>
          ) : (
            <span />
          )}
          <Button className="h-9" onClick={onClose}>
            Gem og luk
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </label>
  );
}
