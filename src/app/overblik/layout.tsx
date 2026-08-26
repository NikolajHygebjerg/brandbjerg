import { AuthGuard } from "@/components/auth/auth-guard";
import { OverblikShell } from "@/components/layout/overblik-shell";

export default function OverblikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard staffOnly>
      <OverblikShell>{children}</OverblikShell>
    </AuthGuard>
  );
}
