import type { Course } from "@/lib/mock-data";
import {
  getUbakProgramDays,
  getUbakProgramTotals,
} from "@/lib/ubak-print-utils";
import { minToHours } from "@/lib/module-plan-utils";

type UbakPrintSheetProps = {
  course: Course;
  courseWeek?: number;
  leaderName?: string;
  className?: string;
};

export function UbakPrintSheet({
  course,
  courseWeek,
  leaderName,
  className = "",
}: UbakPrintSheetProps) {
  const totals = getUbakProgramTotals(course);
  const programDays = getUbakProgramDays(course);
  const hovedsigte = course.kursetsHovedsigte?.trim() ?? "";

  return (
    <div className={`kl-ubak-print text-black ${className}`.trim()}>
      <header className="kl-ubak-print-header">
        <h1 className="kl-ubak-print-title">UBAK — {course.title}</h1>
        {(leaderName || courseWeek) && (
          <p className="kl-ubak-print-meta text-sm text-slate-700">
            {leaderName ? `Kursusleder: ${leaderName}` : null}
            {leaderName && courseWeek ? " · " : null}
            {courseWeek ? `Uge ${courseWeek}` : null}
          </p>
        )}
      </header>

      <section className="kl-ubak-print-section">
        <h2 className="kl-ubak-print-section-title">Kursets hovedsigte (UBAK)</h2>
        <p className="kl-ubak-print-hovedsigte whitespace-pre-wrap">
          {hovedsigte || "—"}
        </p>
      </section>

      <section className="kl-ubak-print-section">
        <h2 className="kl-ubak-print-section-title">
          Programtotaler (Program_UBAK)
        </h2>
        <p className="mb-2 text-xs text-slate-600">
          Summering på tværs af alle dage — måltider tæller ikke med
        </p>
        <dl className="kl-ubak-print-totals grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TotalItem
            label="UV (UBAK + FT)"
            value={`${totals.uvMinutter} min (${minToHours(totals.uvMinutter)} t)`}
          />
          <TotalItem
            label="UBAK"
            value={`${totals.ubakMinutter} min (${minToHours(totals.ubakMinutter)} t)`}
          />
          <TotalItem
            label="FT"
            value={`${totals.ftMinutter} min (${minToHours(totals.ftMinutter)} t) · ${totals.ftPct.toFixed(0)}%`}
          />
          <TotalItem
            label="PTS"
            value={`${totals.ptsMinutter} min (${minToHours(totals.ptsMinutter)} t)`}
          />
          <TotalItem
            label="BH"
            value={`${totals.bhMinutter} min (${minToHours(totals.bhMinutter)} t) · ${totals.bhPct.toFixed(0)}%`}
          />
        </dl>
      </section>

      <section className="kl-ubak-print-section">
        <h2 className="kl-ubak-print-section-title">Program — moduler med UBAK</h2>
        {programDays.length === 0 ? (
          <p className="text-sm text-slate-600">
            Ingen moduler med UBAK-minutter endnu.
          </p>
        ) : (
          <div className="space-y-4">
            {programDays.map((day) => (
              <div key={day.heading} className="kl-ubak-print-day">
                <h3 className="kl-ubak-print-day-heading">{day.heading}</h3>
                <ul className="kl-ubak-print-modules">
                  {day.modules.map((mod, i) => (
                    <li
                      key={`${day.heading}-${mod.tidFra}-${i}`}
                      className="kl-ubak-print-module"
                    >
                      <p className="font-semibold">
                        {mod.tidFra}–{mod.tidTil}: {mod.overskrift}
                        {mod.underviser ? (
                          <span className="font-normal text-slate-700">
                            {" "}
                            · {mod.underviser}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-sm">
                        <span className="font-semibold">UBAK:</span>{" "}
                        {mod.ubakMinutter} min
                      </p>
                      {mod.ubakTekst ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                          {mod.ubakTekst}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm italic text-slate-500">
                          UBAK tekst mangler
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TotalItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
