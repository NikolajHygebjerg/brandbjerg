import { Suspense } from "react";
import { CourseCatalogDetail } from "@/components/mockup/course-catalog-detail";

export default async function KatalogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-10 text-center text-stone-500">
          Indlæser kursus…
        </div>
      }
    >
      <CourseCatalogDetail courseId={id} />
    </Suspense>
  );
}
