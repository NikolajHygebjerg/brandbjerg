import type { Course } from "./mock-data";
import { mergeCoursePlan } from "./course-plan-storage";
import type { User } from "./auth-types";
import { getPersonById, resolvePersonId } from "./person-utils";
import { getCourseDetailById, getCoursesForYear } from "./course-list";
import type { KontorParticipant } from "./kontor-types";

export type KursuslederRole = "Kursusleder" | "Vært" | "Underviser";

export interface KursuslederCourseEntry {
  id: string;
  title: string;
  weekNumber: number;
  startDate: string | null;
  endDate: string | null;
  enrolled: number;
  roles: KursuslederRole[];
}

function nameMatches(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function getUserRolesOnCourse(
  course: Course,
  user: Pick<User, "id" | "name">,
): KursuslederRole[] {
  const roles: KursuslederRole[] = [];
  const userId = resolvePersonId(user.id);

  if (resolvePersonId(course.courseLeaderId) === userId) {
    roles.push("Kursusleder");
  }

  if (
    course.hostIds.some((hostId) => resolvePersonId(hostId) === userId)
  ) {
    roles.push("Vært");
  }

  const merged = mergeCoursePlan(course);
  const teaches = merged.days.some((day) =>
    day.modules.some((mod) => nameMatches(mod.underviser, user.name)),
  );
  if (teaches && !roles.includes("Kursusleder")) {
    roles.push("Underviser");
  }

  return roles;
}

export function userHasAccessToCourse(
  course: Course,
  user: Pick<User, "id" | "name">,
): boolean {
  return getUserRolesOnCourse(course, user).length > 0;
}

export function getKursuslederCoursesForUser(
  user: Pick<User, "id" | "name">,
  year: number,
): KursuslederCourseEntry[] {
  return getCoursesForYear(year)
    .map((entry) => {
      const detail = getCourseDetailById(entry.id);
      if (!detail) return null;
      const merged = mergeCoursePlan(detail);
      const roles = getUserRolesOnCourse(merged, user);
      if (roles.length === 0) return null;
      return {
        id: entry.id,
        title: entry.title,
        weekNumber: entry.weekNumber,
        startDate: entry.startDate,
        endDate: entry.endDate,
        enrolled: entry.enrolled,
        roles,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a!.weekNumber - b!.weekNumber ||
        a!.title.localeCompare(b!.title, "da"),
    ) as KursuslederCourseEntry[];
}

export type ParticipantSortMode = "efternavn" | "fornavn" | "vaerelse";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
}

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0])?.toLowerCase() ?? "";
}

function roomSortKey(room: string | null): number {
  if (!room) return Number.MAX_SAFE_INTEGER;
  const n = parseInt(room.replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}

function sortKey(p: KontorParticipant, mode: ParticipantSortMode): string {
  if (mode === "fornavn") return firstName(p.name);
  if (mode === "vaerelse") return String(roomSortKey(p.roomNumber)).padStart(6, "0");
  return lastName(p.name);
}

function pairMateId(p: KontorParticipant): string | null {
  if (p.roomMateId) return p.roomMateId;
  const together = p.preferences.find((pref) => pref.type === "sammen_med");
  return together?.togetherWithParticipantId ?? null;
}

/** Sorter deltagere — par holdes altid sammen */
export function sortParticipants(
  participants: KontorParticipant[],
  mode: ParticipantSortMode,
): KontorParticipant[] {
  const byId = new Map(participants.map((p) => [p.id, p]));
  const used = new Set<string>();
  const groups: KontorParticipant[][] = [];

  for (const p of participants) {
    if (used.has(p.id)) continue;
    const mateId = pairMateId(p);
    const mate = mateId ? byId.get(mateId) : undefined;
    if (mate && !used.has(mate.id)) {
      groups.push([p, mate]);
      used.add(p.id);
      used.add(mate.id);
    } else {
      groups.push([p]);
      used.add(p.id);
    }
  }

  groups.sort((a, b) => {
    const ka = sortKey(a[0], mode);
    const kb = sortKey(b[0], mode);
    if (ka !== kb) return ka.localeCompare(kb, "da");
    return a[0].name.localeCompare(b[0].name, "da");
  });

  return groups.flat();
}

export function participantCity(p: KontorParticipant): string {
  const parts = p.address.split(",");
  const last = parts[parts.length - 1]?.trim() ?? p.address.trim();
  return last.replace(/^\d{4}\s*/, "").trim() || "—";
}

const BRANDBJERG_MAIL_FROM = "bh@brandbjerg.dk";

export function buildMailtoLink(
  emails: string[],
  subject?: string,
  body?: string,
): string {
  const unique = [...new Set(emails.filter(Boolean))];
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  if (unique.length > 0) {
    params.set("bcc", unique.join(";"));
  }
  const qs = params.toString();
  return `mailto:${BRANDBJERG_MAIL_FROM}${qs ? `?${qs}` : ""}`;
}

export function courseLeaderDisplayName(course: Course): string {
  return getPersonById(course.courseLeaderId)?.name ?? "—";
}
