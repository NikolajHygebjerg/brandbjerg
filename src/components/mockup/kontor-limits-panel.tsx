"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  getEnrollmentAvailability,
  getEffectiveLimits,
  saveLimitsForCourse,
} from "@/lib/kontor-limits-utils";
import type { CourseEnrollmentLimits } from "@/lib/kontor-types";
import { KONTOR_UPDATED_EVENT } from "@/lib/kontor-storage";

type KontorLimitsPanelProps = {
  courseId: string;
  statusarkDefaults?: CourseEnrollmentLimits;
};

export function KontorLimitsPanel({
  courseId,
  statusarkDefaults,
}: KontorLimitsPanelProps) {
  const [limits, setLimits] = useState<CourseEnrollmentLimits>(() =>
    getEffectiveLimits(courseId),
  );
  const [avail, setAvail] = useState(() => getEnrollmentAvailability(courseId));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    function refresh() {
      setLimits(getEffectiveLimits(courseId));
      setAvail(getEnrollmentAvailability(courseId));
    }
    refresh();
    window.addEventListener(KONTOR_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(KONTOR_UPDATED_EVENT, refresh);
  }, [courseId]);

  function update(field: keyof CourseEnrollmentLimits, value: number) {
    setLimits((prev) => ({ ...prev, [field]: Math.max(0, value) }));
    setSaved(false);
  }

  function handleSave() {
    saveLimitsForCourse(courseId, limits);
    setAvail(getEnrollmentAvailability(courseId));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function resetDefaults() {
    if (statusarkDefaults) {
      setLimits(statusarkDefaults);
      setSaved(false);
    }
  }

  return (
    <Card className="border-violet-200">
      <CardTitle className="text-base">Kapacitet & tilmelding</CardTitle>
      <CardDescription>
        Sæt maksimum — tilmelding lukker automatisk når grænsen nås
      </CardDescription>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <LimitField
          label="Maks kursister"
          value={limits.maxKursister}
          used={avail.kursist.used}
          open={avail.kursist.open}
          onChange={(v) => update("maxKursister", v)}
        />
        <LimitField
          label="Maks enkeltværelser"
          value={limits.maxEnkeltvaerelser}
          used={avail.enkelt.used}
          open={avail.enkelt.open}
          onChange={(v) => update("maxEnkeltvaerelser", v)}
        />
        <LimitField
          label="Maks dobbeltværelser"
          value={limits.maxDobbeltvaerelser}
          used={avail.dobbelt.used}
          open={avail.dobbelt.open}
          usedNote={`${avail.dobbelt.usedPersons} pers.`}
          onChange={(v) => update("maxDobbeltvaerelser", v)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={handleSave}>Gem kapacitet</Button>
        {statusarkDefaults && (
          <Button variant="secondary" onClick={resetDefaults}>
            Nulstil fra statusark
          </Button>
        )}
        {saved && (
          <span className="text-sm font-medium text-emerald-700">Gemt</span>
        )}
      </div>

      <ul className="mt-4 space-y-1 text-xs text-slate-600">
        <li>
          Kursist: {avail.kursist.open ? "Åben" : "Lukket"} ({avail.kursist.used}/
          {avail.kursist.max})
        </li>
        <li>
          Enkeltværelse: {avail.enkelt.open ? "Åben" : "Lukket"} ({avail.enkelt.used}/
          {avail.enkelt.max})
        </li>
        <li>
          Dobbeltværelse: {avail.dobbelt.open ? "Åben" : "Lukket"} (
          {avail.dobbelt.used}/{avail.dobbelt.max} rum, {avail.dobbelt.usedPersons}{" "}
          pers.)
        </li>
      </ul>
    </Card>
  );
}

function LimitField({
  label,
  value,
  used,
  open,
  usedNote,
  onChange,
}: {
  label: string;
  value: number;
  used: number;
  open: boolean;
  usedNote?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        type="number"
        min={0}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
      <p className="mt-1 text-xs">
        <span className={open ? "text-emerald-700" : "text-red-700"}>
          {open ? "Åben" : "Lukket"}
        </span>
        {" · "}
        {used} brugt{usedNote ? ` (${usedNote})` : ""}
      </p>
    </label>
  );
}
