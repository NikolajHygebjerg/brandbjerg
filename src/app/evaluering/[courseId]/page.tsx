import { Suspense } from "react";
import { PublicSurveyPageClient } from "@/components/mockup/public-survey-page-client";

export default async function PublicEvalueringPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-slate-500">Indlæser spørgeskema…</p>
      }
    >
      <PublicSurveyPageClient courseId={courseId} />
    </Suspense>
  );
}
