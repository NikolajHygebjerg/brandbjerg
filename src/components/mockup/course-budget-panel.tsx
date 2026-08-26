"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { BUDGET_RATES } from "@/lib/budget/budget-constants";
import {
  buildBudgetInput,
  calculateCourseBudget,
  defaultBudgetManualLines,
} from "@/lib/budget/budget-calculator";
import type {
  BudgetManualLines,
  CourseBudgetInput,
} from "@/lib/budget/budget-types";
import { formatDate, formatDKK, weekLabel, type Course } from "@/lib/mock-data";
import { countInclusiveDays } from "@/lib/module-plan-utils";
import { getPersonById } from "@/lib/person-utils";

type CourseBudgetPanelProps = {
  course: Course;
  budgetManual: BudgetManualLines;
  budgetInputOverrides: Partial<CourseBudgetInput>;
  onUpdateCourse: (patch: Partial<Course>) => void;
  onUpdateBudgetManual: (manual: BudgetManualLines) => void;
  onUpdateBudgetInput: (patch: Partial<CourseBudgetInput>) => void;
};

export function CourseBudgetPanel({
  course,
  budgetManual,
  budgetInputOverrides,
  onUpdateCourse,
  onUpdateBudgetManual,
  onUpdateBudgetInput,
}: CourseBudgetPanelProps) {
  const leader = getPersonById(course.courseLeaderId);
  const dayCount =
    course.days.length > 0
      ? course.days.length
      : countInclusiveDays(course.startDate, course.endDate) || 1;

  const budget = useMemo(() => {
    const input = buildBudgetInput(
      { ...course, days: course.days },
      budgetManual,
      { ...budgetInputOverrides, dayCount },
    );
    return calculateCourseBudget(input, course.days);
  }, [course, budgetManual, budgetInputOverrides, dayCount]);

  function patchManual(patch: Partial<BudgetManualLines>) {
    onUpdateBudgetManual({ ...budgetManual, ...patch });
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-300">
        <CardTitle className="text-lg">Budget — som Budget_4dage</CardTitle>
        <CardDescription className="mt-1">
          Økonomi opdateres automatisk når moduler, pris og deltagere ændres.
          Honorar hentes fra modulernes pris og løn (A/B).
        </CardDescription>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 text-sm">
            <Row label="KURSUS" value={course.title} />
            <Row
              label="Tidspunkt"
              value={`${weekLabel(course.weekNumber)} · ${formatDate(course.startDate)} – ${formatDate(course.endDate)}`}
            />
            <Row label="Kursusleder" value={leader?.name ?? "—"} />
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="font-medium text-amber-900">Budgetteret max udgift</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <NumField
                label="Total (kr.)"
                value={budget.input.maxBudgetTotal}
                onChange={(v) => onUpdateBudgetInput({ maxBudgetTotal: v })}
              />
              <NumField
                label="Pr. kursist (kr.)"
                value={budget.input.maxBudgetPerParticipant}
                onChange={(v) =>
                  onUpdateBudgetInput({ maxBudgetPerParticipant: v })
                }
              />
            </div>
            {budget.overMaxBudget && (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Kontakt Anette — eksterne udgifter overskrider grænsen
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumField
            label="Budgetteret antal"
            value={budget.input.budgetStudents}
            onChange={(v) => onUpdateBudgetInput({ budgetStudents: v })}
          />
          <NumField
            label="Faktisk antal"
            value={budget.input.actualParticipants}
            onChange={(v) => onUpdateBudgetInput({ actualParticipants: v })}
          />
          <NumField
            label="Kursets pris"
            value={budget.input.coursePrice}
            onChange={(v) => {
              onUpdateBudgetInput({ coursePrice: v });
              onUpdateCourse({ price: v });
            }}
          />
          <NumField label="Døgn" value={dayCount} readOnly />
        </div>

        <div className="mt-4 grid gap-3 rounded-lg bg-emerald-50 p-4 sm:grid-cols-3">
          <ResultBox label="Resultat (ugen)" value={budget.result} highlight />
          <ResultBox
            label="Per kursist"
            value={budget.resultPerParticipant}
          />
          <ResultBox
            label="Indtægter i alt"
            value={budget.totalIncome}
            positive
          />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <BudgetSectionCard
          section={budget.income}
          footer={
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <NumField
                label="Eneværelse (antal)"
                value={budgetManual.singleRooms}
                onChange={(v) => patchManual({ singleRooms: v })}
              />
              <NumField
                label="Ældresagsrabat (antal)"
                value={budgetManual.seniorDiscountCount}
                onChange={(v) => patchManual({ seniorDiscountCount: v })}
              />
              <NumField
                label="Tilskud — takst"
                value={budget.input.tilskudTakst}
                step={0.01}
                onChange={(v) => onUpdateBudgetInput({ tilskudTakst: v })}
              />
              <NumField
                label="Tilskud — faktor"
                value={budget.input.tilskudRate}
                step={0.01}
                onChange={(v) => onUpdateBudgetInput({ tilskudRate: v })}
              />
            </div>
          }
        />

        <BudgetSectionCard
          section={budget.internalExpenses}
          footer={
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <NumField
                label="Kost tillæg (antal)"
                value={budgetManual.kostTillægParticipants}
                onChange={(v) => patchManual({ kostTillægParticipants: v })}
              />
              <NumField
                label="Kost børn (antal)"
                value={budgetManual.childMealParticipants}
                onChange={(v) => patchManual({ childMealParticipants: v })}
              />
              <NumField
                label="Rengøring (værelser)"
                value={budgetManual.cleaningRooms}
                onChange={(v) => patchManual({ cleaningRooms: v })}
              />
              <NumField
                label="Linned udgift (antal)"
                value={budgetManual.linenExpenseCount}
                onChange={(v) => patchManual({ linenExpenseCount: v })}
              />
            </div>
          }
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <CardTitle className="text-base">Honorar og løn (fra moduler)</CardTitle>
          <CardDescription>
            A-løn {formatDKK(BUDGET_RATES.lonA)} · B-løn{" "}
            {formatDKK(BUDGET_RATES.lonB)} · ellers modulpris
          </CardDescription>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2">Dag</th>
                <th className="px-4 py-2">Modul</th>
                <th className="px-4 py-2">Rolle / navn</th>
                <th className="px-4 py-2 text-right">Beløb</th>
                <th className="px-4 py-2">Bekræftet</th>
              </tr>
            </thead>
            <tbody>
              {budget.honorarLines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Udfyld moduler under Modulplan — honorar beregnes automatisk
                  </td>
                </tr>
              ) : (
                budget.honorarLines.map((line) => (
                  <tr key={line.moduleId} className="border-b border-slate-100">
                    <td className="px-4 py-2 text-slate-600">{line.dayLabel}</td>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {line.overskrift || "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {line.rolle}
                      {line.navn && line.navn !== line.rolle && (
                        <span className="text-slate-500"> · {line.navn}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      {formatDKK(line.beloeb)}
                    </td>
                    <td className="px-4 py-2">
                      {line.bekraeftet ? (
                        <span className="text-emerald-700">Ja</span>
                      ) : (
                        <span className="text-slate-400">Nej</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={3} className="px-4 py-2">
                  Honorar og løn i alt
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-red-700">
                  {formatDKK(budget.totalHonorar)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle className="text-base">Andre eksterne udgifter</CardTitle>
        <div className="mt-3 space-y-2">
          {budgetManual.otherExternal.map((line, i) => (
            <div key={line.id} className="grid gap-2 sm:grid-cols-4">
              <input
                value={line.label}
                onChange={(e) => {
                  const next = [...budgetManual.otherExternal];
                  next[i] = { ...line, label: e.target.value };
                  patchManual({ otherExternal: next });
                }}
                placeholder="Beskrivelse"
                className="rounded border border-slate-200 px-2 py-1 text-sm sm:col-span-2"
              />
              <input
                type="number"
                value={line.amount || ""}
                onChange={(e) => {
                  const next = [...budgetManual.otherExternal];
                  next[i] = { ...line, amount: Number(e.target.value) };
                  patchManual({ otherExternal: next });
                }}
                placeholder="Beløb"
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                value={line.note}
                onChange={(e) => {
                  const next = [...budgetManual.otherExternal];
                  next[i] = { ...line, note: e.target.value };
                  patchManual({ otherExternal: next });
                }}
                placeholder="Note"
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-sm font-semibold text-red-700">
          I alt: {formatDKK(budget.totalOtherExternal)}
        </p>
      </Card>

      <Card className="border-slate-400 bg-slate-50">
        <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Udgifter i alt" value={formatDKK(budget.totalExpenses)} />
          <Stat label="UBAK min." value={`${budget.programTotals.ubakMin}`} />
          <Stat label="FT min." value={`${budget.programTotals.ftMin}`} />
          <Stat
            label="FT %"
            value={`${budget.programTotals.ftPct.toFixed(1)}%`}
            warn={budget.programTotals.ftPct > 50}
          />
          <Stat label="PTS min." value={`${budget.programTotals.ptsMin}`} />
          <Stat label="BH min." value={`${budget.programTotals.bhMin}`} />
        </dl>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 font-medium text-slate-500">{label}:</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  readOnly,
  step = 1,
}: {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  step?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        type="number"
        step={step}
        readOnly={readOnly}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-sm read-only:bg-slate-50"
      />
    </label>
  );
}

function ResultBox({
  label,
  value,
  highlight,
  positive,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`text-xl font-bold tabular-nums ${
          highlight
            ? value >= 0
              ? "text-emerald-800"
              : "text-red-700"
            : positive
              ? "text-emerald-700"
              : "text-slate-900"
        }`}
      >
        {formatDKK(value)}
      </p>
    </div>
  );
}

function BudgetSectionCard({
  section,
  footer,
}: {
  section: { title: string; lines: { label: string; amount: number; detail?: string }[]; subtotal: number };
  footer?: React.ReactNode;
}) {
  return (
    <Card>
      <CardTitle className="text-base">{section.title}</CardTitle>
      <ul className="mt-3 space-y-2">
        {section.lines.map((line) => (
          <li
            key={line.label}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <div>
              <p className="text-slate-800">{line.label}</p>
              {line.detail && (
                <p className="text-xs text-slate-500">{line.detail}</p>
              )}
            </div>
            <span
              className={`shrink-0 tabular-nums font-medium ${
                line.amount >= 0 ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {formatDKK(line.amount)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-slate-200 pt-2 text-right text-sm font-semibold">
        {section.title} i alt:{" "}
        <span className={section.subtotal >= 0 ? "text-emerald-800" : "text-red-700"}>
          {formatDKK(section.subtotal)}
        </span>
      </p>
      {footer}
    </Card>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`font-semibold ${warn ? "text-amber-700" : "text-slate-900"}`}>
        {value}
        {warn && " (max 50%)"}
      </dd>
    </div>
  );
}

export { defaultBudgetManualLines };
