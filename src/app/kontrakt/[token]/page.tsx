import { PublicContractPage } from "@/components/contracts/public-contract-page";

export default async function KontraktPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <PublicContractPage token={token} />;
}
