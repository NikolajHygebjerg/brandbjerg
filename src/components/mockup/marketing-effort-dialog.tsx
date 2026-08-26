"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MarketingEffortType } from "@/lib/kommunikation-types";
import { marketingEffortTypeLabels } from "@/lib/kommunikation-types";

type MarketingEffortDialogProps = {
  courseStartDate: string;
  onClose: () => void;
  onSave: (effort: {
    type: MarketingEffortType;
    startDate: string;
    endDate: string;
    price: number;
  }) => void;
};

export function MarketingEffortDialog({
  courseStartDate,
  onClose,
  onSave,
}: MarketingEffortDialogProps) {
  const [type, setType] = useState<MarketingEffortType>("facebook");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!startDate || !endDate) {
      setError("Angiv start- og slutdato");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("Slutdato skal være efter startdato");
      return;
    }
    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) {
      setError("Angiv en pris");
      return;
    }
    onSave({ type, startDate, endDate, price: priceNum });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">
          Opret markedsføringsindsats
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Indsatsen vises på tidslinjen og tilføjer automatisk et spørgsmål i
          tilmeldingen.
        </p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="text-xs font-medium text-slate-500">Type</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as MarketingEffortType)}
            >
              {(Object.keys(marketingEffortTypeLabels) as MarketingEffortType[]).map(
                (t) => (
                  <option key={t} value={t}>
                    {marketingEffortTypeLabels[t]}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-slate-500">Startdato</span>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={startDate}
              max={courseStartDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-slate-500">Slutdato</span>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={endDate}
              max={courseStartDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-slate-500">Pris (DKK)</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min={0}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuller
          </Button>
          <Button onClick={handleSubmit}>Godkend indsats</Button>
        </div>
      </div>
    </div>
  );
}
