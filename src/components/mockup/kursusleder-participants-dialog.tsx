"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import type { KontorParticipant } from "@/lib/kontor-types";
import {
  buildMailtoLink,
  type ParticipantSortMode,
} from "@/lib/kursusleder-utils";

export function KursuslederParticipantsDialog({
  open,
  onClose,
  courseTitle,
  participants,
  sortMode,
  onSortModeChange,
  selectedIds,
  onToggleSelect,
  onMailSelected,
  onMailAll,
}: {
  open: boolean;
  onClose: () => void;
  courseTitle: string;
  participants: KontorParticipant[];
  sortMode: ParticipantSortMode;
  onSortModeChange: (mode: ParticipantSortMode) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onMailSelected: () => void;
  onMailAll: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        role="dialog"
        aria-labelledby="participants-dialog-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <CardTitle className="text-base">
              <span id="participants-dialog-title">Deltagere</span>
            </CardTitle>
            <CardDescription>
              Navn, særlige hensyn, værelse og mail
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Sortér:
              <select
                value={sortMode}
                onChange={(e) =>
                  onSortModeChange(e.target.value as ParticipantSortMode)
                }
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              >
                <option value="efternavn">Efternavn</option>
                <option value="fornavn">Fornavn</option>
                <option value="vaerelse">Værelse</option>
              </select>
            </label>
            <Button
              variant="secondary"
              className="gap-1 text-sm"
              disabled={selectedIds.size === 0}
              onClick={onMailSelected}
            >
              <Mail className="h-4 w-4" />
              Skriv til valgte
            </Button>
            <Button variant="secondary" className="gap-1 text-sm" onClick={onMailAll}>
              <Mail className="h-4 w-4" />
              Skriv til alle
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Luk
            </Button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="w-10 px-4 py-3" />
                <th className="px-4 py-3">Navn</th>
                <th className="px-4 py-3">Værelse</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Særlige hensyn</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Ingen tilmeldinger endnu
                  </td>
                </tr>
              ) : (
                participants.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 hover:bg-teal-50/30"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => onToggleSelect(p.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">
                      {p.roomNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.email}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.specialConsiderations ? (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                          {p.specialConsiderations}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={buildMailtoLink([p.email], courseTitle)}
                        className="text-xs font-medium text-teal-700 hover:underline"
                      >
                        Mail
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
