import { KursistCoursePage } from "@/components/kursist/kursist-course-page";

export default async function KursistCourseRoute({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <KursistCoursePage courseId={courseId} />;
}
