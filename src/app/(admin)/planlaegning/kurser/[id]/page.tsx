import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import {
  activities,
  enrollments,
  formatDate,
  formatDKK,
  getCourse,
} from "@/lib/mock-data";

const tabs = [
  { id: "grunddata", label: "Grunddata" },
  { id: "markedsforing", label: "Markedsføring" },
  { id: "tilmeldinger", label: "Tilmeldinger" },
  { id: "kommunikation", label: "Kommunikation" },
  { id: "oekonomi", label: "Økonomi" },
  { id: "afvikling", label: "Afvikling" },
];

export default async function KursusDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = getCourse(id);
  if (!course) notFound();

  const courseEnrollments = enrollments.filter((e) => e.courseId === id);
  const courseActivities = activities.filter((a) => a.courseId === id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/planlaegning/kurser"
          className="text-sm text-emerald-700 hover:underline"
        >
          ← Tilbage til kurser
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
          <StatusBadge status={course.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(course.startDate)} – {formatDate(course.endDate)} ·{" "}
          {course.location}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab, i) => (
          <span
            key={tab.id}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              i === 0
                ? "bg-emerald-100 text-emerald-900"
                : "text-slate-500"
            }`}
          >
            {tab.label}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Grunddata</CardTitle>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Kategori", course.category],
              ["Underviser", course.instructor],
              ["Lokation", course.location],
              ["Kapacitet", `${course.capacity} deltagere`],
              ["Pris", formatDKK(course.price)],
              ["Ansvarlig afdeling", course.department],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="text-sm font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardTitle>Salgsstatus</CardTitle>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {course.enrolled}/{course.capacity}
              </p>
              <p className="text-xs text-slate-500">Tilmeldt</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">
                {course.paid}
              </p>
              <p className="text-xs text-slate-500">Betalt</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Tilmeldinger</CardTitle>
          <CardDescription>Deltagere på dette kursus</CardDescription>
          <div className="mt-4 space-y-2">
            {courseEnrollments.length === 0 ? (
              <p className="text-sm text-slate-500">Ingen tilmeldinger endnu</p>
            ) : (
              courseEnrollments.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{e.name}</p>
                    <p className="text-xs text-slate-500">{e.email}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-700">
                    {e.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Aktivitetslog</CardTitle>
          <CardDescription>Kommentarer og hændelser</CardDescription>
          <div className="mt-4 space-y-2">
            {courseActivities.length === 0 ? (
              <p className="text-sm text-slate-500">Ingen aktivitet</p>
            ) : (
              courseActivities.map((a) => (
                <div key={a.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-emerald-800">{a.department}</p>
                  <p className="text-slate-700">{a.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{a.time}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
