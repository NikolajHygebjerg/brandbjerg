"use client";

import { useEffect } from "react";
import { CheckCircle2, Trash2, UtensilsCrossed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  defaultMealDetails,
  moduleDurationMinutes,
  timingTotal,
  type CourseModule,
  type MealDetails,
  type ModuleLon,
} from "@/lib/mock-data";
import {
  forplejningTyper,
  lokaler,
  specifikationer,
} from "@/lib/kitchen-options";

type ModuleEditDialogProps = {
  module: CourseModule;
  dayLabel: string;
  open: boolean;
  onClose: () => void;
  onChange: (patch: Partial<CourseModule>) => void;
  onRemove: () => void;
};

export function ModuleEditDialog({
  module: mod,
  dayLabel,
  open,
  onClose,
  onChange,
  onRemove,
}: ModuleEditDialogProps) {
  const isMeal = Boolean(mod.erMaltid);
  const meal = mod.maltid ?? defaultMealDetails();
  const duration = moduleDurationMinutes(mod);
  const timingSum = timingTotal(mod);

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

  function handleRemove() {
    if (window.confirm("Fjern dette modul fra programmet?")) {
      onRemove();
      onClose();
    }
  }

  function updateMeal(patch: Partial<MealDetails>) {
    onChange({ maltid: { ...meal, ...patch } });
  }

  function toggleMeal(checked: boolean) {
    if (checked) {
      onChange({
        erMaltid: true,
        maltid: mod.maltid ?? defaultMealDetails(),
        rolle: mod.rolle || "Køkken",
      });
    } else {
      onChange({ erMaltid: false });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Luk"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="module-dialog-title"
        className={`relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ${
          isMeal ? "ring-2 ring-amber-200" : ""
        }`}
      >
        <div
          className={`flex items-start justify-between gap-4 border-b px-5 py-4 ${
            isMeal
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div>
            <p
              className={`text-xs font-medium uppercase tracking-wide ${
                isMeal ? "text-amber-800" : "text-emerald-700"
              }`}
            >
              {dayLabel} · {mod.tidFra}–{mod.tidTil}
              {isMeal ? " · Måltid" : ""}
            </p>
            <h2
              id="module-dialog-title"
              className="mt-1 text-lg font-semibold text-slate-900"
            >
              {isMeal
                ? meal.forplejning || mod.overskrift || "Måltid"
                : mod.overskrift || "Rediger modul"}
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isMeal ? (
            <MealForm
              mod={mod}
              meal={meal}
              onChange={onChange}
              updateMeal={updateMeal}
              toggleMeal={toggleMeal}
            />
          ) : (
            <RegularForm
              mod={mod}
              duration={duration}
              timingSum={timingSum}
              onChange={onChange}
              toggleMeal={toggleMeal}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
          >
            <Trash2 className="h-4 w-4" />
            Fjern modul
          </button>
          <div className="flex flex-wrap gap-2">
            {!isMeal && (
              <Button
                variant={mod.klar ? "secondary" : "primary"}
                className="h-9"
                onClick={() => onChange({ klar: !mod.klar })}
              >
                {mod.klar ? (
                  "Fjern klar-markering"
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Markér klar
                  </>
                )}
              </Button>
            )}
            <Button variant="secondary" className="h-9" onClick={onClose}>
              Luk
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MealForm({
  mod,
  meal,
  onChange,
  updateMeal,
  toggleMeal,
}: {
  mod: CourseModule;
  meal: MealDetails;
  onChange: (patch: Partial<CourseModule>) => void;
  updateMeal: (patch: Partial<MealDetails>) => void;
  toggleMeal: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <UtensilsCrossed className="h-4 w-4 shrink-0" />
        Forplejning sendes til køkkenets praktiske seddel
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={meal.sendesTilKoekken}
            onChange={(e) =>
              updateMeal({ sendesTilKoekken: e.target.checked })
            }
          />
          Sendes til køkken
        </label>

        <FieldSelect
          label="Forplejning"
          value={meal.forplejning}
          onChange={(v) => updateMeal({ forplejning: v })}
          options={[
            { value: "", label: "Vælg forplejning…" },
            ...forplejningTyper.map((f) => ({ value: f, label: f })),
          ]}
        />
        <FieldSelect
          label="Specifikation"
          value={meal.specifikation}
          onChange={(v) => updateMeal({ specifikation: v })}
          options={[
            { value: "", label: "Vælg specifikation…" },
            ...specifikationer.map((s) => ({ value: s, label: s })),
          ]}
        />
        <FieldInput
          label="Serveres fra kl."
          value={mod.tidFra}
          onChange={(v) => onChange({ tidFra: v })}
          placeholder="07:30"
        />
        <FieldInput
          label="Serveres til kl."
          value={mod.tidTil}
          onChange={(v) => onChange({ tidTil: v })}
          placeholder="08:30"
        />
        <FieldSelect
          label="Lokaler (hvor)"
          value={meal.lokale}
          onChange={(v) => updateMeal({ lokale: v })}
          options={[
            { value: "", label: "Vælg lokale…" },
            ...lokaler.map((l) => ({ value: l, label: l })),
          ]}
        />
        <FieldInput
          label="Overskrift (valgfri)"
          value={mod.overskrift}
          onChange={(v) => onChange({ overskrift: v })}
        />
        <div className="sm:col-span-2">
          <FieldTextarea
            label="Noter til køkken"
            value={meal.note}
            onChange={(v) => updateMeal({ note: v })}
            rows={4}
            placeholder="Fx: Brød + humus + gulerødder, kaffe med på tur…"
          />
        </div>

        <label className="sm:col-span-2">
          <button
            type="button"
            onClick={() => toggleMeal(false)}
            className="text-sm text-slate-500 underline hover:text-slate-700"
          >
            Konverter til almindeligt modul
          </button>
        </label>
      </div>
    </div>
  );
}

function RegularForm({
  mod,
  duration,
  timingSum,
  onChange,
  toggleMeal,
}: {
  mod: CourseModule;
  duration: number;
  timingSum: number;
  onChange: (patch: Partial<CourseModule>) => void;
  toggleMeal: (checked: boolean) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FieldInput
        label="Overskrift"
        value={mod.overskrift}
        onChange={(v) => onChange({ overskrift: v })}
      />
      <FieldSelect
        label="Rolle"
        value={mod.rolle}
        onChange={(v) => onChange({ rolle: v })}
        options={[
          { value: "", label: "Vælg rolle…" },
          { value: "Kursusleder", label: "Kursusleder" },
          { value: "Foredragsholder", label: "Foredragsholder" },
          { value: "Køkken", label: "Køkken" },
          { value: "Vært", label: "Vært" },
        ]}
      />
      <FieldInput
        label="Underviser / ansvarlig"
        value={mod.underviser}
        onChange={(v) => onChange({ underviser: v })}
      />
      <FieldSelect
        label="Undervisertype"
        value={mod.underviserType}
        onChange={(v) =>
          onChange({ underviserType: v as "intern" | "ekstern" })
        }
        options={[
          { value: "intern", label: "Intern underviser" },
          { value: "ekstern", label: "Ekstern underviser" },
        ]}
      />
      <FieldSelect
        label="Løn (foredragsholder)"
        value={mod.lon}
        onChange={(v) => onChange({ lon: v as ModuleLon })}
        options={[
          { value: "", label: "Ingen løn" },
          { value: "A", label: "A-løn" },
          { value: "B", label: "B-løn" },
        ]}
      />
      <FieldInput
        label="Pris (DKK)"
        type="number"
        value={String(mod.pris)}
        onChange={(v) => onChange({ pris: Number(v) })}
      />
      <FieldInput
        label="Tid fra"
        value={mod.tidFra}
        onChange={(v) => onChange({ tidFra: v })}
      />
      <FieldInput
        label="Tid til"
        value={mod.tidTil}
        onChange={(v) => onChange({ tidTil: v })}
      />
      <div className="sm:col-span-2">
        <FieldTextarea
          label="Brødtekst til hjemmesiden"
          value={mod.broedtekst}
          onChange={(v) => onChange({ broedtekst: v })}
          rows={3}
        />
      </div>
      <div className="sm:col-span-2">
        <FieldTextarea
          label="Interne noter"
          value={mod.interneNoter}
          onChange={(v) => onChange({ interneNoter: v })}
          rows={2}
        />
      </div>
      <FieldInput
        label="Ønsker til pedel"
        value={mod.onskerPedel}
        onChange={(v) => onChange({ onskerPedel: v })}
      />
      <FieldInput
        label="Ønsker til køkken"
        value={mod.onskerKoekken}
        onChange={(v) => onChange({ onskerKoekken: v })}
      />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={Boolean(mod.erMaltid)}
          onChange={(e) => toggleMeal(e.target.checked)}
        />
        Måltid / forplejning (vises for køkkenet)
      </label>

      {!mod.erMaltid && (
        <div className="sm:col-span-2 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">
            UBAK — minutter i modulet
          </p>
          <p className="text-xs text-slate-500">
            Modulvarighed: {duration} min · Fordeling i alt: {timingSum} min
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <TimingField
              label="UBAK"
              value={mod.timing.ubak}
              onChange={(v) =>
                onChange({ timing: { ...mod.timing, ubak: v } })
              }
            />
            <TimingField
              label="FT"
              value={mod.timing.ft}
              onChange={(v) => onChange({ timing: { ...mod.timing, ft: v } })}
            />
            <TimingField
              label="PTS"
              value={mod.timing.pts}
              onChange={(v) =>
                onChange({ timing: { ...mod.timing, pts: v } })
              }
            />
            <TimingField
              label="BH"
              value={mod.timing.bh}
              onChange={(v) => onChange({ timing: { ...mod.timing, bh: v } })}
            />
          </div>
        </div>
      )}
    </div>
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

function TimingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </div>
  );
}
