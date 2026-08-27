"use client";

import { SendContractPanel } from "@/components/contracts/send-contract-panel";
import type { Course, CourseModule } from "@/lib/mock-data";

type SendContractFromModuleProps = {
  course: Pick<Course, "id" | "title" | "weekNumber" | "startDate" | "endDate">;
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
  const isSpeaker =
    module.rolle === "Foredragsholder" ||
    module.underviserType === "ekstern" ||
    Boolean(module.lon);

  if (!isSpeaker) return null;

  return (
    <SendContractPanel
      course={course}
      source={{
        navn: module.underviser,
        email: module.underviserEmail,
        lon: module.lon,
        pris: module.pris,
        overskrift: module.overskrift,
        broedtekst: module.broedtekst,
        tidFra: module.tidFra,
        tidTil: module.tidTil,
        contractId: module.contractId,
      }}
      contextLabel={`${dayLabel}: ${module.tidFra}–${module.tidTil}`}
      linkKind="module"
      linkId={module.id}
      linkLabel={module.overskrift || module.underviser}
      onContractSent={onContractSent}
    />
  );
}
