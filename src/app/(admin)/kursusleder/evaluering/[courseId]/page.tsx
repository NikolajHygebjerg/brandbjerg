import { KursuslederEvalueringCoursePage } from "@/components/mockup/kursusleder-evaluering-course-page";

export default async function KursuslederEvalueringCourseRoute({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <KursuslederEvalueringCoursePage courseId={courseId} />;
}
