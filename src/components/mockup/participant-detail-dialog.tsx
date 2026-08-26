"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  changeParticipantRoom,
} from "@/lib/kontor-room-assignment";
import {
  checkLabels,
  deriveParticipantChecks,
  preferenceLabels,
  type KontorParticipant,
} from "@/lib/kontor-types";
import { getAllRoomNumbers } from "@/lib/room-utils";
import { formatDate } from "@/lib/mock-data";
import { statusarkYear } from "@/lib/brandbjerg-statusark";

type ParticipantDetailDialogProps = {
  participant: KontorParticipant;
  courseWeek: number;
  courseTitle: string;
  onClose: () => void;
  onUpdated: (p: KontorParticipant) => void;
};

export function ParticipantDetailDialog({
  participant,
  courseWeek,
  courseTitle,
  onClose,
  onUpdated,
}: ParticipantDetailDialogProps) {
  const [roomDraft, setRoomDraft] = useState(participant.roomNumber ?? "");
  const [roomError, setRoomError] = useState<string | null>(null);
  const checks = deriveParticipantChecks(participant);
  const rooms = getAllRoomNumbers();

  function saveRoom() {
    if (!roomDraft.trim()) {
      setRoomError("Vælg et værelsenummer");
      return;
    }
    const result = changeParticipantRoom(
      participant.courseId,
      participant.id,
      roomDraft.trim(),
      courseWeek,
      statusarkYear,
    );
    if (!result.ok) {
      setRoomError(result.error ?? "Kunne ikke ændre værelse");
      return;
    }
    setRoomError(null);
    onUpdated({ ...participant, roomNumber: roomDraft.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        role="dialog"
        aria-modal
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
              Deltager · {courseTitle}
            </p>
            <h2 className="text-lg font-bold text-slate-900">{participant.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Luk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4 text-sm">
          <section>
            <h3 className="text-xs font-semibold uppercase text-slate-500">
              Kontakt
            </h3>
            <dl className="mt-2 grid gap-2">
              <Row label="E-mail" value={participant.email} />
              <Row label="Telefon" value={participant.phone} />
              <Row label="Adresse" value={participant.address} />
              <Row
                label="Tilmeldt"
                value={formatDate(participant.registeredAt)}
              />
              <Row label="Status" value={participant.status} />
              <Row
                label="Beløb"
                value={`${participant.amount.toLocaleString("da-DK")} kr.`}
              />
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase text-slate-500">
              Administration — checkmarks
            </h3>
            <ul className="mt-2 space-y-1.5">
              {(Object.keys(checkLabels) as (keyof typeof checkLabels)[]).map(
                (key) => (
                  <li key={key} className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                        checks[key]
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span
                      className={
                        key === "saerligeHensyn" && checks[key]
                          ? "font-medium text-amber-800"
                          : "text-slate-700"
                      }
                    >
                      {checkLabels[key]}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </section>

          {participant.specialConsiderations && (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <h3 className="text-xs font-semibold uppercase text-amber-900">
                Særlige hensyn fra tilmelding
              </h3>
              <p className="mt-1 text-amber-950">
                {participant.specialConsiderations}
              </p>
            </section>
          )}

          {participant.preferences.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-slate-500">
                Værelsesønsker
              </h3>
              <ul className="mt-2 list-inside list-disc text-slate-700">
                {participant.preferences.map((pref, i) => (
                  <li key={i}>
                    {preferenceLabels[pref.type]}
                    {pref.note ? ` — ${pref.note}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="text-xs font-semibold uppercase text-slate-500">
              Værelse (uge {courseWeek})
            </h3>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <select
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={roomDraft}
                onChange={(e) => setRoomDraft(e.target.value)}
              >
                <option value="">— Ikke placeret —</option>
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <Button className="h-9" onClick={saveRoom}>
                Gem værelse
              </Button>
            </div>
            {roomError && (
              <p className="mt-1 text-xs text-red-600">{roomError}</p>
            )}
            {participant.roomMateId && (
              <p className="mt-2 text-xs text-slate-500">
                Dobbeltværelse deles med anden kursist
              </p>
            )}
          </section>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-right">
          <Button variant="secondary" onClick={onClose}>
            Luk
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  );
}
