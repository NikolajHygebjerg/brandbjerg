import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { courses, formatDate } from "@/lib/mock-data";

export default function AfviklingPage() {
  const upcoming = courses.filter((c) =>
    ["aaben", "fuldt", "afvikles"].includes(c.status),
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">Afvikling</p>
        <h1 className="text-2xl font-bold text-slate-900">
          Kursusafvikling & fremmøde
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Deltagerlister, check-in og praktisk information
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {upcoming.map((course) => (
          <Card key={course.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>
                  {formatDate(course.startDate)} · {course.location}
                </CardDescription>
              </div>
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                {course.paid} betalt
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Lokale</span>
                <span className="font-medium">{course.location}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Underviser</span>
                <span className="font-medium">{course.instructor}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Særlige behov</span>
                <span className="font-medium">2 registreret (mock)</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                Check-in (mock)
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                Eksport deltagerliste
              </span>
              <Link
                href={`/planlaegning/kurser/${course.id}`}
                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800"
              >
                Se kursus
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
