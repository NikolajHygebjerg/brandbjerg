import { PedelCourseView } from "@/components/mockup/pedel-course-view";

export default async function PedelCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PedelCourseView courseId={id} />;
}
