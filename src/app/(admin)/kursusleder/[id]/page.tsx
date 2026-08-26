import { KursuslederCourseView } from "@/components/mockup/kursusleder-course-view";

export default async function KursuslederCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KursuslederCourseView courseId={id} />;
}
