import { CourseRegistrationForm } from "@/components/mockup/course-registration-form";

export default async function TilmeldingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="px-4 py-10">
      <CourseRegistrationForm
        courseId={id}
        backHref={`/kontor/${id}`}
        backLabel="← Tilbage til kontor"
      />
    </div>
  );
}
