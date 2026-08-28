"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { Card, CardDescription } from "@/components/ui/card";
import { KursuslederSurveyEditor } from "@/components/mockup/kursusleder-survey-editor";
import { useAuth } from "@/context/auth-context";
import { getCourseDetailById } from "@/lib/course-list";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import { getUserRolesOnCourse } from "@/lib/kursusleder-utils";
import {
  ensureSurveyConfig,
  getSurveyConfig,
} from "@/lib/kursusleder-survey-storage";
import type { CourseSurveyConfig } from "@/lib/kursusleder-survey-types";
import { formatDate } from "@/lib/mock-data";

export function KursuslederEvalueringCoursePage({
  courseId,
}: {
  courseId: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<CourseSurveyConfig | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const course = getCourseDetailById(courseId);
    if (!course) {
      setMissing(true);
      return;
    }
    const merged = mergeCoursePlan(course);
    if (user && !getUserRolesOnCourse(merged, user).length) {
      router.replace("/kursusleder/evaluering");
      return;
    }
    const existing = getSurveyConfig(courseId);
    const cfg = existing ?? ensureSurveyConfig(courseId);
    setConfig({
      ...cfg,
      courseTitle: merged.title,
    });
  }, [courseId, user, router]);

  if (missing) {
    return (
      <Card>
        <CardDescription>Kursus ikke fundet.</CardDescription>
      </Card>
    );
  }

  if (!config || !user) {
    return (
      <Card>
        <CardDescription>Indlæser evaluering…</CardDescription>
      </Card>
    );
  }

  const course = mergeCoursePlan(getCourseDetailById(courseId)!);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/kursusleder/evaluering"
          className="text-sm text-teal-700 hover:underline"
        >
          ← Tilbage til evalueringer
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <ClipboardList className="h-6 w-6 text-teal-700" />
          <h1 className="text-2xl font-bold text-slate-900">
            Evaluering — {course.title}
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Uge {course.weekNumber} · {formatDate(course.startDate)} –{" "}
          {formatDate(course.endDate)}
        </p>
      </div>

      <KursuslederSurveyEditor initialConfig={config} />
    </div>
  );
}
