"use client";

import { CalendarClock } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function VagtplanlaegningPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vagtplanlægning</h1>
        <p className="mt-1 text-sm text-slate-500">
          Planlæg vagter for afdelingens ansatte
        </p>
      </div>

      <Card className="border-dashed border-slate-300 bg-slate-50/80">
        <CardTitle className="flex items-center gap-2 text-base text-slate-800">
          <CalendarClock className="h-5 w-5 text-emerald-700" />
          Kommer snart
        </CardTitle>
        <CardDescription className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          Her kommer et modul, hvor I kan planlægge vagter for afdelingens
          ansatte.
        </CardDescription>
      </Card>
    </div>
  );
}
