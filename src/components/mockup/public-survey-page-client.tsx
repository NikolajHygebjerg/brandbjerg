"use client";

import { useEffect, useState } from "react";
import { Card, CardDescription } from "@/components/ui/card";
import { KursuslederSurveyForm } from "@/components/mockup/kursusleder-survey-form";
import { getCourseDetailById } from "@/lib/course-list";
import {
  getSurveyConfig,
  saveSurveyResponse,
} from "@/lib/kursusleder-survey-storage";
import type { CourseSurveyConfig } from "@/lib/kursusleder-survey-types";

export function PublicSurveyPageClient({ courseId }: { courseId: string }) {
  const [config, setConfig] = useState<CourseSurveyConfig | null>(null);
  const [closed, setClosed] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const course = getCourseDetailById(courseId);
    if (!course) {
      setMissing(true);
      return;
    }
    const cfg = getSurveyConfig(courseId);
    if (!cfg) {
      setMissing(true);
      return;
    }
    setConfig({ ...cfg, courseTitle: course.title });
    setClosed(!cfg.published);
  }, [courseId]);

  if (missing) {
    return (
      <Card>
        <CardDescription>Evalueringen findes ikke.</CardDescription>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardDescription>Indlæser spørgeskema…</CardDescription>
      </Card>
    );
  }

  if (closed) {
    return (
      <Card className="mx-auto max-w-xl border-amber-200 bg-amber-50">
        <CardDescription className="text-amber-950">
          Evalueringen er ikke aktiv endnu. Kursuslederen skal aktivere den,
          før du kan svare.
        </CardDescription>
      </Card>
    );
  }

  return (
    <KursuslederSurveyForm
      config={config}
      onSubmit={(answers) => {
        saveSurveyResponse(courseId, config.courseTitle, answers);
      }}
    />
  );
}
