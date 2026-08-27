"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ContractEditor } from "@/components/contracts/contract-editor";
import { useAuth } from "@/context/auth-context";
import {
  CONTRACTS_UPDATED_EVENT,
  getContract,
} from "@/lib/contract-storage";
import type { Contract } from "@/lib/contract-types";
import { contractStatusLabels } from "@/lib/contract-types";

type ContractDialogProps = {
  contractId: string;
  viewOnly?: boolean;
  onClose: () => void;
  onUpdated?: (contract: Contract) => void;
};

export function ContractDialog({
  contractId,
  viewOnly = false,
  onClose,
  onUpdated,
}: ContractDialogProps) {
  const { user } = useAuth();
  const [contract, setContract] = useState(
    () => getContract(contractId) ?? null,
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    function onStorageUpdate() {
      const fresh = getContract(contractId);
      if (fresh) setContract(fresh);
    }
    window.addEventListener(CONTRACTS_UPDATED_EVENT, onStorageUpdate);
    return () =>
      window.removeEventListener(CONTRACTS_UPDATED_EVENT, onStorageUpdate);
  }, [contractId]);

  function handleUpdated(next: Contract) {
    setContract(next);
    onUpdated?.(next);
  }

  if (!contract || !user) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contract-dialog-title"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-800">
              Kontrakt · {contractStatusLabels[contract.status]}
            </p>
            <h2
              id="contract-dialog-title"
              className="mt-1 text-lg font-semibold text-slate-900"
            >
              {contract.fields.navn || "Samarbejdspartner"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {viewOnly
                ? "Gennemse returneret kontrakt"
                : "Tjek oplysningerne inden du sender til foredragsholderen"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Luk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ContractEditor
            contract={contract}
            mode="leader"
            leader={user}
            embedded
            viewOnly={viewOnly}
            initialView={viewOnly ? "preview" : "edit"}
            onUpdated={handleUpdated}
            onSent={onClose}
          />
        </div>
      </div>
    </div>
  );
}
