import { KontorCourseView } from "@/components/mockup/kontor-course-view";

export default async function KontorCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KontorCourseView courseId={id} />;
}
