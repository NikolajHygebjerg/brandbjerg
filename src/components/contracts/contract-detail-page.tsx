"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { ContractEditor } from "@/components/contracts/contract-editor";
import { Card, CardDescription } from "@/components/ui/card";
import { getContract } from "@/lib/contract-storage";

export function ContractDetailPage({ contractId }: { contractId: string }) {
  const { user } = useAuth();
  const [contract, setContract] = useState(
    () => getContract(contractId) ?? null,
  );

  useEffect(() => {
    setContract(getContract(contractId));
  }, [contractId]);

  if (!contract) {
    return (
      <Card>
        <CardDescription>Kontrakt ikke fundet.</CardDescription>
      </Card>
    );
  }

  if (!user) return null;

  return (
    <ContractEditor
      contract={contract}
      mode="leader"
      leader={user}
      onUpdated={setContract}
      backHref="/kursusleder/kontrakter"
      backLabel="← Tilbage til kontrakter"
    />
  );
}
