import { Database, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { RegistrationModulePanel } from "@/components/mockup/registration-module-panel";
import { StatusarkTable } from "@/components/mockup/statusark-table";
import {
  statusarkCourses,
  statusarkTotals,
  statusarkYear,
} from "@/lib/brandbjerg-statusark";
import { netEnrolled } from "@/lib/statusark-utils";

export default function StatusarkPage() {
  const totalEnrolled = statusarkCourses.reduce(
    (s, c) => s + netEnrolled(c.totalEnrolled, c.paidCancellations),
    0,
  );
  const withTimeline = statusarkCourses.filter(
    (c) => c.enrollmentByWeek.length > 0,
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">KK afdelingen</p>
          <h1 className="text-2xl font-bold text-slate-900">
            Årsoversigt {statusarkYear}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Live tilmeldinger fra databasen — aggregeret pr. kalenderuge som i
            jeres regneark.
          </p>
        </div>
        <Button href="/planlaegning/arshjul" variant="secondary">
          Tilbage til årshjul
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardTitle className="text-2xl">{statusarkCourses.length}</CardTitle>
          <CardDescription>Kurser i årsoversigt</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-2xl">{totalEnrolled}</CardTitle>
          <CardDescription>Tilmeldte i alt (database)</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-2xl">{statusarkTotals.totalBudget}</CardTitle>
          <CardDescription>Budget kursistpladser</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-2xl">{withTimeline}</CardTitle>
          <CardDescription>Kurser med uge-for-uge data</CardDescription>
        </Card>
      </div>

      <Card className="border-violet-200 bg-violet-50/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
            <Database className="h-5 w-5 text-violet-700" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-violet-900">
              Tilmeldinger i databasen — ikke i regnearket
            </CardTitle>
            <CardDescription className="text-violet-800">
              Hver tilmelding gemmes med dato og kalenderuge. Årsoversigten
              aggregerer ugentlige tal automatisk (som kolonnerne uge 34/2025 →
              uge 52). Den rå historik bevares permanent til analyse af
              tilmeldingstempo.
            </CardDescription>
            <div className="mt-2 flex items-center gap-2 text-xs text-violet-700">
              <LineChart className="h-3.5 w-3.5" />
              Klik på en række for at se tilmeldinger fordelt på uger
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <StatusarkTable courses={statusarkCourses} />
      </Card>

      <RegistrationModulePanel />
    </div>
  );
}
