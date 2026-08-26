"use client";

import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { formatDate, type Course, type CourseChecklist } from "@/lib/mock-data";
import type { KontorParticipant } from "@/lib/kontor-types";
import { saveParticipantsForCourse } from "@/lib/kontor-storage";
import { buildMailtoLink } from "@/lib/kursusleder-utils";

type WelcomeLetterPanelProps = {
  course: Course;
  participants: KontorParticipant[];
  onUpdateChecklist: (patch: Partial<CourseChecklist>) => void;
  onParticipantsUpdated?: () => void;
};

export function WelcomeLetterPanel({
  course,
  participants,
  onUpdateChecklist,
  onParticipantsUpdated,
}: WelcomeLetterPanelProps) {
  const checklist = course.checklist;
  const daysUntilStart = Math.ceil(
    (new Date(course.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const reminderDue = daysUntilStart <= 21 && daysUntilStart > 0;

  function handleSend() {
    const draft = checklist.welcomeLetterDraft.trim();
    if (!draft) return;

    const emails = participants.map((p) => p.email).filter(Boolean);
    if (emails.length === 0) {
      window.alert("Ingen deltagere at sende til endnu.");
      return;
    }

    const subject = `Velkommen til ${course.title}`;
    window.location.href = buildMailtoLink(emails, subject, draft);

    const sentAt = new Date().toISOString();
    onUpdateChecklist({ welcomeLetterSent: true });

    const updatedParticipants = participants.map((p) => ({
      ...p,
      welcomeLetterSentAt: sentAt,
    }));
    saveParticipantsForCourse(course.id, updatedParticipants);
    onParticipantsUpdated?.();
  }

  return (
    <Card
      className={
        reminderDue && !checklist.welcomeLetterSent
          ? "border-amber-200 bg-amber-50/40"
          : undefined
      }
    >
      <CardTitle className="text-base">Velkomstbrev</CardTitle>
      <CardDescription className="mt-1">
        Kursus starter {formatDate(course.startDate)}
        {reminderDue && !checklist.welcomeLetterSent && (
          <span className="ml-1 font-medium text-amber-800">
            · Send nu — {daysUntilStart} dage til start
          </span>
        )}
        {checklist.welcomeLetterSent && (
          <span className="ml-1 font-medium text-emerald-700">· Sendt</span>
        )}
      </CardDescription>

      <label className="mt-4 block text-xs font-medium text-slate-500">
        Skabelon — rediger før udsendelse
      </label>
      <textarea
        value={checklist.welcomeLetterDraft}
        onChange={(e) =>
          onUpdateChecklist({ welcomeLetterDraft: e.target.value })
        }
        rows={6}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Skriv velkomstbrev til kursisterne…"
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="gap-2"
          onClick={handleSend}
          disabled={
            checklist.welcomeLetterSent ||
            !checklist.welcomeLetterDraft.trim() ||
            participants.length === 0
          }
        >
          <Send className="h-4 w-4" />
          {checklist.welcomeLetterSent
            ? "Velkomstbrev sendt"
            : "Send velkomstbrev i Outlook"}
        </Button>
        {!checklist.welcomeLetterSent && participants.length > 0 && (
          <span className="text-xs text-slate-500">
            <Mail className="mr-1 inline h-3.5 w-3.5" />
            Til bh@brandbjerg.dk — {participants.length} deltager
            {participants.length !== 1 ? "e" : ""} i BCC
          </span>
        )}
      </div>
    </Card>
  );
}
