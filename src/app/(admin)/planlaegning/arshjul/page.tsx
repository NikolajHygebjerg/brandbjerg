import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import { courses, formatDate, months } from "@/lib/mock-data";

export default function ArshjulPage() {
  const byMonth = months.map((month, index) => ({
    month,
    courses: courses.filter(
      (c) => new Date(c.startDate).getMonth() === index,
    ),
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">Planlægning</p>
        <h1 className="text-2xl font-bold text-slate-900">Årshjul 2026</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overblik over alle korte kurser på året — godkendelse og kapacitet
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardTitle className="text-2xl">6</CardTitle>
          <CardDescription>Kurser planlagt</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-2xl">2</CardTitle>
          <CardDescription>Afventer godkendelse</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-2xl">3</CardTitle>
          <CardDescription>I markedsføring</CardDescription>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {byMonth.map(({ month, courses: monthCourses }) => (
          <Card key={month} className={monthCourses.length === 0 ? "opacity-60" : ""}>
            <CardTitle>{month}</CardTitle>
            <CardDescription>
              {monthCourses.length === 0
                ? "Ingen kurser"
                : `${monthCourses.length} kursus${monthCourses.length > 1 ? "er" : ""}`}
            </CardDescription>
            <div className="mt-3 space-y-2">
              {monthCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/planlaegning/kurser/${course.id}`}
                  className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {course.title}
                    </p>
                    <StatusBadge status={course.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(course.startDate)} · {course.instructor}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
