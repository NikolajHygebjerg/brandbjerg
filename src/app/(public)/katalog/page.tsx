import { Suspense } from "react";
import { CourseCatalog } from "@/components/mockup/course-catalog";

export default function KatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-center text-stone-500">
          Indlæser kursuskatalog…
        </div>
      }
    >
      <CourseCatalog />
    </Suspense>
  );
}
