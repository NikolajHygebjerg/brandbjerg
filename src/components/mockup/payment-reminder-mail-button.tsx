"use client";

import { Mail } from "lucide-react";
import { buildPaymentReminderMailtoLink } from "@/lib/kontor-payment-reminder";
import type { KontorParticipant } from "@/lib/kontor-types";

export function PaymentReminderMailButton({
  participant,
  courseTitle,
  courseId,
}: {
  participant: KontorParticipant;
  courseTitle: string;
  courseId: string;
}) {
  const href = buildPaymentReminderMailtoLink(
    participant,
    courseTitle,
    courseId,
  );

  return (
    <a
      href={href}
      title={`Send rykker til ${participant.name} (${participant.email})`}
      aria-label={`Send betalingsrykker til ${participant.name}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-700 transition hover:bg-red-100 hover:text-red-900"
      onClick={(e) => e.stopPropagation()}
    >
      <Mail className="size-4" aria-hidden />
    </a>
  );
}
