"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileSignature, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import {
  CONTRACTS_UPDATED_EVENT,
  listContracts,
  listContractsForPerson,
  searchContractPeople,
} from "@/lib/contract-storage";
import { contractStatusLabels, type ContractPerson } from "@/lib/contract-types";
import {
  createContract,
  defaultContractFields,
  fieldsFromPerson,
} from "@/lib/contract-utils";

export function ContractsPage() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<ContractPerson | null>(
    null,
  );

  useEffect(() => {
    function onUpdate() {
      setTick((t) => t + 1);
    }
    window.addEventListener(CONTRACTS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CONTRACTS_UPDATED_EVENT, onUpdate);
  }, []);

  const people = useMemo(
    () => searchContractPeople(query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, tick],
  );

  const contracts = useMemo(() => {
    if (selectedPerson) return listContractsForPerson(selectedPerson.id);
    return listContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPerson, tick]);

  function handleNewContract() {
    if (!user) return;
    const fields = selectedPerson
      ? fieldsFromPerson(selectedPerson)
      : defaultContractFields();
    const contract = createContract({
      leader: user,
      fields,
    });
    window.location.href = `/kursusleder/kontrakter/${contract.id}`;
  }

  function handleNewForPerson(person: ContractPerson) {
    if (!user) return;
    const contract = createContract({
      leader: user,
      fields: fieldsFromPerson(person),
    });
    window.location.href = `/kursusleder/kontrakter/${contract.id}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSignature className="h-7 w-7 text-emerald-700" />
            <h1 className="text-2xl font-bold text-slate-900">Kontrakter</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Send og modtag kontrakter til foredragsholdere og undervisere
          </p>
        </div>
        <Button className="h-9" onClick={handleNewContract}>
          <Plus className="h-4 w-4" />
          Ny kontrakt
        </Button>
      </div>

      <Card className="p-4">
        <CardTitle className="text-base">Søg samarbejdspartner</CardTitle>
        <CardDescription className="mt-1">
          Gemte personer vises her — klik for at se tidligere kontrakter
        </CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søg på navn eller mail…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm"
          />
        </div>
        {people.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {people.slice(0, 8).map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPerson(
                      selectedPerson?.id === person.id ? null : person,
                    )
                  }
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                    selectedPerson?.id === person.id ? "bg-emerald-50" : ""
                  }`}
                >
                  <span>
                    <span className="font-medium text-slate-900">
                      {person.navn || "Uden navn"}
                    </span>
                    <span className="ml-2 text-slate-500">{person.email}</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    {listContractsForPerson(person.id).length} kontrakt(er)
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedPerson && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="h-8 text-xs"
              onClick={() => handleNewForPerson(selectedPerson)}
            >
              Ny kontrakt til {selectedPerson.navn}
            </Button>
            <Button
              variant="secondary"
              className="h-8 text-xs"
              onClick={() => setSelectedPerson(null)}
            >
              Vis alle kontrakter
            </Button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-slate-700">
            {selectedPerson
              ? `Kontrakter for ${selectedPerson.navn}`
              : `${contracts.length} kontrakter i alt`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Navn</th>
                <th className="px-4 py-3">Kursus</th>
                <th className="px-4 py-3">Uge</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Opdateret</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Ingen kontrakter endnu. Opret en ny kontrakt eller send fra
                    et modul under Kurser.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/kursusleder/kontrakter/${c.id}`}
                        className="font-medium text-emerald-800 hover:underline"
                      >
                        {c.fields.navn || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.fields.kursustitel || c.courseTitle || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.fields.ugenummer || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {contractStatusLabels[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(c.updatedAt).toLocaleDateString("da-DK")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
