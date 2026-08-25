import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import {
  courses,
  formatDate,
  formatDKK,
  statusLabels,
} from "@/lib/mock-data";

export default function KatalogPage() {
  const publicCourses = courses.filter(
    (c) => !["udkast", "afsluttet"].includes(c.status),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-stone-900">Korte kurser</h1>
        <p className="mt-2 text-stone-600">
          Udforsk og tilmeld dig vores kommende kurser
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {["Alle", "Kreativt", "Mad", "Wellness", "Medier"].map((cat, i) => (
          <span
            key={cat}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              i === 0
                ? "bg-emerald-800 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-200"
            }`}
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {publicCourses.map((course) => (
          <Link key={course.id} href={`/katalog/${course.id}`}>
            <Card className="h-full transition hover:shadow-md">
              <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-stone-100 text-sm font-medium text-stone-500">
                {course.category}
              </div>
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <CardDescription className="mt-2">
                {formatDate(course.startDate)} · {course.location}
              </CardDescription>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-emerald-800">
                  {formatDKK(course.price)}
                </span>
                {course.status === "aaben" || course.status === "markedsfoeres" ? (
                  <StatusBadge status={course.status} />
                ) : course.status === "fuldt" ? (
                  <span className="text-xs font-medium text-amber-700">
                    Venteliste
                  </span>
                ) : (
                  <span className="text-xs text-stone-500">
                    {statusLabels[course.status]}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-stone-500">
                {course.capacity - course.enrolled > 0
                  ? `${course.capacity - course.enrolled} pladser tilbage`
                  : "Fuldt booket"}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
