"use client";

import { useAuth } from "@/context/auth-context";
import type { Course, CourseModule } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { FileSignature } from "lucide-react";
import Link from "next/link";
import { getContract } from "@/lib/contract-storage";
import {
  createContract,
  defaultContractFields,
  prefillFromModule,
} from "@/lib/contract-utils";

type SendContractFromModuleProps = {
  course: Pick<Course, "id" | "title" | "weekNumber">;
  module: CourseModule;
  dayLabel: string;
  onContractSent?: (contractId: string) => void;
};

export function SendContractFromModule({
  course,
  module,
  dayLabel,
  onContractSent,
}: SendContractFromModuleProps) {
  const { user } = useAuth();

  if (!user) return null;

  const isSpeaker =
    module.rolle === "Foredragsholder" ||
    module.underviserType === "ekstern" ||
    Boolean(module.lon);

  if (!isSpeaker) return null;

  const existing = module.contractId ? getContract(module.contractId) : null;

  function handleSend() {
    if (!user) return;
    if (!module.underviser.trim() || !module.underviserEmail.trim()) {
      window.alert("Indtast navn og mail på foredragsholderen først.");
      return;
    }

    const contract = createContract({
      leader: user,
      fields: {
        ...defaultContractFields(),
        ...prefillFromModule(course, module, dayLabel),
        navn: module.underviser,
        email: module.underviserEmail,
      },
      courseId: course.id,
      courseTitle: course.title,
      moduleId: module.id,
      moduleLabel: module.overskrift || module.underviser,
    });

    onContractSent?.(contract.id);
    window.location.href = `/kursusleder/kontrakter/${contract.id}`;
  }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
      <div className="flex items-start gap-2">
        <FileSignature className="mt-0.5 h-4 w-4 shrink-0 text-violet-800" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-violet-950">Kontrakt</p>
          <p className="mt-1 text-xs text-violet-800">
            Send kontrakt til foredragsholder med dato, tid, pris og løntype
            udfyldt automatisk.
          </p>
          {existing && (
            <p className="mt-2 text-xs font-medium text-violet-900">
              Eksisterende kontrakt oprettet{" "}
              {new Date(existing.createdAt).toLocaleDateString("da-DK")}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button className="h-8 text-xs" onClick={handleSend}>
              Send kontrakt
            </Button>
            {existing && (
              <Link
                href={`/kursusleder/kontrakter/${existing.id}`}
                className="inline-flex h-8 items-center rounded-lg border border-violet-300 bg-white px-3 text-xs font-medium text-violet-900 hover:bg-violet-100"
              >
                Åbn kontrakt
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
