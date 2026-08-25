import { notFound } from "next/navigation";
import { CourseDetailView } from "@/components/mockup/course-detail-view";
import { getBrandbjergCourse } from "@/lib/brandbjerg-status";
import { getCourse } from "@/lib/mock-data";

export default async function KursusDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = getCourse(id) ?? getBrandbjergCourse(id);
  if (!course) notFound();

  return <CourseDetailView course={course} />;
}
