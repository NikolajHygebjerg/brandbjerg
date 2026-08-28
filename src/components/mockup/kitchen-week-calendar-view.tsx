"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  KitchenDayMealPlanCard,
  KitchenWeekStaffEditor,
} from "@/components/mockup/kitchen-day-meal-plan";
import type { CourseListEntry } from "@/lib/course-list";
import {
  loadKitchenWeekMealPlan,
  type KitchenWeekMealPlan,
} from "@/lib/kitchen-meal-plan-storage";
import {
  collectApprovedWeekMeals,
  getIsoWeekDays,
  getKitchenDayStats,
  getKitchenWeekStats,
  ISO_WEEKS,
} from "@/lib/kitchen-week-calendar";
import { weekLabel } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function KitchenWeekCalendarView({
  year,
  courses,
  activeWeek,
  onWeekChange,
}: {
  year: number;
  courses: CourseListEntry[];
  activeWeek: number;
  onWeekChange: (week: number) => void;
}) {
  const [plan, setPlan] = useState<KitchenWeekMealPlan | null>(null);

  const dayDefs = useMemo(
    () => getIsoWeekDays(year, activeWeek),
    [year, activeWeek],
  );

  useEffect(() => {
    setPlan(loadKitchenWeekMealPlan(year, activeWeek, dayDefs));
  }, [year, activeWeek, dayDefs]);

  const weekMeals = useMemo(
    () => collectApprovedWeekMeals(courses, activeWeek),
    [courses, activeWeek],
  );

  const weekStats = useMemo(
    () => getKitchenWeekStats(courses, activeWeek, plan?.staffOnDuty ?? undefined),
    [courses, activeWeek, plan?.staffOnDuty],
  );

  const defaultStaff = useMemo(
    () => getKitchenWeekStats(courses, activeWeek).staffOnDuty,
    [courses, activeWeek],
  );

  const weeksWithActivity = useMemo(() => {
    const set = new Set<number>();
    for (const c of courses) {
      if (c.weekNumber) set.add(c.weekNumber);
    }
    return set;
  }, [courses]);

  if (!plan) {
    return (
      <Card>
        <CardDescription>Indlæser ugeplan…</CardDescription>
      </Card>
    );
  }

  const staffCount = plan.staffOnDuty ?? defaultStaff;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-amber-700" />
          <div>
            <CardTitle className="text-base">Vælg uge — {year}</CardTitle>
            <CardDescription>
              Alle 52 uger — klik for madplan mandag til søndag
            </CardDescription>
          </div>
        </div>
        <div className="mt-4 max-h-48 overflow-y-auto">
          <div className="grid grid-cols-5 gap-1 sm:grid-cols-10 lg:grid-cols-[repeat(13,minmax(0,1fr))]">
            {ISO_WEEKS.map((week) => {
              const hasCourses = weeksWithActivity.has(week);
              const hasMeals = week === activeWeek ? weekMeals.length > 0 : hasCourses;
              return (
                <button
                  key={week}
                  type="button"
                  onClick={() => onWeekChange(week)}
                  className={cn(
                    "rounded-lg px-2 py-2 text-xs font-medium transition",
                    activeWeek === week
                      ? "bg-amber-600 text-white"
                      : hasMeals
                        ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {week}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">
          {weekLabel(activeWeek)} · {year}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-amber-100 bg-amber-50/40">
            <CardDescription>Budget kursister</CardDescription>
            <CardTitle className="text-2xl text-amber-950">
              {weekStats.budgetTotal}
            </CardTitle>
          </Card>
          <Card className="border-emerald-100 bg-emerald-50/40">
            <CardDescription>Tilmeldte</CardDescription>
            <CardTitle className="text-2xl text-emerald-900">
              {weekStats.enrolledTotal}
            </CardTitle>
          </Card>
          <Card>
            <CardDescription>Kurser med forplejning</CardDescription>
            <CardTitle className="text-2xl">{weekStats.courseCount}</CardTitle>
          </Card>
          <Card>
            <CardDescription>Serveringer fra kursusplaner</CardDescription>
            <CardTitle className="text-2xl">{weekStats.mealCount}</CardTitle>
          </Card>
        </div>

        <KitchenWeekStaffEditor
          staffCount={staffCount}
          defaultStaff={defaultStaff}
          year={year}
          weekNumber={activeWeek}
          dayDefs={dayDefs}
          onPlanChange={setPlan}
        />
      </div>

      <div className="space-y-4">
        {plan.days.map((dayPlan) => {
          const stats = getKitchenDayStats(
            courses,
            activeWeek,
            dayPlan.date,
            dayPlan.dayName,
          );
          return (
            <KitchenDayMealPlanCard
              key={dayPlan.date}
              dayPlan={dayPlan}
              weekMeals={weekMeals}
              courses={courses}
              year={year}
              weekNumber={activeWeek}
              dayDefs={dayDefs}
              stats={stats}
              onPlanChange={setPlan}
            />
          );
        })}
      </div>
    </div>
  );
}
