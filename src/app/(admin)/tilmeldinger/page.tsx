import Link from "next/link";
import { Card } from "@/components/ui/card";
import { enrollments, formatDate, formatDKK, getCourse } from "@/lib/mock-data";

const statusStyles: Record<string, string> = {
  betalt: "bg-emerald-100 text-emerald-800",
  reserveret: "bg-amber-100 text-amber-800",
  venteliste: "bg-blue-100 text-blue-800",
  aflyst: "bg-red-100 text-red-800",
};

export default function TilmeldingerPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">Salg</p>
        <h1 className="text-2xl font-bold text-slate-900">Tilmeldinger</h1>
        <p className="mt-1 text-sm text-slate-500">
          Alle tilmeldinger med betalingsstatus og kursusreference
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Deltager</th>
                <th className="px-4 py-3 font-medium">Kursus</th>
                <th className="px-4 py-3 font-medium">Tilmeldt</th>
                <th className="px-4 py-3 font-medium">Beløb</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => {
                const course = getCourse(enrollment.courseId);
                return (
                  <tr
                    key={enrollment.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {enrollment.name}
                      </p>
                      <p className="text-xs text-slate-500">{enrollment.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/planlaegning/kurser/${enrollment.courseId}`}
                        className="text-emerald-800 hover:underline"
                      >
                        {course?.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(enrollment.registeredAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDKK(enrollment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[enrollment.status]}`}
                      >
                        {enrollment.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
