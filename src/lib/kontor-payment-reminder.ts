import type { KontorParticipant } from "./kontor-types";

export const PAYMENT_REMINDER_SUBJECT = "Husk at betale";

export function buildPaymentLink(
  courseId: string,
  baseUrl?: string,
): string {
  const origin =
    baseUrl ??
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://temporary-agile-boron-nfvvr9v.vercel.app");
  return `${origin}/tilmelding/${courseId}`;
}

export function buildPaymentReminderBody(
  participantName: string,
  courseTitle: string,
  paymentLink: string,
): string {
  const firstName = participantName.trim().split(/\s+/)[0] || participantName;

  return `Kære ${firstName},

Vi skriver venligt til dig, fordi vi endnu ikke har registreret din betaling for kurset «${courseTitle}».

Har du glemt at betale? Du kan nemt gennemføre betalingen via linket her:
${paymentLink}

Har du allerede betalt, kan du se bort fra denne mail — og tak, hvis du giver os besked, så vi kan opdatere vores system.

Med venlig hilsen
Brandbjerg Højskole — Kontor`;
}

export function buildPaymentReminderMailtoLink(
  participant: KontorParticipant,
  courseTitle: string,
  courseId: string,
  baseUrl?: string,
): string {
  const paymentLink = buildPaymentLink(courseId, baseUrl);
  const body = buildPaymentReminderBody(
    participant.name,
    courseTitle,
    paymentLink,
  );
  const params = new URLSearchParams();
  params.set("subject", PAYMENT_REMINDER_SUBJECT);
  params.set("body", body);
  return `mailto:${participant.email}?${params.toString()}`;
}
