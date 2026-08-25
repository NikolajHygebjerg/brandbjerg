import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import {
  brandbjergAnnualTarget2026,
  brandbjergBudgetTotal2026,
} from "@/lib/brandbjerg-arshjul";
import { statusarkCourses2026 } from "@/lib/brandbjerg-status";
import { formatDate, planStatusLabels, weekLabel } from "@/lib/mock-data";

export default function StatusarkPage() {
  const activeCourses = statusarkCourses2026.filter(
    (c) => c.status !== "afsluttet",
  );
  const totalEnrolled = activeCourses.reduce((s, c) => s + c.enrolled, 0);
  const totalCapacity = activeCourses.reduce((s, c) => s + c.capacity, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Modul 1 → Statusark</p>
          <h1 className="text-2xl font-bold text-slate-900">Statusark 2026</h1>
          <p className="mt-1 text-sm text-slate-500">
            {activeCourses.length} kurser importeret fra jeres regneark — klik
            for at planlægge det enkelte kursus (modul 2)
          </p>
        </div>
        <Button href="/planlaegning/arshjul" variant="secondary">
          Tilbage til årshjul
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardTitle className="text-2xl">{activeCourses.length}</CardTitle>
          <CardDescription>Kurser i statusark</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-2xl">{totalEnrolled}</CardTitle>
          <CardDescription>Tilmeldte i alt (mockup)</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-2xl">{totalCapacity}</CardTitle>
          <CardDescription>Kapacitet i alt</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-2xl">
            {brandbjergBudgetTotal2026}
          </CardTitle>
          <CardDescription>
            Budget kursistpladser · mål {brandbjergAnnualTarget2026}
          </CardDescription>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Kursus</th>
                <th className="px-4 py-3 font-medium">Uge</th>
                <th className="px-4 py-3 font-medium">Dato</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Tilmeldte</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {activeCourses.map((course) => {
                const fillPct =
                  course.capacity > 0
                    ? Math.round((course.enrolled / course.capacity) * 100)
                    : 0;
                return (
                  <tr
                    key={course.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/planlaegning/kurser/${course.id}`}
                        className="font-medium text-emerald-800 hover:underline"
                      >
                        {course.title}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {course.category}
                        {course.instructor !== "—" &&
                          ` · ${course.instructor}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {weekLabel(course.weekNumber)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {course.startDate.includes("-W")
                        ? "—"
                        : formatDate(course.startDate)}
                    </td>
                    <td className="px-4 py-3">{course.capacity}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${Math.min(100, fillPct)}%` }}
                          />
                        </div>
                        <span>
                          {course.enrolled}/{course.capacity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        {planStatusLabels[course.planStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/planlaegning/kurser/${course.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Planlæg
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardTitle className="text-blue-900">Tilmeldingsmodul</CardTitle>
        <CardDescription className="text-blue-800">
          Når et kursus er godkendt i statusarket, vises det automatisk i det
          offentlige kursuskatalog, hvor kursister kan tilmelde sig.
        </CardDescription>
        <Button href="/katalog" className="mt-3" variant="secondary">
          Se offentligt katalog
        </Button>
      </Card>
    </div>
  );
}
