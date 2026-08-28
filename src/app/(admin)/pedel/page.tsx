import { redirect } from "next/navigation";
import { getIsoWeekForDate } from "@/lib/kitchen-active-meal";

export default function PedelPage() {
  const { year, weekNumber } = getIsoWeekForDate(new Date());
  redirect(`/pedel/uge/${year}/${weekNumber}`);
}
