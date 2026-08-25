import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import { courses, formatDate, formatDKK } from "@/lib/mock-data";

export default function KurserPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Planlægning</p>
          <h1 className="text-2xl font-bold text-slate-900">Kurser</h1>
          <p className="mt-1 text-sm text-slate-500">
            Alle korte kurser med status og fyldningsgrad
          </p>
        </div>
        <Button className="pointer-events-none opacity-70">
          <Plus className="h-4 w-4" />
          Opret kursus (mock)
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Kursus</th>
                <th className="px-4 py-3 font-medium">Dato</th>
                <th className="px-4 py-3 font-medium">Pris</th>
                <th className="px-4 py-3 font-medium">Fyldning</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
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
                      {course.category} · {course.instructor}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(course.startDate)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDKK(course.price)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{
                            width: `${(course.enrolled / course.capacity) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-600">
                        {course.enrolled}/{course.capacity}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={course.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
