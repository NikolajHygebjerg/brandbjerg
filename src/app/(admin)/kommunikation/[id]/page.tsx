import { KommunikationCourseView } from "@/components/mockup/kommunikation-course-view";

export default async function KommunikationCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KommunikationCourseView courseId={id} />;
}
