"use client";

import { useEffect, useState } from "react";
import { ContractEditor } from "@/components/contracts/contract-editor";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getContractByToken } from "@/lib/contract-storage";

export function PublicContractPage({ token }: { token: string }) {
  const [contract, setContract] = useState(
    () => getContractByToken(token) ?? null,
  );

  useEffect(() => {
    setContract(getContractByToken(token));
  }, [token]);

  if (!contract) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardTitle className="text-base">Kontrakt ikke fundet</CardTitle>
          <CardDescription className="mt-2">
            Linket er ugyldigt eller kontrakten findes ikke længere. Kontakt
            kursuslederen på Brandbjerg Højskole.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 print:bg-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 print:hidden">
          <p className="text-sm font-medium text-emerald-900">
            Kontrakt fra Brandbjerg Højskole
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            Hej {contract.fields.navn || "samarbejdspartner"} — udfyld felterne,
            underskriv og send kontrakten tilbage til {contract.leaderName}.
          </p>
        </div>
        <ContractEditor
          contract={contract}
          mode="partner"
          onUpdated={setContract}
        />
      </div>
    </div>
  );
}
