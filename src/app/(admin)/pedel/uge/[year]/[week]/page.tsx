import { PedelWeekView } from "@/components/mockup/pedel-week-view";

export default async function PedelWeekPage({
  params,
}: {
  params: Promise<{ year: string; week: string }>;
}) {
  const { year, week } = await params;
  const yearNum = Number(year);
  const weekNum = Number(week);

  if (!Number.isFinite(yearNum) || !Number.isFinite(weekNum)) {
    return null;
  }

  return <PedelWeekView year={yearNum} weekNumber={weekNum} />;
}
