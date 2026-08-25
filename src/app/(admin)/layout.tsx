import { AdminShell } from "@/components/layout/admin-shell";
import { CourseDetailSessionProvider } from "@/context/course-detail-session";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CourseDetailSessionProvider>
      <AdminShell>{children}</AdminShell>
    </CourseDetailSessionProvider>
  );
}
