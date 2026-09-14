import type { Course, CourseDay, CourseModule } from "./mock-data";
import { mergeCoursePlan } from "./course-plan-storage";
import { punktDisplayTitle } from "./heldagstur-utils";
import { moduleUnderviserLabel } from "./module-display-utils";

const DA_MONTHS = [
  "januar",
  "februar",
  "marts",
  "april",
  "maj",
  "juni",
  "juli",
  "august",
  "september",
  "oktober",
  "november",
  "december",
];

/** Standard fodnote om forplejning (som på trykte kursusprogrammer). */
export const PROGRAM_PRINT_MEAL_FOOTER =
  "Hver dag er der sund varieret morgenmad fra 7.30-8.30. Lækker frokostbuffet kl. 12.30, samt dejlig aftensmad kl. 18.00. Hver formiddag, eftermiddag og aften byder køkkenet på kaffe med frugt, kage, brød, boller eller lignende. Brandbjergs køkken har sølvmærket i økologi og arbejder hver dag på at overraske og inspirere til gode spiseoplevelser.";

export interface ProgramPrintRow {
  dayLabel: string;
  dayDate: string;
  tidFra: string;
  tidTil: string;
  overskrift: string;
  lokale: string;
  underviser: string;
  broedtekst: string;
  erMaltid: boolean;
}

export interface ProgramPrintLine {
  /** F.eks. "10.30-11.15" eller "Kl. 8.30" */
  timeLabel: string;
  /** Fed del efter klokkeslæt (titler, navne) */
  headline: string;
  /** Brødtekst / beskrivelse efter headline */
  body?: string;
  /** Vises i rød (fx "Kørsel?") */
  accent?: string;
}

export interface ProgramPrintDayBlock {
  heading: string;
  lines: ProgramPrintLine[];
}

/** Konverter HH:mm til programformat med punktum (10.30). */
export function formatProgramClock(time: string): string {
  const t = time.trim();
  if (!t) return "";
  if (t.includes(".")) return t;
  const [h, m = "00"] = t.split(":");
  return `${h}.${m.padStart(2, "0")}`;
}

export function formatProgramTimeRange(tidFra: string, tidTil: string): string {
  return `${formatProgramClock(tidFra)}-${formatProgramClock(tidTil)}`;
}

export function formatProgramDateRange(startDate: string, endDate: string): string {
  if (!startDate) return "";
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${(endDate || startDate).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(start.getTime())) return "";

  const dayStart = start.getDate();
  const dayEnd = end.getDate();
  const month = DA_MONTHS[start.getMonth()] ?? "";
  const year = start.getFullYear();

  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${dayStart}-${dayEnd}. ${month} ${year}`;
  }

  const monthEnd = DA_MONTHS[end.getMonth()] ?? "";
  return `${dayStart}. ${month} – ${dayEnd}. ${monthEnd} ${year}`;
}

export function formatProgramDayHeading(dayLabel: string, dayDate: string): string {
  const d = new Date(`${dayDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dayLabel;
  const suffix = `${d.getDate()}/${d.getMonth() + 1}`;
  const base = dayLabel.trim();
  if (base.toLowerCase().includes("d.")) {
    return `${base} ${suffix}`.replace(/\s+/g, " ");
  }
  return `${base} ${suffix}`;
}

/** Undertitel til print — typisk første linjer fra hjemmesidetekst. */
export function getProgramPrintSubtitleLines(course: Course): string[] {
  const text = course.checklist?.websiteText?.trim() ?? "";
  if (!text) return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const titleNorm = course.title.trim().toLowerCase();
  const filtered = lines.filter((line, i) => {
    if (i === 0 && line.toLowerCase().startsWith(titleNorm)) return false;
    return true;
  });

  if (filtered.length <= 3) return filtered;

  return filtered.slice(0, 3);
}

function moduleHeadline(mod: CourseModule): string {
  const title = mod.erMaltid
    ? mod.maltid?.forplejning || mod.overskrift || "Måltid"
    : mod.overskrift || "Modul";
  const teacher = moduleUnderviserLabel(mod);
  if (teacher && !title.toLowerCase().includes(teacher.toLowerCase())) {
    return `${teacher}: ${title}`;
  }
  return title;
}

function splitBodyAndAccent(broedtekst: string): { body?: string; accent?: string } {
  const trimmed = broedtekst.trim();
  if (!trimmed) return {};

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1 && /^Kørsel\?$/i.test(lines[0])) {
    return { accent: lines[0] };
  }

  const accentIdx = lines.findIndex(
    (l) => /^Kørsel\?$/i.test(l) || /^Vand inklusiv\./i.test(l),
  );
  if (accentIdx >= 0) {
    const accent = lines[accentIdx];
    const rest = lines.filter((_, i) => i !== accentIdx);
    return {
      body: rest.length ? rest.join("\n") : undefined,
      accent,
    };
  }

  return { body: trimmed };
}

function moduleToPrintLines(mod: CourseModule): ProgramPrintLine[] {
  const lines: ProgramPrintLine[] = [];

  const timeLabel = formatProgramTimeRange(mod.tidFra, mod.tidTil);
  const headline = moduleHeadline(mod);
  const { body, accent } = splitBodyAndAccent(mod.broedtekst);

  lines.push({
    timeLabel,
    headline,
    body,
    accent,
  });

  if (mod.erHeldagstur && mod.heldagstur?.punkter?.length) {
    for (const punkt of mod.heldagstur.punkter) {
      const punktTitle = punktDisplayTitle(punkt);
      const punktBody =
        punkt.type === "besoeg"
          ? punkt.besoeg?.broedtekst?.trim() || punkt.besoeg?.noter?.trim()
          : punkt.type === "maltid"
            ? punkt.maltid?.note?.trim()
            : undefined;

      let headlinePart = punktTitle;
      if (punkt.type === "besoeg" && punkt.besoeg?.broedtekst?.trim()) {
        const firstLine = punkt.besoeg.broedtekst.split(/\r?\n/)[0]?.trim();
        if (firstLine && firstLine !== punktTitle) {
          headlinePart = `${punktTitle}: ${firstLine}`;
        }
      }

      lines.push({
        timeLabel: `Kl. ${formatProgramClock(punkt.tidFra)}`,
        headline: headlinePart,
        body:
          punktBody && punktBody !== headlinePart
            ? punktBody
            : punkt.type === "besoeg"
              ? punkt.besoeg?.broedtekst
                  ?.split(/\r?\n/)
                  .slice(1)
                  .join("\n")
                  .trim() || undefined
              : undefined,
      });
    }
  }

  return lines;
}

export function getProgramPrintDayBlocks(course: Course): ProgramPrintDayBlock[] {
  const merged = mergeCoursePlan(course);
  return merged.days
    .filter((day) => day.modules.length > 0)
    .map((day) => ({
      heading: formatProgramDayHeading(day.label, day.date),
      lines: day.modules.flatMap((mod) => moduleToPrintLines(mod)),
    }));
}

/** Opdel dage i to kolonner (mandag–onsdag | torsdag–fredag ved 5 dage). */
export function splitProgramDaysForColumns(
  days: ProgramPrintDayBlock[],
): [ProgramPrintDayBlock[], ProgramPrintDayBlock[]] {
  const splitAt = Math.ceil(days.length / 2);
  return [days.slice(0, splitAt), days.slice(splitAt)];
}

export function getProgramPrintRows(course: Course): ProgramPrintRow[] {
  const merged = mergeCoursePlan(course);
  const rows: ProgramPrintRow[] = [];

  for (const day of merged.days) {
    for (const mod of day.modules) {
      rows.push({
        dayLabel: day.label,
        dayDate: day.date,
        tidFra: mod.tidFra,
        tidTil: mod.tidTil,
        overskrift: mod.erMaltid
          ? mod.maltid?.forplejning || mod.overskrift || "Måltid"
          : mod.overskrift || "Modul",
        lokale: "",
        underviser: moduleUnderviserLabel(mod),
        broedtekst: mod.broedtekst,
        erMaltid: Boolean(mod.erMaltid),
      });
    }
  }

  return rows;
}

export function programDayHeading(row: ProgramPrintRow): string {
  return formatProgramDayHeading(row.dayLabel, row.dayDate);
}

/** Tomme dage til forhåndsvisning når program ikke er udfyldt endnu. */
export function emptyProgramPlaceholderDays(course: Course): CourseDay[] {
  return mergeCoursePlan(course).days.filter((d) => d.modules.length === 0);
}
