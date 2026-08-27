import { Suspense } from "react";
import { TilmeldingPageClient } from "@/components/mockup/tilmelding-page-client";

export default async function TilmeldingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="px-4 py-10 text-center text-stone-500">
          Indlæser tilmelding…
        </div>
      }
    >
      <TilmeldingPageClient courseId={id} />
    </Suspense>
  );
}
