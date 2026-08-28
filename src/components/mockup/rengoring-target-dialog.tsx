"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, StickyNote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getRengoringNote,
  RENGORING_NOTES_UPDATED_EVENT,
  saveRengoringNote,
  type RengoringNoteTargetType,
} from "@/lib/rengoring-notes-storage";
import { sendPedelNotification } from "@/lib/pedel-notifications-storage";

export type RengoringTargetDialogProps = {
  open: boolean;
  onClose: () => void;
  type: RengoringNoteTargetType;
  targetKey: string;
  label: string;
  userId: string;
  userName: string;
};

export function RengoringTargetDialog({
  open,
  onClose,
  type,
  targetKey,
  label,
  userId,
  userName,
}: RengoringTargetDialogProps) {
  const [note, setNote] = useState("");
  const [pedelTask, setPedelTask] = useState("");
  const [savedHint, setSavedHint] = useState(false);
  const [sentHint, setSentHint] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNote(getRengoringNote(type, targetKey));
    setPedelTask("");
    setSavedHint(false);
    setSentHint(false);
  }, [open, type, targetKey]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  function handleNoteBlur() {
    saveRengoringNote(type, targetKey, note, userId);
    setSavedHint(true);
    window.setTimeout(() => setSavedHint(false), 2000);
  }

  function handleSendPedelTask() {
    const trimmed = pedelTask.trim();
    if (!trimmed || sending) return;

    setSending(true);
    sendPedelNotification({
      type,
      targetKey,
      targetLabel: label,
      text: trimmed,
      senderUserId: userId,
      senderName: userName,
    });
    setPedelTask("");
    setSentHint(true);
    setSending(false);
    window.setTimeout(() => setSentHint(false), 3000);
  }

  if (!open) return null;

  const typeLabel = type === "vaerelse" ? "Værelse" : "Lokale";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rengoring-target-dialog-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              {typeLabel}
            </p>
            <h2
              id="rengoring-target-dialog-title"
              className="text-lg font-bold text-slate-900"
            >
              {label}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Notat gemmes til næste gang · Pedelopgaver sendes til pedelleder
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Luk"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          <section>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <StickyNote className="size-4 text-emerald-700" aria-hidden />
              Notat
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              rows={4}
              placeholder="Noter om værelset/lokalet — synlige næste gang du åbner…"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoFocus
            />
            {savedHint && (
              <p className="mt-1 text-xs text-emerald-700">Notat gemt</p>
            )}
          </section>

          <section className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-blue-900">
              <MessageSquare className="size-4" aria-hidden />
              Pedelopgaver
            </label>
            <p className="mt-1 text-xs text-blue-800/80">
              Beskriv hvad pedellen skal gøre — sendes til pedelleder
            </p>
            <textarea
              value={pedelTask}
              onChange={(e) => setPedelTask(e.target.value)}
              rows={3}
              placeholder={
                type === "vaerelse"
                  ? "Fx: løber vandet under vasken"
                  : "Fx: projektor virker ikke"
              }
              className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-9"
                disabled={!pedelTask.trim() || sending}
                onClick={handleSendPedelTask}
              >
                <Send className="mr-1.5 size-4" />
                Send
              </Button>
              {sentHint && (
                <span className="text-xs font-medium text-emerald-700">
                  Sendt til pedelleder
                </span>
              )}
            </div>
          </section>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-5 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Luk
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Re-export for consumers that listen to note updates */
export { RENGORING_NOTES_UPDATED_EVENT };
