"use client";

import { lokaler } from "@/lib/kitchen-options";
import {
  bordopstillinger,
  ugedage,
} from "@/lib/lokale-spec-options";
import type { LokaleSpecifikation } from "@/lib/mock-data";

type LokaleSpecFormProps = {
  spec: LokaleSpecifikation;
  onChange: (patch: Partial<LokaleSpecifikation>) => void;
  /** Vis modul-specifikke noter (skjult på kursus-niveau) */
  showModuleNoter?: boolean;
};

export function LokaleSpecForm({
  spec,
  onChange,
  showModuleNoter = true,
}: LokaleSpecFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FieldSelect
        label="Lokaler"
        value={spec.lokale}
        onChange={(v) => onChange({ lokale: v })}
        options={[
          { value: "", label: "Vælg lokale…" },
          ...lokaler.map((l) => ({ value: l, label: l })),
        ]}
      />
      <FieldInput
        label="Antal personer"
        type="number"
        value={String(spec.antalPersoner || "")}
        onChange={(v) => onChange({ antalPersoner: Number(v) || 0 })}
      />
      <FieldSelect
        label="Bordopstilling"
        value={spec.bordopstilling}
        onChange={(v) => onChange({ bordopstilling: v })}
        options={bordopstillinger.map((b) => ({ value: b, label: b }))}
      />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={spec.skalBrugesFlereDage}
          onChange={(e) => onChange({ skalBrugesFlereDage: e.target.checked })}
        />
        Skal bruges flere dage
      </label>

      {spec.skalBrugesFlereDage && (
        <>
          <div className="sm:col-span-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
            <p className="text-xs font-semibold text-blue-900">Klar fra</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <FieldSelect
                label="Ugedag"
                value={spec.klarFraUgedag}
                onChange={(v) => onChange({ klarFraUgedag: v })}
                options={[
                  { value: "", label: "Vælg ugedag…" },
                  ...ugedage.map((u) => ({ value: u, label: u })),
                ]}
              />
              <FieldInput
                label="Kl."
                value={spec.klarFraKl}
                onChange={(v) => onChange({ klarFraKl: v })}
                placeholder="11:00"
              />
            </div>
          </div>
          <div className="sm:col-span-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
            <p className="text-xs font-semibold text-blue-900">Ledig fra</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <FieldSelect
                label="Ugedag"
                value={spec.ledigFraUgedag}
                onChange={(v) => onChange({ ledigFraUgedag: v })}
                options={[
                  { value: "", label: "Vælg ugedag…" },
                  ...ugedage.map((u) => ({ value: u, label: u })),
                ]}
              />
              <FieldInput
                label="Kl."
                value={spec.ledigFraKl}
                onChange={(v) => onChange({ ledigFraKl: v })}
                placeholder="13:30"
              />
            </div>
          </div>
        </>
      )}

      <div className="sm:col-span-2 grid gap-2 sm:grid-cols-2">
        <CheckboxField
          label="Dug"
          checked={spec.dug}
          onChange={(v) => onChange({ dug: v })}
        />
        <CheckboxField
          label="Levende lys"
          checked={spec.levendeLys}
          onChange={(v) => onChange({ levendeLys: v })}
        />
        <CheckboxField
          label="Blomster"
          checked={spec.blomster}
          onChange={(v) => onChange({ blomster: v })}
        />
        <CheckboxField
          label="Stor whiteboard"
          checked={spec.storWhiteboard}
          onChange={(v) => onChange({ storWhiteboard: v })}
        />
        <CheckboxField
          label="Flipover/whiteboard"
          checked={spec.flipoverWhiteboard}
          onChange={(v) => onChange({ flipoverWhiteboard: v })}
        />
        <CheckboxField
          label="Projektor"
          checked={spec.projektor}
          onChange={(v) => onChange({ projektor: v })}
        />
        <CheckboxField
          label="Mobil lærred + projektor"
          checked={spec.mobilLaerredProjektor}
          onChange={(v) => onChange({ mobilLaerredProjektor: v })}
        />
        <CheckboxField
          label="Mobil lydanlæg"
          checked={spec.mobilLydanlaeg}
          onChange={(v) => onChange({ mobilLydanlaeg: v })}
        />
      </div>

      {showModuleNoter && (
        <div className="sm:col-span-2">
          <FieldTextarea
            label="Noter"
            value={spec.noter}
            onChange={(v) => onChange({ noter: v })}
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

function FieldInput({
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

function FieldTextarea({
  label,
  value,
  onChange,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </div>
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
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value || "empty"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export { FieldTextarea };
