import { Badge } from "@/components/ui/badge";
import { statusColors, statusLabels, type CourseStatus } from "@/lib/mock-data";

export function StatusBadge({ status }: { status: CourseStatus }) {
  return <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>;
}
