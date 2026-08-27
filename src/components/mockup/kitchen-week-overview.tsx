"use client";

import { useMemo } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KitchenMealDayCards } from "@/components/mockup/kitchen-meal-day-cards";
import { getCourseDetailById } from "@/lib/course-list";
import { weekLabel } from "@/lib/mock-data";
import { collectKitchenWeekMeals } from "@/lib/kitchen-utils";
import type { CourseListEntry } from "@/lib/course-list";

export function KitchenWeekOverview({
  weekNumber,
  courses,
}: {
  weekNumber: number;
  courses: CourseListEntry[];
}) {
  const meals = useMemo(
    () =>
      collectKitchenWeekMeals(courses, weekNumber, (id) => {
        const detail = getCourseDetailById(id);
        return detail ?? undefined;
      }),
    [courses, weekNumber],
  );

  if (meals.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardTitle className="text-base text-amber-900">
          {weekLabel(weekNumber)} — ingen madbehov endnu
        </CardTitle>
        <CardDescription className="text-amber-800">
          Der er endnu ingen planlagte måltider for kurser i denne uge.
        </CardDescription>
      </Card>
    );
  }

  const courseCount = new Set(meals.map((m) => m.courseId)).size;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Madbehov {weekLabel(weekNumber)}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {courseCount} kurs{courseCount === 1 ? "us" : "er"} · {meals.length}{" "}
          serveringer · {meals.reduce((sum, m) => sum + m.antalPersoner, 0)}{" "}
          kuverter i alt
        </p>
      </div>
      <KitchenMealDayCards meals={meals} showCourse />
    </div>
  );
}
