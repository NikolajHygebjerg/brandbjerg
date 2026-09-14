"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { UbakPrintSheet } from "@/components/mockup/ubak-print-sheet";
import { getPersonById } from "@/lib/person-utils";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import type { Course } from "@/lib/mock-data";
import { getUbakProgramDays } from "@/lib/ubak-print-utils";

type UbakBeskrivelsePanelProps = {
  course: Course;
  courseWeek: number;
};

export function UbakBeskrivelsePanel({
  course,
  courseWeek,
}: UbakBeskrivelsePanelProps) {
  const merged = mergeCoursePlan(course);
  const leader = getPersonById(merged.courseLeaderId);
  const hasUbakModules = getUbakProgramDays(merged).length > 0;

  function handlePrint() {
    window.print();
  }

  if (!hasUbakModules && !merged.kursetsHovedsigte?.trim()) {
    return (
      <Card className="lg:col-span-2">
        <CardTitle className="text-base">UBAK beskrivelse</CardTitle>
        <CardDescription className="mt-2">
          Udfyld kursets hovedsigte og moduler med UBAK-minutter i modulplanen.
        </CardDescription>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden p-0 lg:col-span-2 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-violet-200 bg-violet-50 px-4 py-3">
          <div>
            <CardTitle className="text-base text-violet-950">
              UBAK beskrivelse
            </CardTitle>
            <CardDescription>
              Hovedsigte, programtotaler og moduler med UBAK-minutter og tekst
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Printvenlig version
          </Button>
        </div>

        <div className="p-4">
          <UbakPrintSheet
            course={merged}
            courseWeek={courseWeek}
            leaderName={leader?.name ?? "—"}
          />
        </div>
      </Card>

      <div id="ubak-print-area" className="hidden print:block">
        <UbakPrintSheet
          course={merged}
          courseWeek={courseWeek}
          leaderName={leader?.name ?? "—"}
          className="kl-ubak-print--page p-8"
        />
      </div>
    </>
  );
}
