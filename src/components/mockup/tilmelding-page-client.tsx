"use client";

import { useSearchParams } from "next/navigation";
import { CourseRegistrationForm } from "@/components/mockup/course-registration-form";

type TilmeldingPageClientProps = {
  courseId: string;
};

export function TilmeldingPageClient({ courseId }: TilmeldingPageClientProps) {
  const searchParams = useSearchParams();
  const year = searchParams.get("year");
  const fromKatalog = searchParams.get("from") === "katalog" || Boolean(year);

  const backHref = fromKatalog
    ? year
      ? `/katalog/${courseId}?year=${year}`
      : `/katalog/${courseId}`
    : `/kontor/${courseId}`;

  const backLabel = fromKatalog
    ? year
      ? `← Tilbage til katalog ${year}`
      : "← Tilbage til katalog"
    : "← Tilbage til kontor";

  return (
    <div className="px-4 py-10">
      <CourseRegistrationForm
        courseId={courseId}
        backHref={backHref}
        backLabel={backLabel}
      />
    </div>
  );
}
