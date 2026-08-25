import { ArshjulPlanner } from "@/components/mockup/arshjul-planner";

export default function ArshjulPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Modul 1 — Planlægning</p>
        <h1 className="text-2xl font-bold text-slate-900">Årshjul</h1>
        <p className="mt-1 text-sm text-slate-500">
          Brandbjerg Højskole — vælg år, planlæg kurser uge for uge, og kopier
          titler fra sidste år med automatisk datotilpasning og forslag til antal
          kursister baseret på historik.
        </p>
      </div>
      <ArshjulPlanner />
    </div>
  );
}
