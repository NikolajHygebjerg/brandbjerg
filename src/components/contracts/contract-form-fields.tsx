"use client";

import type { ContractFields, HonorarType } from "@/lib/contract-types";

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
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
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
      />
    </label>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  rows = 3,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <textarea
        value={value}
        disabled={disabled}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
      />
    </label>
  );
}

function FieldCheckbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <span>{label}</span>
    </label>
  );
}

type ContractFormFieldsProps = {
  fields: ContractFields;
  onChange: (fields: ContractFields) => void;
  disabled?: boolean;
  requiredNameEmail?: boolean;
};

export function ContractFormFields({
  fields,
  onChange,
  disabled = false,
  requiredNameEmail = false,
}: ContractFormFieldsProps) {
  function patch(p: Partial<ContractFields>) {
    onChange({ ...fields, ...p });
  }

  function setHonorarType(type: HonorarType) {
    patch({ honorarType: type });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Samarbejdspartner
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldInput
            label="Navn"
            value={fields.navn}
            onChange={(v) => patch({ navn: v })}
            disabled={disabled}
            required={requiredNameEmail}
          />
          <FieldInput
            label="Mail"
            type="email"
            value={fields.email}
            onChange={(v) => patch({ email: v })}
            disabled={disabled}
            required={requiredNameEmail}
          />
          <FieldInput
            label="Telefonnummer"
            value={fields.telefon}
            onChange={(v) => patch({ telefon: v })}
            disabled={disabled}
          />
          <FieldInput
            label="Adresse, postnummer, by"
            value={fields.adresse}
            onChange={(v) => patch({ adresse: v })}
            disabled={disabled}
          />
          <FieldInput
            label="CPR (ved løn) / CVR (ved faktura)"
            value={fields.cprCvr}
            onChange={(v) => patch({ cprCvr: v })}
            disabled={disabled}
          />
          <FieldInput
            label="Bank"
            value={fields.bank}
            onChange={(v) => patch({ bank: v })}
            disabled={disabled}
          />
          <FieldInput
            label="Reg. nr. og kontonummer"
            value={fields.regKontonr}
            onChange={(v) => patch({ regKontonr: v })}
            disabled={disabled}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Aftale
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldInput
            label="Ugenummer"
            value={fields.ugenummer}
            onChange={(v) => patch({ ugenummer: v })}
            disabled={disabled}
          />
          <FieldInput
            label="Kursustitel"
            value={fields.kursustitel}
            onChange={(v) => patch({ kursustitel: v })}
            disabled={disabled}
          />
          <div className="sm:col-span-2">
            <FieldTextarea
              label="Dato(er) og tidsramme"
              value={fields.datoTidsramme}
              onChange={(v) => patch({ datoTidsramme: v })}
              disabled={disabled}
              rows={2}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldInput
              label="Antal undervisningstimer / honorar"
              value={fields.antalTimerHonorar}
              onChange={(v) => patch({ antalTimerHonorar: v })}
              disabled={disabled}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldTextarea
              label="Indhold"
              value={fields.indhold}
              onChange={(v) => patch({ indhold: v })}
              disabled={disabled}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Kompensationsdetaljer
        </h3>
        <div className="flex flex-wrap gap-2">
          {(["A", "B", "faktura"] as HonorarType[]).map((type) => (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => setHonorarType(type)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                fields.honorarType === type
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {type === "A"
                ? "A-indkomst"
                : type === "B"
                  ? "B-indkomst"
                  : "Faktura"}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldInput
            label="A-indkomst honorarbeløb"
            value={fields.aIndkomstHonorar}
            onChange={(v) => patch({ aIndkomstHonorar: v, honorarType: "A" })}
            disabled={disabled}
          />
          <FieldInput
            label="B-indkomst honorarbeløb"
            value={fields.bIndkomstHonorar}
            onChange={(v) => patch({ bIndkomstHonorar: v, honorarType: "B" })}
            disabled={disabled}
          />
          <FieldInput
            label="Faktura honorarbeløb"
            value={fields.fakturaHonorar}
            onChange={(v) =>
              patch({ fakturaHonorar: v, honorarType: "faktura" })
            }
            disabled={disabled}
          />
        </div>
        <p className="text-xs text-slate-500">
          Beløb for A- og B-indkomst er inkl. feriepenge.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldCheckbox
            label="Dækker Brandbjerg transport?"
            checked={fields.daekkerTransport}
            onChange={(v) => patch({ daekkerTransport: v })}
            disabled={disabled}
          />
          <FieldInput
            label="Antal km (transport)"
            value={fields.transportKm}
            onChange={(v) => patch({ transportKm: v })}
            disabled={disabled}
          />
          <FieldCheckbox
            label="Broafgift — marker hvis dokumentation eftersendes"
            checked={fields.broafgift}
            onChange={(v) => patch({ broafgift: v })}
            disabled={disabled}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Praktiske detaljer
        </h3>
        <div className="space-y-3">
          <FieldCheckbox
            label="Medbringer egen computer"
            checked={fields.medbringerComputer}
            onChange={(v) => patch({ medbringerComputer: v })}
            disabled={disabled}
          />
          <FieldCheckbox
            label="Skal bruge projektor"
            checked={fields.skalBrugesProjektor}
            onChange={(v) => patch({ skalBrugesProjektor: v })}
            disabled={disabled}
          />
          <FieldTextarea
            label="Andet / særlige aftaler (teknik, IT, lys, lyd)"
            value={fields.andetNoter}
            onChange={(v) => patch({ andetNoter: v })}
            disabled={disabled}
          />
          <FieldCheckbox
            label="Jeg giver samtykke til at Brandbjerg må uploade portræt- og situationsbilleder til brug på hjemmeside og sociale medier"
            checked={fields.samtykkeFotos}
            onChange={(v) => patch({ samtykkeFotos: v })}
            disabled={disabled}
          />
        </div>
      </section>

      <section>
        <FieldInput
          label="Din kontaktperson på Brandbjerg"
          value={fields.kontaktperson}
          onChange={(v) => patch({ kontaktperson: v })}
          disabled={disabled}
        />
      </section>
    </div>
  );
}
