import { AdminShell } from "@/components/layout/admin-shell";
import { CourseDetailSessionProvider } from "@/context/course-detail-session";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard staffOnly>
      <CourseDetailSessionProvider>
        <AdminShell>{children}</AdminShell>
      </CourseDetailSessionProvider>
    </AuthGuard>
  );
}
