"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCoursesForYear,
} from "@/lib/course-list";
import {
  collectApprovedWeekMeals,
  getKitchenWeekStats,
  slotMatchesForplejning,
} from "@/lib/kitchen-week-calendar";
import {
  msUntilNextMealSwitch,
  resolveActiveKitchenMeal,
  type ActiveKitchenMeal,
} from "@/lib/kitchen-active-meal";
import {
  saveGuestSmileyRating,
  type GuestSmileyScore,
} from "@/lib/kitchen-evaluation-storage";
import { cn } from "@/lib/utils";

const SMILEYS: Array<{ score: GuestSmileyScore; emoji: string; label: string }> =
  [
    { score: 1, emoji: "😠", label: "Meget utilfreds" },
    { score: 2, emoji: "😕", label: "Utilfreds" },
    { score: 3, emoji: "😐", label: "Neutral" },
    { score: 4, emoji: "🙂", label: "Tilfreds" },
    { score: 5, emoji: "😄", label: "Meget tilfreds" },
  ];

export function KitchenSpisesalKiosk() {
  const [hydrated, setHydrated] = useState(false);
  const [activeMeal, setActiveMeal] = useState<ActiveKitchenMeal | null>(null);
  const [thanks, setThanks] = useState(false);
  const [tick, setTick] = useState(0);

  const refreshActiveMeal = useCallback(() => {
    setActiveMeal(resolveActiveKitchenMeal(new Date()));
  }, []);

  useEffect(() => {
    setHydrated(true);
    refreshActiveMeal();
  }, [refreshActiveMeal]);

  useEffect(() => {
    if (!hydrated) return;
    const interval = window.setInterval(refreshActiveMeal, 30_000);
    return () => window.clearInterval(interval);
  }, [hydrated, refreshActiveMeal]);

  useEffect(() => {
    if (!hydrated) return;
    const delay = msUntilNextMealSwitch(new Date());
    const timeout = window.setTimeout(refreshActiveMeal, delay);
    return () => window.clearTimeout(timeout);
  }, [hydrated, activeMeal, refreshActiveMeal, tick]);

  const courses = useMemo(() => {
    if (!hydrated || !activeMeal) return [];
    return getCoursesForYear(activeMeal.year);
  }, [hydrated, activeMeal]);

  function handleRating(score: GuestSmileyScore) {
    if (!activeMeal) return;

    const year = activeMeal.year;
    const weekNumber = activeMeal.weekNumber;
    const weekStatsRaw = getKitchenWeekStats(courses, weekNumber);
    const weekStats = {
      budgetTotal: weekStatsRaw.budgetTotal,
      enrolledTotal: weekStatsRaw.enrolledTotal,
      staffOnDuty: weekStatsRaw.staffOnDuty,
      courseCount: weekStatsRaw.courseCount,
      mealCount: weekStatsRaw.mealCount,
    };

    const weekMeals = collectApprovedWeekMeals(courses, weekNumber);
    const matchingMeals = weekMeals.filter(
      (m) =>
        m.dayDate === activeMeal.date &&
        slotMatchesForplejning(activeMeal.slot.forplejning, m.forplejning),
    );

    saveGuestSmileyRating({
      year,
      weekNumber,
      date: activeMeal.date,
      dayName: activeMeal.dayName,
      slot: activeMeal.slot,
      score,
      courses,
      weekStats,
      matchingMeals,
    });

    setThanks(true);
    setTick((t) => t + 1);
    window.setTimeout(() => setThanks(false), 1800);
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50 text-lg text-amber-900/60">
        Indlæser…
      </div>
    );
  }

  if (!activeMeal) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-8 text-center">
        <p className="text-2xl font-medium text-amber-950">
          Hvad synes du om måltidet?
        </p>
        <p className="mt-6 max-w-md text-base text-amber-900/70">
          Der er endnu intet aktivt måltid at evaluere. Skærmen opdateres
          automatisk, når madplanen starter.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-6 py-12 select-none">
      <p className="text-center text-3xl font-semibold leading-tight text-amber-950 sm:text-4xl">
        Hvad synes du om måltidet?
      </p>

      {thanks ? (
        <p className="mt-16 animate-pulse text-2xl font-medium text-emerald-700">
          Tak for din feedback!
        </p>
      ) : (
        <div className="mt-14 flex w-full max-w-3xl flex-wrap items-center justify-center gap-4 sm:gap-8">
          {SMILEYS.map(({ score, emoji, label }) => (
            <button
              key={score}
              type="button"
              aria-label={label}
              onClick={() => handleRating(score)}
              className={cn(
                "flex h-24 w-24 flex-col items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-amber-200 transition active:scale-95 sm:h-32 sm:w-32",
                "hover:bg-amber-100 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
              )}
            >
              <span className="text-5xl sm:text-6xl" aria-hidden>
                {emoji}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
