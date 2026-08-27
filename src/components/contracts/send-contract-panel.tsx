"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import type { Course } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { FileSignature } from "lucide-react";
import { ContractDialog } from "@/components/contracts/contract-dialog";
import {
  CONTRACTS_UPDATED_EVENT,
  getContract,
} from "@/lib/contract-storage";
import type { ContractSourceData } from "@/lib/contract-utils";
import {
  createContract,
  defaultContractFields,
  prefillFromSource,
} from "@/lib/contract-utils";

type SendContractPanelProps = {
  course: Pick<Course, "id" | "title" | "weekNumber" | "startDate" | "endDate">;
  source: ContractSourceData;
  contextLabel?: string;
  linkKind: "module" | "host";
  linkId?: string;
  linkLabel?: string;
  onContractSent?: (contractId: string) => void;
};

export function SendContractPanel({
  course,
  source,
  contextLabel,
  linkKind,
  linkId,
  linkLabel,
  onContractSent,
}: SendContractPanelProps) {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);
  const [openContractId, setOpenContractId] = useState<string | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  useEffect(() => {
    function onUpdate() {
      setTick((t) => t + 1);
    }
    window.addEventListener(CONTRACTS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CONTRACTS_UPDATED_EVENT, onUpdate);
  }, []);

  if (!user) return null;

  if (!source.navn.trim() && !source.email.trim()) return null;

  const existing = source.contractId ? getContract(source.contractId) : null;
  void tick;
  const isReturned = existing?.status === "returneret";

  function ensureContractId(): string | null {
    if (!user) return null;
    if (!source.navn.trim() || !source.email.trim()) {
      window.alert("Indtast navn og mail først.");
      return null;
    }

    if (source.contractId) {
      const current = getContract(source.contractId);
      if (current && current.status !== "returneret") {
        return current.id;
      }
    }

    const contract = createContract({
      leader: user,
      fields: {
        ...defaultContractFields(),
        ...prefillFromSource(course, source, contextLabel),
        navn: source.navn,
        email: source.email,
      },
      courseId: course.id,
      courseTitle: course.title,
      moduleId: linkKind === "module" ? linkId : undefined,
      hostEntryId: linkKind === "host" ? linkId : undefined,
      moduleLabel: linkLabel ?? (source.overskrift || source.navn),
    });

    onContractSent?.(contract.id);
    return contract.id;
  }

  function handleSendContract() {
    const id = ensureContractId();
    if (!id) return;
    setViewOnly(false);
    setOpenContractId(id);
  }

  function handleViewContract() {
    if (!source.contractId) return;
    setViewOnly(true);
    setOpenContractId(source.contractId);
  }

  return (
    <>
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
        <div className="flex items-start gap-2">
          <FileSignature className="mt-0.5 h-4 w-4 shrink-0 text-violet-800" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-violet-950">Kontrakt</p>
            <p className="mt-1 text-xs text-violet-800">
              {isReturned
                ? "Kontrakten er returneret."
                : "Send kontrakt med dato, tid, pris og løntype udfyldt automatisk."}
            </p>
            {existing && !isReturned && (
              <p className="mt-2 text-xs font-medium text-violet-900">
                Kontrakt oprettet{" "}
                {new Date(existing.createdAt).toLocaleDateString("da-DK")}
                {existing.status === "sendt" ? " · afventer svar" : ""}
              </p>
            )}
            {isReturned && existing?.returnedAt && (
              <p className="mt-2 text-xs font-medium text-emerald-800">
                Returneret{" "}
                {new Date(existing.returnedAt).toLocaleDateString("da-DK")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {isReturned ? (
                <Button
                  variant="secondary"
                  className="h-8 border-violet-300 bg-white text-xs text-violet-900 hover:bg-violet-100"
                  onClick={handleViewContract}
                >
                  Se kontrakt
                </Button>
              ) : (
                <Button className="h-8 text-xs" onClick={handleSendContract}>
                  Send kontrakt
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {openContractId && (
        <ContractDialog
          contractId={openContractId}
          viewOnly={viewOnly}
          onClose={() => setOpenContractId(null)}
          onUpdated={() => setTick((t) => t + 1)}
        />
      )}
    </>
  );
}
