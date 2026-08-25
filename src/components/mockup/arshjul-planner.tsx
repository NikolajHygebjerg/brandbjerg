"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Plus, Send, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  annualTargetDefault,
  initialWeekPlan,
  planStatusLabels,
  sumPlannedStudents,
  type PlannedWeekCourse,
  type PlanStatus,
  weekLabel,
} from "@/lib/mock-data";

const WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

export function ArshjulPlanner() {
  const [target, setTarget] = useState(annualTargetDefault);
  const [weekCourses, setWeekCourses] = useState<PlannedWeekCourse[]>(initialWeekPlan);
  const [planStatus, setPlanStatus] = useState<PlanStatus>("udkast");
  const [selectedWeek, setSelectedWeek] = useState(11);
  const [newTitle, setNewTitle] = useState("");
  const [newStudents, setNewStudents] = useState(12);

  const plannedTotal = useMemo(() => sumPlannedStudents(weekCourses), [weekCourses]);
  const progress = Math.min(100, Math.round((plannedTotal / target) * 100));
  const gap = target - plannedTotal;

  const weekItems = weekCourses.filter((c) => c.weekNumber === selectedWeek);

  function addCourse() {
    if (!newTitle.trim()) return;
    setWeekCourses((prev) => [
      ...prev,
      {
        id: `wp-${Date.now()}`,
        title: newTitle.trim(),
        targetStudents: newStudents,
        weekNumber: selectedWeek,
      },
    ]);
    setNewTitle("");
    setPlanStatus("udkast");
  }

  function removeCourse(id: string) {
    setWeekCourses((prev) => prev.filter((c) => c.id !== id));
    setPlanStatus("udkast");
  }

  function submitForApproval() {
    setPlanStatus("afventer_godkendelse");
  }

  function approvePlan() {
    setPlanStatus("godkendt");
  }

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 bg-emerald-50/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Target className="h-5 w-5" />
              Mål: antal årskursister
            </CardTitle>
            <CardDescription className="text-emerald-800">
              Hele gruppen planlægger kurser ugen for uge og følger løbende,
              hvor tæt I er på målet.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-emerald-900">
              Årskursister
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value) || 0)}
              className="w-28 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-emerald-900">
              Planlagt: {plannedTotal} / {target} kursister
            </span>
            <span className={gap >= 0 ? "text-emerald-700" : "text-amber-700"}>
              {gap >= 0 ? `${gap} mangler` : `${Math.abs(gap)} over mål`}
            </span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
            <p className="mt-2 text-xs text-emerald-700">{progress}% af målet planlagt</p>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            planStatus === "godkendt"
              ? "bg-emerald-100 text-emerald-800"
              : planStatus === "afventer_godkendelse"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {planStatusLabels[planStatus]}
        </span>
        {planStatus === "udkast" && (
          <Button onClick={submitForApproval} variant="secondary">
            <Send className="h-4 w-4" />
            Send til godkendelse
          </Button>
        )}
        {planStatus === "afventer_godkendelse" && (
          <Button onClick={approvePlan}>
            <CheckCircle2 className="h-4 w-4" />
            Godkend årsplan
          </Button>
        )}
        {planStatus === "godkendt" && (
          <Button href="/planlaegning/statusark">
            Gå til statusark
            <ArrowIcon />
          </Button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardTitle>Vælg uge</CardTitle>
          <CardDescription>52 uger — flere kurser kan ligge sideløbende</CardDescription>
          <div className="mt-3 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-4 gap-1 sm:grid-cols-5">
              {WEEKS.map((week) => {
                const count = weekCourses.filter((c) => c.weekNumber === week).length;
                const students = sumPlannedStudents(
                  weekCourses.filter((c) => c.weekNumber === week),
                );
                return (
                  <button
                    key={week}
                    type="button"
                    onClick={() => setSelectedWeek(week)}
                    className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                      selectedWeek === week
                        ? "bg-emerald-700 text-white"
                        : count > 0
                          ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                    title={count > 0 ? `${students} kursister` : "Ingen kurser"}
                  >
                    {week}
                    {count > 0 && (
                      <span className="mt-0.5 block text-[10px] opacity-80">
                        {count} k.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardTitle>{weekLabel(selectedWeek)} — kurser</CardTitle>
          <CardDescription>
            Indtast titel og forventet antal kursister pr. kursus
          </CardDescription>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="Kursustitel"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={1}
              value={newStudents}
              onChange={(e) => setNewStudents(Number(e.target.value) || 1)}
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              title="Antal kursister"
            />
            <Button onClick={addCourse}>
              <Plus className="h-4 w-4" />
              Tilføj
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {weekItems.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                Ingen kurser i denne uge endnu.
              </p>
            ) : (
              weekItems.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{course.title}</p>
                    <p className="text-xs text-slate-500">
                      Mål: {course.targetStudents} kursister
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCourse(course.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Fjern
                  </button>
                </div>
              ))
            )}
          </div>

          {weekItems.length > 0 && (
            <p className="mt-3 text-sm font-medium text-slate-700">
              Uge-total: {sumPlannedStudents(weekItems)} kursister
            </p>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Årsoversigt — kurser pr. uge</CardTitle>
        <CardDescription>
          Komplet plan på tværs af alle uger med kursister
        </CardDescription>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Uge</th>
                <th className="px-3 py-2 font-medium">Kurser</th>
                <th className="px-3 py-2 font-medium">Kursister</th>
              </tr>
            </thead>
            <tbody>
              {WEEKS.filter((w) =>
                weekCourses.some((c) => c.weekNumber === w),
              ).map((week) => {
                const items = weekCourses.filter((c) => c.weekNumber === week);
                return (
                  <tr key={week} className="border-b border-slate-50">
                    <td className="px-3 py-2 font-medium">{weekLabel(week)}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {items.map((c) => c.title).join(" · ")}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {sumPlannedStudents(items)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {planStatus === "godkendt" && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardTitle className="text-emerald-900">Plan godkendt</CardTitle>
          <CardDescription className="text-emerald-800">
            Statusarket er nu oprettet med alle kurser. Tilmeldingsmodulet kan
            aktiveres for de enkelte kurser.
          </CardDescription>
          <div className="mt-3 flex gap-2">
            <Button href="/planlaegning/statusark">Åbn statusark</Button>
            <Button href="/katalog" variant="secondary">
              Se tilmeldingsside
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
