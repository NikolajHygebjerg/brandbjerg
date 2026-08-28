"use client";

import { useMemo, useState } from "react";
import { BedDouble, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changeParticipantRoom, clearParticipantRoom } from "@/lib/kontor-room-assignment";
import {
  loadParticipantsForCourse,
  loadRoomGrid,
} from "@/lib/kontor-storage";
import {
  formatParticipantPreferences,
  getParticipantTogetherLabel,
  groupParticipantsByRoom,
} from "@/lib/kontor-room-display-utils";
import {
  roomStatusLabels,
  type KontorParticipant,
  type RoomWeekCell,
} from "@/lib/kontor-types";
import { getAllRoomNumbers, roomWeekKey } from "@/lib/room-utils";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import { cn } from "@/lib/utils";

type RoomRow = {
  roomNumber: string;
  occupants: KontorParticipant[];
  cell: RoomWeekCell | undefined;
};

export function KontorRoomDistributionDialog({
  courseId,
  courseTitle,
  courseWeek,
  participants,
  onClose,
  onUpdated,
}: {
  courseId: string;
  courseTitle: string;
  courseWeek: number;
  participants: KontorParticipant[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roomDraft, setRoomDraft] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);

  const grid = loadRoomGrid(statusarkYear);
  const allRooms = useMemo(() => getAllRoomNumbers(), []);

  const { byRoom, unassigned } = useMemo(
    () => groupParticipantsByRoom(participants),
    [participants],
  );

  const roomRows = useMemo((): RoomRow[] => {
    const rows: RoomRow[] = Array.from(byRoom.entries()).map(
      ([roomNumber, occupants]) => ({
        roomNumber,
        occupants,
        cell: grid[roomWeekKey(roomNumber, statusarkYear, courseWeek)],
      }),
    );
    rows.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
    return rows;
  }, [byRoom, grid, courseWeek]);

  const selected = participants.find((p) => p.id === selectedId) ?? null;

  function selectParticipant(p: KontorParticipant) {
    setSelectedId(p.id);
    setRoomDraft(p.roomNumber ?? "");
    setRoomError(null);
  }

  function saveRoom() {
    if (!selected) return;
    if (!roomDraft.trim()) {
      const result = clearParticipantRoom(courseId, selected.id);
      if (!result.ok) {
        setRoomError(result.error ?? "Kunne ikke fjerne værelse");
        return;
      }
      setRoomError(null);
      onUpdated();
      return;
    }
    const result = changeParticipantRoom(
      courseId,
      selected.id,
      roomDraft.trim(),
      courseWeek,
      statusarkYear,
    );
    if (!result.ok) {
      setRoomError(result.error ?? "Kunne ikke ændre værelse");
      return;
    }
    setRoomError(null);
    onUpdated();
    const refreshed = loadParticipantsForCourse(courseId);
    const updated = refreshed.find((p) => p.id === selected.id);
    if (updated) {
      setRoomDraft(updated.roomNumber ?? "");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        role="dialog"
        aria-modal
        aria-labelledby="room-distribution-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
              Manuel værelsesfordeling
            </p>
            <h2
              id="room-distribution-title"
              className="text-lg font-bold text-slate-900"
            >
              {courseTitle}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Uge {courseWeek} · {roomRows.length} værelser ·{" "}
              {participants.filter((p) => p.roomNumber).length} placerede
            </p>
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

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_320px]">
          <div className="min-h-0 overflow-y-auto border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
            <p className="mb-3 text-xs text-slate-500">
              Værelsesfordeling som systemet har udfyldt — klik på et navn for
              detaljer og manuel ændring.
            </p>

            {roomRows.length === 0 && unassigned.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Ingen værelser tildelt endnu
              </p>
            ) : (
              <ul className="space-y-2">
                {roomRows.map(({ roomNumber, occupants, cell }) => (
                  <li
                    key={roomNumber}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-slate-900">
                        <BedDouble className="size-4 text-violet-700" />
                        {roomNumber}
                      </span>
                      {cell && cell.status !== "ledigt" && cell.status !== "optaget" && (
                        <RoomStatusBadge cell={cell} />
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {occupants.map((p) => (
                        <ParticipantNameChip
                          key={p.id}
                          participant={p}
                          selected={selectedId === p.id}
                          onClick={() => selectParticipant(p)}
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {unassigned.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <p className="text-sm font-medium text-amber-900">
                  Ikke placeret ({unassigned.length})
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {unassigned.map((p) => (
                    <ParticipantNameChip
                      key={p.id}
                      participant={p}
                      selected={selectedId === p.id}
                      onClick={() => selectParticipant(p)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="min-h-[240px] overflow-y-auto bg-slate-50/80 p-4">
            {selected ? (
              <ParticipantSidePanel
                participant={selected}
                allParticipants={participants}
                courseWeek={courseWeek}
                roomDraft={roomDraft}
                roomError={roomError}
                allRooms={allRooms}
                onRoomDraftChange={setRoomDraft}
                onSave={saveRoom}
              />
            ) : (
              <p className="text-sm text-slate-500">
                Klik på en kursist for at se tilmelding sammen med, værelsesønsker
                og redigere værelse.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-5 py-3">
          <Button variant="secondary" onClick={onClose}>
            Luk
          </Button>
        </div>
      </div>
    </div>
  );
}

function ParticipantNameChip({
  participant,
  selected,
  onClick,
}: {
  participant: KontorParticipant;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition",
        selected
          ? "bg-violet-700 text-white ring-2 ring-violet-300"
          : "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-violet-50 hover:ring-violet-200",
      )}
    >
      {participant.name}
    </button>
  );
}

function RoomStatusBadge({ cell }: { cell: RoomWeekCell }) {
  const label = roomStatusLabels[cell.status];
  const color =
    cell.status === "lukket"
      ? "bg-red-100 text-red-800"
      : cell.status === "buffer"
        ? "bg-sky-100 text-sky-800"
        : cell.status === "ansatte"
          ? "bg-orange-100 text-orange-800"
          : "bg-amber-100 text-amber-800";

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", color)}>
      {label}
    </span>
  );
}

function ParticipantSidePanel({
  participant,
  allParticipants,
  courseWeek,
  roomDraft,
  roomError,
  allRooms,
  onRoomDraftChange,
  onSave,
}: {
  participant: KontorParticipant;
  allParticipants: KontorParticipant[];
  courseWeek: number;
  roomDraft: string;
  roomError: string | null;
  allRooms: string[];
  onRoomDraftChange: (value: string) => void;
  onSave: () => void;
}) {
  const together = getParticipantTogetherLabel(participant, allParticipants);
  const prefs = formatParticipantPreferences(participant);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900">{participant.name}</h3>
        <p className="text-xs text-slate-500">{participant.email}</p>
      </div>

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tilmeldt sammen med
        </h4>
        <p className="mt-1 text-sm text-slate-800">
          {together ?? "Ingen angivet"}
        </p>
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Værelsesønsker
        </h4>
        {prefs.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">Ingen særlige ønsker</p>
        ) : (
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-slate-800">
            {prefs.map((pref) => (
              <li key={pref}>{pref}</li>
            ))}
          </ul>
        )}
      </section>

      {participant.specialConsiderations.trim() && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <h4 className="text-xs font-semibold uppercase text-amber-900">
            Særlige hensyn
          </h4>
          <p className="mt-1 text-sm text-amber-950">
            {participant.specialConsiderations}
          </p>
        </section>
      )}

      <section className="rounded-lg border border-violet-200 bg-white p-3">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-800">
          <Pencil className="size-3.5" />
          Rediger værelse (uge {courseWeek})
        </h4>
        <div className="mt-2 flex flex-col gap-2">
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={roomDraft}
            onChange={(e) => onRoomDraftChange(e.target.value)}
          >
            <option value="">— Ikke placeret —</option>
            {allRooms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button className="h-9 w-full" onClick={onSave}>
            Gem værelse
          </Button>
          {roomError && (
            <p className="text-xs text-red-600">{roomError}</p>
          )}
        </div>
      </section>
    </div>
  );
}
