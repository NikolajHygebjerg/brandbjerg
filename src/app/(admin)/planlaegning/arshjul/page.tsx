import { ArshjulPlanner } from "@/components/mockup/arshjul-planner";

export default function ArshjulPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Modul 1 — Planlægning</p>
        <h1 className="text-2xl font-bold text-slate-900">Årshjul 2026</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hele gruppen beslutter hvilke kurser der skal være hver uge. Indtast
          mål for årskursister, tilføj kurser med forventet deltagerantal, og
          godkend planen for at oprette statusarket.
        </p>
      </div>
      <ArshjulPlanner />
    </div>
  );
}
