"use client";

import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  defaultMealDetails,
  type MealDetails,
} from "@/lib/mock-data";
import {
  forplejningTyper,
  lokaler,
  specifikationer,
} from "@/lib/kitchen-options";
import {
  createHeldagsturPunkt,
  handleKontraktUpload,
  heldagsturPunktLabels,
  type HeldagsturPlan,
  type HeldagsturPunkt,
  type HeldagsturPunktType,
} from "@/lib/heldagstur-utils";
import { defaultHeldagsturPlan } from "@/lib/heldagstur-utils";

type HeldagsturPlanEditorProps = {
  plan: HeldagsturPlan;
  onChange: (plan: HeldagsturPlan) => void;
};

export function HeldagsturPlanEditor({
  plan,
  onChange,
}: HeldagsturPlanEditorProps) {
  const punkter = plan.punkter;

  function updatePunkter(next: HeldagsturPunkt[]) {
    onChange({ punkter: next });
  }

  function updatePunkt(id: string, patch: Partial<HeldagsturPunkt>) {
    updatePunkter(
      punkter.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  }

  function removePunkt(id: string) {
    updatePunkter(punkter.filter((p) => p.id !== id));
  }

  function addPunkt(type: HeldagsturPunktType) {
    updatePunkter([...punkter, createHeldagsturPunkt(type)]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
        <p className="text-sm font-semibold text-blue-900">Dagsplan for heldagstur</p>
        <p className="mt-1 text-xs text-blue-800">
          Tilføj bus, besøg og måltider med tidspunkter — som moduler i ugeplanen.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["bus", "besoeg", "maltid"] as HeldagsturPunktType[]).map((type) => (
            <Button
              key={type}
              variant="secondary"
              className="h-8 text-xs"
              onClick={() => addPunkt(type)}
            >
              <Plus className="h-3.5 w-3.5" />
              {heldagsturPunktLabels[type]}
            </Button>
          ))}
        </div>
      </div>

      {punkter.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          Ingen punkter endnu — tilføj bus, besøg eller måltid ovenfor.
        </p>
      ) : (
        <ul className="space-y-4">
          {punkter.map((punkt, index) => (
            <li
              key={punkt.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold uppercase text-blue-800">
                    {heldagsturPunktLabels[punkt.type]}
                  </span>
                  <span className="text-xs text-slate-500">#{index + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={punkt.klar}
                      onChange={(e) =>
                        updatePunkt(punkt.id, { klar: e.target.checked })
                      }
                    />
                    Klar
                  </label>
                  <button
                    type="button"
                    onClick={() => removePunkt(punkt.id)}
                    className="rounded p-1 text-red-500 hover:bg-red-50"
                    aria-label="Fjern punkt"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FieldInput
                  label="Tid fra"
                  value={punkt.tidFra}
                  onChange={(v) => updatePunkt(punkt.id, { tidFra: v })}
                />
                <FieldInput
                  label="Tid til"
                  value={punkt.tidTil}
                  onChange={(v) => updatePunkt(punkt.id, { tidTil: v })}
                />
              </div>

              {punkt.type === "bus" && punkt.bus && (
                <BusFields
                  bus={punkt.bus}
                  onChange={(bus) => updatePunkt(punkt.id, { bus })}
                />
              )}

              {punkt.type === "besoeg" && punkt.besoeg && (
                <BesoegFields
                  besoeg={punkt.besoeg}
                  onChange={(besoeg) => updatePunkt(punkt.id, { besoeg })}
                />
              )}

              {punkt.type === "maltid" && (
                <MaltidFields
                  maltid={punkt.maltid ?? defaultMealDetails({ forplejning: "Madpakker" })}
                  onChange={(maltid) => updatePunkt(punkt.id, { maltid })}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BusFields({
  bus,
  onChange,
}: {
  bus: NonNullable<HeldagsturPunkt["bus"]>;
  onChange: (bus: NonNullable<HeldagsturPunkt["bus"]>) => void;
}) {
  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      <FieldInput
        label="Pris (DKK)"
        type="number"
        value={String(bus.pris || "")}
        onChange={(v) => onChange({ ...bus, pris: Number(v) || 0 })}
      />
      <KontraktUpload
        kontrakt={bus.kontrakt}
        onUpload={(k) => onChange({ ...bus, kontrakt: k })}
        onClear={() => onChange({ ...bus, kontrakt: undefined })}
      />
    </div>
  );
}

function BesoegFields({
  besoeg,
  onChange,
}: {
  besoeg: NonNullable<HeldagsturPunkt["besoeg"]>;
  onChange: (b: NonNullable<HeldagsturPunkt["besoeg"]>) => void;
}) {
  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      <FieldInput
        label="Overskrift"
        value={besoeg.overskrift}
        onChange={(v) => onChange({ ...besoeg, overskrift: v })}
      />
      <FieldTextarea
        label="Brødtekst"
        value={besoeg.broedtekst}
        onChange={(v) => onChange({ ...besoeg, broedtekst: v })}
        rows={3}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldInput
          label="Kontaktperson"
          value={besoeg.kontaktperson}
          onChange={(v) => onChange({ ...besoeg, kontaktperson: v })}
        />
        <FieldInput
          label="Kontakttelefon"
          value={besoeg.kontaktTelefon}
          onChange={(v) => onChange({ ...besoeg, kontaktTelefon: v })}
        />
      </div>
      <FieldInput
        label="Pris (DKK)"
        type="number"
        value={String(besoeg.pris || "")}
        onChange={(v) => onChange({ ...besoeg, pris: Number(v) || 0 })}
      />
      <FieldTextarea
        label="Noter"
        value={besoeg.noter}
        onChange={(v) => onChange({ ...besoeg, noter: v })}
        rows={2}
      />
      <KontraktUpload
        kontrakt={besoeg.kontrakt}
        onUpload={(k) => onChange({ ...besoeg, kontrakt: k })}
        onClear={() => onChange({ ...besoeg, kontrakt: undefined })}
      />
    </div>
  );
}

function MaltidFields({
  maltid,
  onChange,
}: {
  maltid: MealDetails;
  onChange: (m: MealDetails) => void;
}) {
  return (
    <div className="mt-3 space-y-3 border-t border-amber-100 bg-amber-50/40 p-3 pt-3">
      <FieldSelect
        label="Forplejning"
        value={maltid.forplejning}
        onChange={(v) => onChange({ ...maltid, forplejning: v })}
        options={forplejningTyper.map((f) => ({ value: f, label: f }))}
      />
      <FieldSelect
        label="Specifikation"
        value={maltid.specifikation}
        onChange={(v) => onChange({ ...maltid, specifikation: v })}
        options={specifikationer.map((s) => ({ value: s, label: s }))}
      />
      <FieldSelect
        label="Lokale"
        value={maltid.lokale}
        onChange={(v) => onChange({ ...maltid, lokale: v })}
        options={[
          { value: "", label: "Vælg lokale…" },
          ...lokaler.map((l) => ({ value: l, label: l })),
        ]}
      />
      <FieldTextarea
        label="Note"
        value={maltid.note}
        onChange={(v) => onChange({ ...maltid, note: v })}
        rows={2}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={maltid.sendesTilKoekken}
          onChange={(e) =>
            onChange({ ...maltid, sendesTilKoekken: e.target.checked })
          }
        />
        Sendes til køkken
      </label>
    </div>
  );
}

function KontraktUpload({
  kontrakt,
  onUpload,
  onClear,
}: {
  kontrakt?: { filnavn: string; uploadedAt: string };
  onUpload: (k: { filnavn: string; uploadedAt: string }) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">Kontrakt</p>
      {kontrakt ? (
        <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
          <span className="truncate text-emerald-900">{kontrakt.filnavn}</span>
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-xs text-red-600 hover:underline"
          >
            Fjern
          </button>
        </div>
      ) : (
        <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 hover:bg-slate-100">
          <Upload className="h-4 w-4" />
          Upload kontrakt (mock)
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleKontraktUpload(file, onUpload);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </label>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-0.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
    <label className="block text-sm">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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

export { defaultHeldagsturPlan };
