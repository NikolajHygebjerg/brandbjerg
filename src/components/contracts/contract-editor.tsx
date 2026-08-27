"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ContractFormFields } from "@/components/contracts/contract-form-fields";
import {
  ContractPrintDocument,
  printContract,
} from "@/components/contracts/contract-print-document";
import { SignaturePad, SignaturePreview } from "@/components/contracts/signature-pad";
import type { Contract } from "@/lib/contract-types";
import { contractStatusLabels } from "@/lib/contract-types";
import {
  buildContractMailto,
  contractPublicUrl,
  duplicateContract,
  returnContractFromPartner,
  signContractAsLeader,
  updateContractFields,
} from "@/lib/contract-utils";
import type { User } from "@/lib/auth-types";

type ContractEditorProps = {
  contract: Contract;
  mode: "leader" | "partner";
  leader?: Pick<User, "id" | "name" | "email">;
  onUpdated: (contract: Contract) => void;
  backHref?: string;
  backLabel?: string;
  embedded?: boolean;
  viewOnly?: boolean;
  initialView?: "edit" | "preview";
  onSent?: () => void;
};

export function ContractEditor({
  contract: initial,
  mode,
  leader,
  onUpdated,
  backHref,
  backLabel,
  embedded = false,
  viewOnly = false,
  initialView = "edit",
  onSent,
}: ContractEditorProps) {
  const [contract, setContract] = useState(initial);
  const [fields, setFields] = useState(initial.fields);
  const [leaderSig, setLeaderSig] = useState(initial.leaderSignature?.dataUrl ?? "");
  const [partnerSig, setPartnerSig] = useState(initial.partnerSignature?.dataUrl ?? "");
  const [view, setView] = useState<"edit" | "preview">(initialView);
  const [error, setError] = useState("");

  const partnerLocked =
    mode === "partner" && contract.status === "returneret";
  const leaderCanEdit =
    !viewOnly &&
    mode === "leader" &&
    (contract.status === "kladde" || contract.status === "returneret");
  const partnerCanEdit = mode === "partner" && !partnerLocked;
  const canEditFields =
    mode === "leader" ? leaderCanEdit : partnerCanEdit;

  function refresh(next: Contract) {
    setContract(next);
    setFields(next.fields);
    onUpdated(next);
  }

  function validateRequired(): boolean {
    if (!fields.navn.trim() || !fields.email.trim()) {
      setError("Navn og mail skal udfyldes.");
      return false;
    }
    setError("");
    return true;
  }

  function handleSaveDraft() {
    if (!validateRequired()) return;
    refresh(updateContractFields(contract, fields));
  }

  function handleLeaderSend() {
    if (!validateRequired()) return;
    if (!leaderSig) {
      setError("Du skal underskrive kontrakten før udsendelse.");
      return;
    }
    const signed = signContractAsLeader(contract, {
      dataUrl: leaderSig,
      signedAt: new Date().toISOString(),
      signedByName: leader?.name ?? contract.leaderName,
    }, fields);
    refresh(signed);
    window.location.href = buildContractMailto(signed);
    onSent?.();
  }

  function handlePartnerReturn() {
    if (!validateRequired()) return;
    if (!partnerSig) {
      setError("Du skal underskrive kontrakten før afsendelse.");
      return;
    }
    const returned = returnContractFromPartner(contract, {
      dataUrl: partnerSig,
      signedAt: new Date().toISOString(),
      signedByName: fields.navn,
    }, fields);
    refresh(returned);
  }

  function handleCopyLink() {
    void navigator.clipboard.writeText(contractPublicUrl(contract.accessToken));
    window.alert("Link kopieret til udklipsholder.");
  }

  function handleDuplicate() {
    if (!leader) return;
    const copy = duplicateContract(contract, leader);
    window.location.href = `/kursusleder/kontrakter/${copy.id}`;
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      {!embedded && backHref && (
        <Link href={backHref} className="text-sm text-emerald-700 hover:underline">
          {backLabel ?? "← Tilbage"}
        </Link>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {!embedded && (
            <>
              <h1 className="text-2xl font-bold text-slate-900">
                {fields.navn || "Ny kontrakt"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {fields.kursustitel || "Brandbjerg Højskole — samarbejdskontrakt"}
              </p>
            </>
          )}
          {!embedded && (
            <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {contractStatusLabels[contract.status]}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!viewOnly && (
            <Button
              variant="secondary"
              className="h-9"
              onClick={() => setView(view === "edit" ? "preview" : "edit")}
            >
              {view === "edit" ? "Forhåndsvisning" : "Rediger"}
            </Button>
          )}
          <Button variant="secondary" className="h-9" onClick={() => printContract()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          {!embedded && mode === "leader" && contract.status !== "kladde" && (
            <>
              <Button variant="secondary" className="h-9" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
                Kopiér link
              </Button>
              <Button
                variant="secondary"
                className="h-9"
                onClick={() => {
                  window.location.href = buildContractMailto(contract);
                }}
              >
                <Mail className="h-4 w-4" />
                Send mail igen
              </Button>
            </>
          )}
          {!embedded && mode === "leader" && leader && (
            <Button variant="secondary" className="h-9" onClick={handleDuplicate}>
              Kopiér som ny kontrakt
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardDescription className="text-red-800">{error}</CardDescription>
        </Card>
      )}

      {view === "preview" || viewOnly ? (
        <>
          <Card className="p-6">
            <ContractPrintDocument contract={{ ...contract, fields }} />
          </Card>
          {viewOnly && (
            <div className="grid gap-4 sm:grid-cols-2">
              {contract.leaderSignature && (
                <SignaturePreview
                  signature={contract.leaderSignature}
                  label="Kursuslederens underskrift"
                />
              )}
              {contract.partnerSignature && (
                <SignaturePreview
                  signature={contract.partnerSignature}
                  label="Samarbejdspartnerens underskrift"
                />
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <Card className="p-6">
            <ContractFormFields
              fields={fields}
              onChange={setFields}
              disabled={!canEditFields}
              requiredNameEmail={mode === "leader"}
            />
          </Card>

          {mode === "leader" && leaderCanEdit && (
            <Card className="p-6">
              <CardTitle className="text-base">Din underskrift (kursusleder)</CardTitle>
              <CardDescription className="mt-1">
                Underskriv før du sender kontrakten til {fields.navn || "samarbejdspartneren"}.
              </CardDescription>
              <div className="mt-4">
                <SignaturePad value={leaderSig} onChange={setLeaderSig} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" className="h-9" onClick={handleSaveDraft}>
                  Gem kladde
                </Button>
                <Button className="h-9" onClick={handleLeaderSend}>
                  <Mail className="h-4 w-4" />
                  Underskriv og send mail
                </Button>
              </div>
            </Card>
          )}

          {mode === "leader" && contract.leaderSignature && (
            <SignaturePreview
              signature={contract.leaderSignature}
              label="Kursuslederens underskrift"
            />
          )}

          {mode === "partner" && (
            <Card className="p-6">
              <CardTitle className="text-base">Din underskrift</CardTitle>
              <CardDescription className="mt-1">
                Ret felterne efter behov, underskriv og send kontrakten tilbage til{" "}
                {contract.leaderName}.
              </CardDescription>
              <div className="mt-4">
                <SignaturePad
                  value={partnerSig}
                  onChange={setPartnerSig}
                  disabled={partnerLocked}
                />
              </div>
              {!partnerLocked && (
                <Button className="mt-4 h-9" onClick={handlePartnerReturn}>
                  Underskriv og send tilbage til kursusleder
                </Button>
              )}
              {partnerLocked && (
                <p className="mt-4 text-sm font-medium text-emerald-700">
                  Kontrakten er sendt tilbage. Tak fordi du udfyldte den.
                </p>
              )}
            </Card>
          )}

          {contract.partnerSignature && (
            <SignaturePreview
              signature={contract.partnerSignature}
              label="Samarbejdspartnerens underskrift"
            />
          )}
        </>
      )}

      <div className="hidden print:block">
        <ContractPrintDocument contract={{ ...contract, fields }} />
      </div>
    </div>
  );
}
