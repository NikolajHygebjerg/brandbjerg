"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LokaleSetupDialog } from "@/components/mockup/lokale-setup-dialog";
import { getCourseDetailById } from "@/lib/course-list";
import { formatDate, type Course } from "@/lib/mock-data";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import {
  formatLokaleFlags,
  getPedelDayRooms,
  groupPedelDayRoomsByDate,
  timeSpanForRoom,
  type PedelDayRoom,
} from "@/lib/pedel-utils";

export function PedelCourseView({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [missing, setMissing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<PedelDayRoom | null>(null);

  useEffect(() => {
    const found = getCourseDetailById(courseId);
    if (found) setCourse(mergeCoursePlan(found));
    else setMissing(true);
  }, [courseId]);

  if (missing) {
    return (
      <Card>
        <CardDescription>Kursus ikke fundet.</CardDescription>
      </Card>
    );
  }

  if (!course) {
    return (
      <Card>
        <CardDescription>Indlæser…</CardDescription>
      </Card>
    );
  }

  const dayRooms = getPedelDayRooms(course);
  const byDay = groupPedelDayRoomsByDate(dayRooms);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/pedel"
          className="text-sm text-blue-700 hover:underline"
        >
          ← Tilbage til pedeloversigt
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Sparkles className="h-6 w-6 text-blue-700" />
          <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(course.startDate)} – {formatDate(course.endDate)}
        </p>
      </div>

      {dayRooms.length === 0 ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardTitle className="text-base text-blue-900">
            Ingen lokaler planlagt endnu
          </CardTitle>
          <CardDescription className="text-blue-800">
            Kursuslederen skal vælge lokale og udfylde lokalespecifikation under
            Modulplan.
          </CardDescription>
        </Card>
      ) : (
        byDay.map((day) => (
          <Card key={day.date} className="overflow-hidden p-0">
            <div className="border-b border-blue-200 bg-blue-50 px-4 py-3">
              <CardTitle className="text-base text-blue-950">
                {day.label} · {formatDate(day.date)}
              </CardTitle>
              <CardDescription>
                {day.rooms.length} lokale{day.rooms.length !== 1 ? "r" : ""} skal
                klargøres — klik for opsætning
              </CardDescription>
            </div>
            <ul className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {day.rooms.map((room) => {
                const flags = formatLokaleFlags(room.entries[0].spec);
                const personer = Math.max(
                  ...room.entries.map((e) => e.spec.antalPersoner),
                );
                return (
                  <li key={`${room.dayDate}-${room.lokale}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedRoom(room)}
                      className="flex w-full flex-col rounded-xl border border-blue-200 bg-white p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">
                            {room.lokale}
                          </p>
                          <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                            Kl. {timeSpanForRoom(room.entries)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                        {personer > 0 && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                            {personer} pers.
                          </span>
                        )}
                        {room.entries[0].spec.bordopstilling && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                            {room.entries[0].spec.bordopstilling}
                          </span>
                        )}
                        {flags.slice(0, 2).map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800"
                          >
                            {f}
                          </span>
                        ))}
                        {flags.length > 2 && (
                          <span className="text-slate-500">
                            +{flags.length - 2}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-xs font-medium text-blue-700">
                        Se opsætning →
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))
      )}

      {selectedRoom && (
        <LokaleSetupDialog
          room={selectedRoom}
          courseId={courseId}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
