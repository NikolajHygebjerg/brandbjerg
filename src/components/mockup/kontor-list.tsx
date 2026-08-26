"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, BedDouble, AlertTriangle } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  CourseListDataCell,
  CourseListDatesCell,
  CourseListEmptyRow,
  CourseListHeaderCell,
  CourseListRow,
  CourseListTable,
  CourseListThead,
  CourseListTitleCell,
  CourseListWeekCell,
} from "@/components/mockup/course-list-table";
import {
  getAvailableCourseYears,
  getCoursesForYear,
  getDefaultCourseYear,
} from "@/lib/course-list";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import { getStatusarkCourse } from "@/lib/brandbjerg-status";
import {
  countUnreadAlerts,
  KONTOR_UPDATED_EVENT,
  loadParticipantsForCourse,
} from "@/lib/kontor-storage";
import { countAssignedRooms } from "@/lib/kontor-participants";
import { ROOM_COUNT } from "@/lib/room-utils";

export function KontorList() {
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [years, setYears] = useState<number[]>([statusarkYear]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setYears(getAvailableCourseYears());
    setActiveYear(getDefaultCourseYear());
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onUpdate() {
      setTick((t) => t + 1);
    }
    window.addEventListener(KONTOR_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(KONTOR_UPDATED_EVENT, onUpdate);
  }, []);

  const unreadAlerts = countUnreadAlerts();

  const courses = useMemo(() => {
    if (!hydrated) return [];
    return getCoursesForYear(activeYear)
      .map((entry) => {
        const sa = getStatusarkCourse(entry.id);
        const participants = loadParticipantsForCourse(entry.id);
        const roomsAssigned = countAssignedRooms(participants);
        return {
          ...entry,
          roomsAssigned,
          roomsNeeded: sa?.rooms.double ?? null,
        };
      })
      .sort(
        (a, b) =>
          a.weekNumber - b.weekNumber ||
          a.title.localeCompare(b.title, "da"),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, activeYear, tick]);

  if (!hydrated) {
    return (
      <Card>
        <CardDescription>Indlæser kontoroversigt…</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kontor</h1>
          <p className="mt-1 text-sm text-slate-500">
            Administration — kursister, værelser og tilmeldingsflow
          </p>
        </div>
        <Link
          href="/kontor/vaerelser"
          className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-800"
        >
          <BedDouble className="h-4 w-4" />
          Værelsesoversigt ({ROOM_COUNT} værelser)
        </Link>
      </div>

      {unreadAlerts > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              {unreadAlerts} advarsel{unreadAlerts !== 1 ? "er" : ""} om
              værelsesplacering — tjek det enkelte kursus
            </p>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-violet-700" />
            <div>
              <CardTitle className="text-base">Kurser</CardTitle>
              <CardDescription>
                Antal kursister og link til administrationsvisning
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setActiveYear(y)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeYear === y
                    ? "bg-violet-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-violet-50 px-4 py-3">
          <p className="text-sm font-medium text-violet-900">
            {courses.length} kurser i {activeYear}
          </p>
        </div>
        <CourseListTable minWidth="680px">
          <CourseListThead
            trailingHeaders={
              <>
                <CourseListHeaderCell>Datoer</CourseListHeaderCell>
                <CourseListHeaderCell>Kursister</CourseListHeaderCell>
                <CourseListHeaderCell>Værelser</CourseListHeaderCell>
              </>
            }
          />
          <tbody>
            {courses.map((c) => (
              <CourseListRow key={c.id}>
                <CourseListWeekCell weekNumber={c.weekNumber} />
                <CourseListTitleCell
                  title={c.title}
                  href={`/kontor/${c.id}`}
                  accent="violet"
                />
                <CourseListDatesCell
                  startDate={c.startDate}
                  endDate={c.endDate}
                />
                <CourseListDataCell>
                  <span
                    className={
                      c.enrolled > 0
                        ? "font-semibold text-slate-900"
                        : "text-slate-500"
                    }
                  >
                    {c.enrolled > 0 ? c.enrolled : c.budgetStudents || "—"}
                  </span>
                </CourseListDataCell>
                <td className="px-4 py-3 text-slate-600">
                  {c.roomsAssigned > 0 ? (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                      {c.roomsAssigned} tildelt
                    </span>
                  ) : c.roomsNeeded != null ? (
                    `${c.roomsNeeded} dobbelt`
                  ) : (
                    "—"
                  )}
                </td>
              </CourseListRow>
            ))}
          </tbody>
        </CourseListTable>
      </Card>
    </div>
  );
}
