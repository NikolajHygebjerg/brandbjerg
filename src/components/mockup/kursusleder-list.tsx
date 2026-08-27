"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileSignature, GraduationCap } from "lucide-react";
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
import { useAuth } from "@/context/auth-context";
import {
  getAvailableCourseYears,
  getDefaultCourseYear,
} from "@/lib/course-list";
import { statusarkYear } from "@/lib/brandbjerg-statusark";
import { getKursuslederCoursesForUser } from "@/lib/kursusleder-utils";

export function KursuslederList() {
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [activeYear, setActiveYear] = useState(statusarkYear);
  const [years, setYears] = useState<number[]>([statusarkYear]);

  useEffect(() => {
    setYears(getAvailableCourseYears());
    setActiveYear(getDefaultCourseYear());
    setHydrated(true);
  }, []);

  const courses = useMemo(() => {
    if (!hydrated || !user) return [];
    return getKursuslederCoursesForUser(user, activeYear);
  }, [hydrated, user, activeYear]);

  if (!hydrated || !user) {
    return (
      <Card>
        <CardDescription>Indlæser kursuslederoversigt…</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kursusleder</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kurser hvor du er kursusleder, vært eller underviser — {user.name}
          </p>
        </div>
        <Link
          href="/kursusleder/kontrakter"
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
        >
          <FileSignature className="h-4 w-4" />
          Kontrakter
        </Link>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-teal-700" />
            <div>
              <CardTitle className="text-base">Vælg uge / år</CardTitle>
              <CardDescription>Dine kurser i {activeYear}</CardDescription>
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
                    ? "bg-teal-700 text-white"
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
        <div className="border-b border-slate-200 bg-teal-50 px-4 py-3">
          <p className="text-sm font-medium text-teal-900">
            {courses.length} kursus{courses.length !== 1 ? "er" : ""} i {activeYear}
          </p>
        </div>
        <CourseListTable minWidth="720px">
          <CourseListThead
            trailingHeaders={
              <>
                <CourseListHeaderCell>Datoer</CourseListHeaderCell>
                <CourseListHeaderCell>Deltagere</CourseListHeaderCell>
                <CourseListHeaderCell>Din rolle</CourseListHeaderCell>
              </>
            }
          />
          <tbody>
            {courses.length === 0 ? (
              <CourseListEmptyRow colSpan={5}>
                Ingen kurser fundet hvor du er kursusleder eller underviser i{" "}
                {activeYear}.
              </CourseListEmptyRow>
            ) : (
              courses.map((c) => (
                <CourseListRow key={c.id}>
                  <CourseListWeekCell weekNumber={c.weekNumber} />
                  <CourseListTitleCell
                    title={c.title}
                    href={`/kursusleder/${c.id}`}
                    accent="teal"
                  />
                  <CourseListDatesCell
                    startDate={c.startDate}
                    endDate={c.endDate}
                  />
                  <CourseListDataCell>{c.enrolled}</CourseListDataCell>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.roles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                </CourseListRow>
              ))
            )}
          </tbody>
        </CourseListTable>
      </Card>
    </div>
  );
}
