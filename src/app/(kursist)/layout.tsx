import { KursistAuthGuard } from "@/components/kursist/kursist-auth-guard";

export default function KursistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KursistAuthGuard>{children}</KursistAuthGuard>;
}
