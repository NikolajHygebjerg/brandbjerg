import { KursuslederStartKursusView } from "@/components/mockup/kursusleder-start-kursus-view";

export default async function KursuslederStartKursusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KursuslederStartKursusView courseId={id} />;
}
