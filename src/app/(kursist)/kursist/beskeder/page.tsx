import { BeskederPage } from "@/components/mockup/beskeder-page";
import { KursistShell } from "@/components/kursist/kursist-shell";

export default function Page() {
  return (
    <KursistShell>
      <BeskederPage basePath="/kursist/beskeder" />
    </KursistShell>
  );
}
