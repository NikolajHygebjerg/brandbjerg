import { CourseDetailLoader } from "@/components/mockup/course-detail-loader";

export default async function KursusDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseDetailLoader id={id} />;
}
