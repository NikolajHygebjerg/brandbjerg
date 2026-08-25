"use client";

import { useEffect, useState } from "react";
import { CourseDetailView } from "@/components/mockup/course-detail-view";
import { getCourseDetailById } from "@/lib/course-list";
import type { Course } from "@/lib/mock-data";
import { getCourse } from "@/lib/mock-data";

export function CourseDetailLoader({ id }: { id: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const found =
      getCourse(id) ?? getCourseDetailById(id);
    if (found) setCourse(found);
    else setMissing(true);
  }, [id]);

  if (missing) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="font-medium text-slate-900">Kursus ikke fundet</p>
        <p className="mt-1 text-sm text-slate-500">ID: {id}</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500">
        Indlæser kursus…
      </div>
    );
  }

  return <CourseDetailView course={course} />;
}
