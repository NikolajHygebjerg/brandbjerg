import { KitchenCourseView } from "@/components/mockup/kitchen-course-view";

export default async function KoekkenCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KitchenCourseView courseId={id} />;
}
