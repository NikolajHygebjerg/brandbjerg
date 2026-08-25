import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import { StatCard } from "@/components/mockup/stat-card";
import {
  activities,
  courses,
  enrollments,
  formatDKK,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const openCourses = courses.filter((c) =>
    ["aaben", "markedsfoeres", "fuldt"].includes(c.status),
  );
  const totalRevenue = enrollments
    .filter((e) => e.status === "betalt")
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingPayments = enrollments.filter(
    (e) => e.status === "reserveret",
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Overblik</p>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tværgående KPI på tværs af afdelinger
          </p>
        </div>
        <Button href="/planlaegning/kurser">
          Se alle kurser
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Aktive kurser" value={String(openCourses.length)} hint="Åbne + markedsføres + fuldt" />
        <StatCard label="Tilmeldinger i alt" value={String(enrollments.length)} hint="Denne sæson (mock)" />
        <StatCard label="Indbetalinger" value={formatDKK(totalRevenue)} hint="Betalte tilmeldinger" />
        <StatCard label="Afventer betaling" value={String(pendingPayments)} hint="Reserverede pladser" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Kurser der kræver opmærksomhed</CardTitle>
          <CardDescription>Kurser med lav fyldning eller fuld booking</CardDescription>
          <div className="mt-4 space-y-3">
            {courses
              .filter((c) => c.status !== "afsluttet" && c.status !== "udkast")
              .slice(0, 4)
              .map((course) => (
                <Link
                  key={course.id}
                  href={`/planlaegning/kurser/${course.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{course.title}</p>
                    <p className="text-xs text-slate-500">
                      {course.enrolled}/{course.capacity} tilmeldt · {course.paid} betalt
                    </p>
                  </div>
                  <StatusBadge status={course.status} />
                </Link>
              ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Seneste aktivitet</CardTitle>
          <CardDescription>Tværgående log på tværs af afdelinger</CardDescription>
          <div className="mt-4 space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="rounded-lg border border-slate-100 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-emerald-700">
                    {act.department}
                  </span>
                  <span className="text-xs text-slate-400">{act.time}</span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{act.message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
