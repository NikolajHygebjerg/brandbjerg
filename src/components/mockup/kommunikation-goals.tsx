"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KommunikationSubnav } from "@/components/mockup/kommunikation-subnav";
import {
  defaultMarketingGoals,
  KOMMUNIKATION_UPDATED_EVENT,
  loadMarketingGoals,
  saveMarketingGoals,
} from "@/lib/kommunikation-storage";
import type { MarketingEffectivenessGoals } from "@/lib/kommunikation-types";

export function KommunikationGoals() {
  const [goals, setGoals] = useState<MarketingEffectivenessGoals>(
    defaultMarketingGoals,
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGoals(loadMarketingGoals());
  }, []);

  function update<K extends keyof MarketingEffectivenessGoals>(
    key: K,
    value: number,
  ) {
    setGoals((prev) => ({ ...prev, [key]: Math.max(0, value) }));
    setSaved(false);
  }

  function handleSave() {
    saveMarketingGoals(goals);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function resetDefaults() {
    setGoals(defaultMarketingGoals);
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kommunikation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Mål for vurdering af markedsføringseffekt
        </p>
      </div>

      <KommunikationSubnav />

      <div>
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-purple-700" />
          <h2 className="text-xl font-bold text-slate-900">
            Mål for markedsføringseffekt
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Disse mål bruges når appen vurderer indsatser og laver konklusioner
          under Analyse
        </p>
      </div>

      <Card>
        <CardTitle className="text-base">Sammenligningsmål</CardTitle>
        <CardDescription>
          Analysen måler tilmeldinger i dagene efter hver kampagne og beregner
          omkostning pr. tilmelding — inkl. selvrapportering fra tilmeldinger
        </CardDescription>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <GoalField
            label="God effekt — maks kr. pr. tilmelding"
            hint="Grøn vurdering når omkostningen er under dette beløb"
            value={goals.goodCostPerEnrollment}
            onChange={(v) => update("goodCostPerEnrollment", v)}
            suffix="kr."
          />
          <GoalField
            label="Acceptabel effekt — maks kr. pr. tilmelding"
            hint="Orange vurdering mellem god og dette beløb · over = rød"
            value={goals.maxCostPerEnrollment}
            onChange={(v) => update("maxCostPerEnrollment", v)}
            suffix="kr."
          />
          <GoalField
            label="Minimum tilmeldinger pr. indsats"
            hint="Færre end dette i opfølgningsperioden giver rød vurdering"
            value={goals.minEnrollmentsPerEffort}
            onChange={(v) => update("minEnrollmentsPerEffort", v)}
            suffix="tilmeldinger"
          />
          <GoalField
            label="Opfølgningsperiode efter kampagne"
            hint="Antal dage efter kampagneslut hvor tilmeldinger tælles med"
            value={goals.followUpDays}
            onChange={(v) => update("followUpDays", v)}
            suffix="dage"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button onClick={handleSave}>Gem mål</Button>
          <Button variant="secondary" onClick={resetDefaults}>
            Nulstil standard
          </Button>
          {saved && (
            <span className="text-sm font-medium text-emerald-700">Gemt</span>
          )}
        </div>
      </Card>

      <Card className="border-purple-200 bg-purple-50/40">
        <CardTitle className="text-base text-purple-950">
          Eksempel på vurdering
        </CardTitle>
        <ul className="mt-3 space-y-2 text-sm text-purple-950">
          <li>
            Avisannonce til 5.000 kr med 2 tilmeldinger i opfølgningsperioden →{" "}
            {Math.round(5000 / 2).toLocaleString("da-DK")} kr/tilmelding
            {5000 / 2 <= goals.goodCostPerEnrollment
              ? " (god effekt)"
              : 5000 / 2 <= goals.maxCostPerEnrollment
                ? " (acceptabel)"
                : " (svag effekt)"}
          </li>
          <li>
            Facebookkampagne til 5.000 kr uden tilmeldinger → svag effekt
            (under minimum på {goals.minEnrollmentsPerEffort} tilmelding
            {goals.minEnrollmentsPerEffort !== 1 ? "er" : ""})
          </li>
        </ul>
      </Card>
    </div>
  );
}

function GoalField({
  label,
  hint,
  value,
  onChange,
  suffix,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          min={0}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
        />
        <span className="shrink-0 text-xs text-slate-500">{suffix}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </label>
  );
}
