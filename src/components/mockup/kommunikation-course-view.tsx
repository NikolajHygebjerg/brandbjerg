"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { MarketingEffortDialog } from "@/components/mockup/marketing-effort-dialog";
import { MarketingTimeline } from "@/components/mockup/marketing-timeline";
import { EnrollmentTimelinePanel } from "@/components/mockup/enrollment-timeline";
import { getCourseDetailById } from "@/lib/course-list";
import { formatDate, type Course } from "@/lib/mock-data";
import { getStatusarkCourse } from "@/lib/brandbjerg-status";
import {
  addMarketingEffort,
  KOMMUNIKATION_UPDATED_EVENT,
  loadKommunikationState,
  loadRegistrationQuestionsForCourse,
  updateBenchmarks,
} from "@/lib/kommunikation-storage";
import type { EnrollmentBenchmark } from "@/lib/kommunikation-types";
import {
  benchmarkPaceStatus,
  canSuggestFromHistory,
  expectedEnrollmentToday,
  getBenchmarksForCourse,
  paceStatusClasses,
  suggestBenchmarksFromHistory,
} from "@/lib/kommunikation-utils";
import { netEnrolled } from "@/lib/statusark-utils";

export function KommunikationCourseView({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [missing, setMissing] = useState(false);
  const [showEffortDialog, setShowEffortDialog] = useState(false);
  const [showBenchmarkEditor, setShowBenchmarkEditor] = useState(false);
  const [tick, setTick] = useState(0);

  const statusark = getStatusarkCourse(courseId);

  useEffect(() => {
    const found = getCourseDetailById(courseId);
    if (!found) setMissing(true);
    else setCourse(found);
  }, [courseId]);

  useEffect(() => {
    function refresh() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(KOMMUNIKATION_UPDATED_EVENT, refresh);
  }, []);

  if (missing) {
    return (
      <Card>
        <CardDescription>Kursus ikke fundet.</CardDescription>
      </Card>
    );
  }

  if (!course || !statusark?.startDate) {
    return (
      <Card>
        <CardDescription>
          {!course ? "Indlæser…" : "Kurset mangler startdato for tidslinje."}
        </CardDescription>
      </Card>
    );
  }

  const budget = statusark.budgetStudents;
  const enrolled = netEnrolled(statusark.totalEnrolled, statusark.paidCancellations);
  const state = loadKommunikationState(courseId);
  const benchmarks = getBenchmarksForCourse(
    courseId,
    statusark.startDate,
    budget,
  );
  const expected = expectedEnrollmentToday(statusark.startDate, benchmarks);
  const pace = benchmarkPaceStatus(enrolled, expected);
  const efforts = state?.efforts ?? [];
  const questions = loadRegistrationQuestionsForCourse(courseId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/kommunikation"
          className="text-sm text-purple-700 hover:underline"
        >
          ← Tilbage til kommunikation
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Megaphone className="h-6 w-6 text-purple-700" />
          <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(statusark.startDate)} –{" "}
          {formatDate(statusark.endDate ?? statusark.startDate)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardDescription>Tilmeldte</CardDescription>
          <CardTitle className="text-2xl">{enrolled}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Burde være i dag</CardDescription>
          <CardTitle className="text-2xl">
            <span
              className={`inline-block rounded-lg px-2 ${paceStatusClasses[pace]}`}
            >
              {expected}
            </span>
          </CardTitle>
        </Card>
        <Card>
          <CardDescription>Budget</CardDescription>
          <CardTitle className="text-2xl">{budget}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Markedsføringsindsatser</CardDescription>
          <CardTitle className="text-2xl">{efforts.length}</CardTitle>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Tidslinje & indsatser</CardTitle>
            <CardDescription>
              Benchmark 1–6 mdr. før · markedsføring · i dag-markør
            </CardDescription>
          </div>
          <Button onClick={() => setShowEffortDialog(true)}>
            <Plus className="h-4 w-4" />
            Opret markedsføringsindsats
          </Button>
        </div>
        <div className="mt-4">
          <MarketingTimeline
            courseStartDate={statusark.startDate}
            benchmarks={benchmarks}
            efforts={efforts}
            enrolled={enrolled}
            onEditBenchmarks={() => setShowBenchmarkEditor(true)}
          />
        </div>
      </Card>

      {showBenchmarkEditor && (
        <BenchmarkEditor
          courseId={courseId}
          budget={budget}
          benchmarks={benchmarks}
          fromHistory={state?.benchmarksFromHistory ?? false}
          onClose={() => {
            setShowBenchmarkEditor(false);
            setTick((t) => t + 1);
          }}
        />
      )}

      <Card>
        <CardTitle className="text-base">Tilmeldinger pr. uge</CardTitle>
        <div className="mt-3">
          <EnrollmentTimelinePanel course={statusark} />
        </div>
      </Card>

      {questions.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardTitle className="text-base text-purple-950">
            Spørgsmål i tilmeldingsmodulet (auto-tilføjet)
          </CardTitle>
          <CardDescription>
            Tilføjes automatisk når markedsføring opretter en indsats
          </CardDescription>
          <ul className="mt-3 space-y-2">
            {questions.map((q) => (
              <li
                key={q.id}
                className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-slate-800"
              >
                ☐ {q.questionText}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {showEffortDialog && (
        <MarketingEffortDialog
          courseStartDate={statusark.startDate}
          onClose={() => setShowEffortDialog(false)}
          onSave={(effort) => {
            addMarketingEffort(courseId, effort);
            setTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

function BenchmarkEditor({
  courseId,
  budget,
  benchmarks: initial,
  fromHistory,
  onClose,
}: {
  courseId: string;
  budget: number;
  benchmarks: EnrollmentBenchmark[];
  fromHistory: boolean;
  onClose: () => void;
}) {
  const [benchmarks, setBenchmarks] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);

  function applySuggestion() {
    if (!canSuggestFromHistory()) {
      setNotice(
        "Ingen historiske tilmeldinger at analysere endnu — indtast tallene manuelt.",
      );
      return;
    }
    setBenchmarks(suggestBenchmarksFromHistory(budget, courseId));
    setNotice("Benchmark foreslået ud fra tidligere års tilmeldinger.");
  }

  function save() {
    updateBenchmarks(courseId, benchmarks, false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">Benchmark-tal</h2>
        <p className="mt-1 text-sm text-slate-500">
          Forventet antal tilmeldte X måneder før kursusstart for at nå budget (
          {budget}).
          {fromHistory && " Tallene er auto-genereret fra historik."}
        </p>

        {canSuggestFromHistory() && (
          <Button
            variant="secondary"
            className="mt-3"
            onClick={applySuggestion}
          >
            Foreslå ud fra tidligere år
          </Button>
        )}
        {notice && (
          <p className="mt-2 text-sm text-purple-800">{notice}</p>
        )}

        <div className="mt-4 space-y-3">
          {[6, 5, 4, 3, 2, 1, 0].map((m) => {
            const b = benchmarks.find((x) => x.monthsBefore === m);
            return (
              <label key={m} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-slate-600">
                  {m === 0 ? "Ved start" : `${m} mdr. før`}
                </span>
                <input
                  type="number"
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1.5"
                  value={b?.targetCount ?? 0}
                  min={0}
                  max={budget}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setBenchmarks((prev) => {
                      const next = prev.filter((x) => x.monthsBefore !== m);
                      next.push({ monthsBefore: m, targetCount: val });
                      return next.sort((a, b) => b.monthsBefore - a.monthsBefore);
                    });
                  }}
                />
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuller
          </Button>
          <Button onClick={save}>Gem benchmark</Button>
        </div>
      </div>
    </div>
  );
}
