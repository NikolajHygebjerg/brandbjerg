"use client";

import { CONTRACT_TERMS } from "@/lib/contract-utils";
import type { Contract } from "@/lib/contract-types";
import { SignaturePreview } from "@/components/contracts/signature-pad";

function Row({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="grid gap-1 border-b border-slate-100 py-2 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm text-slate-900">{value}</dd>
    </div>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-2 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd className="text-sm text-slate-900">{value ? "Ja" : "Nej"}</dd>
    </div>
  );
}

export function ContractPrintDocument({ contract }: { contract: Contract }) {
  const f = contract.fields;
  const title = f.ugenummer
    ? `${f.ugenummer} — ${f.navn || "Kontrakt"}`
    : `Kontrakt — ${f.navn || "Brandbjerg Højskole"}`;

  return (
    <div id="contract-print-root" className="contract-print bg-white text-slate-900">
      <header className="border-b border-slate-300 pb-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Kontrakt Brandbjerg Højskole
        </p>
        <h1 className="mt-1 text-2xl font-bold">{title}</h1>
        {contract.courseTitle && (
          <p className="mt-1 text-sm text-slate-600">{contract.courseTitle}</p>
        )}
      </header>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Samarbejdspartner</h2>
        <dl className="mt-2">
          <Row label="Navn" value={f.navn} />
          <Row label="Telefonnummer" value={f.telefon} />
          <Row label="Adresse" value={f.adresse} />
          <Row label="Mail" value={f.email} />
          <Row label="CPR / CVR" value={f.cprCvr} />
          <Row label="Bank" value={f.bank} />
          <Row label="Reg. nr. og kontonr." value={f.regKontonr} />
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Aftale</h2>
        <dl className="mt-2">
          <Row label="Ugenummer" value={f.ugenummer} />
          <Row label="Kursustitel" value={f.kursustitel} />
          <Row label="Dato og tidsramme" value={f.datoTidsramme} />
          <Row label="Timer / honorar" value={f.antalTimerHonorar} />
          <Row label="Indhold" value={f.indhold} />
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Kompensationsdetaljer</h2>
        <dl className="mt-2">
          <Row label="A-indkomst" value={f.aIndkomstHonorar} />
          <Row label="B-indkomst" value={f.bIndkomstHonorar} />
          <Row label="Faktura" value={f.fakturaHonorar} />
          <BoolRow label="Dækker transport" value={f.daekkerTransport} />
          <Row label="Antal km" value={f.transportKm} />
          <BoolRow label="Broafgift" value={f.broafgift} />
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Praktiske detaljer</h2>
        <dl className="mt-2">
          <BoolRow label="Medbringer computer" value={f.medbringerComputer} />
          <BoolRow label="Skal bruge projektor" value={f.skalBrugesProjektor} />
          <Row label="Andet" value={f.andetNoter} />
          <BoolRow label="Samtykke til fotos" value={f.samtykkeFotos} />
          <Row label="Kontaktperson" value={f.kontaktperson} />
        </dl>
      </section>

      <section className="mt-8 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
        {CONTRACT_TERMS}
      </section>

      <section className="mt-8 grid gap-6 sm:grid-cols-2 print:break-inside-avoid">
        <SignaturePreview
          signature={contract.leaderSignature}
          label="Brandbjerg Højskole (kursusleder)"
        />
        <SignaturePreview
          signature={contract.partnerSignature}
          label="Samarbejdspartner"
        />
      </section>
    </div>
  );
}

export function printContract() {
  window.print();
}
