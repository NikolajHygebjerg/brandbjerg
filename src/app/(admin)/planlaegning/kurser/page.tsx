import Link from "next/link";
import { KurserList } from "@/components/mockup/kurser-list";
import { statusarkCourses } from "@/lib/brandbjerg-statusark";

export default function KurserPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Planlægning</p>
          <h1 className="text-2xl font-bold text-slate-900">Kurser</h1>
          <p className="mt-1 text-sm text-slate-500">
            Brandbjerg Højskole — {statusarkCourses.length} kurser i 2026 fra
            jeres statusark. Vælg år for at se planlagte kurser.
          </p>
        </div>
        <Link
          href="/planlaegning/arshjul"
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          Gå til årshjul →
        </Link>
      </div>

      <KurserList />
    </div>
  );
}
