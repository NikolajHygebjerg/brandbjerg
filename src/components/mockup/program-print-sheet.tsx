import type { Course } from "@/lib/mock-data";
import {
  PROGRAM_PRINT_MEAL_FOOTER,
  formatProgramDateRange,
  getProgramPrintDayBlocks,
  getProgramPrintSubtitleLines,
  splitProgramDaysForColumns,
  type ProgramPrintDayBlock,
} from "@/lib/program-print-utils";

type ProgramPrintSheetProps = {
  course: Course;
  className?: string;
  showMealFooter?: boolean;
};

export function ProgramPrintSheet({
  course,
  className = "",
  showMealFooter = true,
}: ProgramPrintSheetProps) {
  const dayBlocks = getProgramPrintDayBlocks(course);
  const [leftDays, rightDays] = splitProgramDaysForColumns(dayBlocks);
  const subtitleLines = getProgramPrintSubtitleLines(course);
  const dateRange = formatProgramDateRange(course.startDate, course.endDate);

  return (
    <div className={`kl-program-a4 text-black ${className}`.trim()}>
      <header className="kl-program-a4-header">
        <h1 className="kl-program-a4-title">{course.title}</h1>
        {subtitleLines.length > 0 ? (
          <div className="kl-program-a4-subtitle">
            {subtitleLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : null}
        {dateRange ? <p className="kl-program-a4-dates">{dateRange}</p> : null}
      </header>

      {dayBlocks.length === 0 ? (
        <p className="kl-program-a4-empty mt-6 text-sm text-slate-600">
          Programmet er endnu ikke udfyldt — tilføj moduler under Kursus.
        </p>
      ) : (
        <div className="kl-program-a4-columns">
          <div className="kl-program-a4-col">
            {leftDays.map((day) => (
              <ProgramPrintDaySection key={day.heading} day={day} />
            ))}
          </div>
          <div className="kl-program-a4-col">
            {rightDays.map((day) => (
              <ProgramPrintDaySection key={day.heading} day={day} />
            ))}
            {showMealFooter ? (
              <p className="kl-program-a4-footer">{PROGRAM_PRINT_MEAL_FOOTER}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgramPrintDaySection({ day }: { day: ProgramPrintDayBlock }) {
  return (
    <section className="kl-program-a4-day">
      <h2 className="kl-program-a4-day-heading">{day.heading}</h2>
      <ul className="kl-program-a4-lines">
        {day.lines.map((line, i) => (
          <li key={`${day.heading}-${i}`} className="kl-program-a4-line">
            <p className="kl-program-a4-line-main">
              <span className="kl-program-a4-time">{line.timeLabel}:</span>{" "}
              <span className="kl-program-a4-headline">{line.headline}</span>
            </p>
            {line.body ? (
              <p className="kl-program-a4-body whitespace-pre-wrap">{line.body}</p>
            ) : null}
            {line.accent ? (
              <p className="kl-program-a4-accent">{line.accent}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
