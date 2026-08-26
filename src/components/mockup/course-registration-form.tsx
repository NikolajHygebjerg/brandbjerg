"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCourseDetailById } from "@/lib/course-list";
import { formatDate, formatDKK, type Course } from "@/lib/mock-data";
import { getEnrollmentAvailability } from "@/lib/kontor-limits-utils";
import { registerNewParticipant } from "@/lib/kontor-registration";
import { KONTOR_UPDATED_EVENT } from "@/lib/kontor-storage";
import { loadRegistrationQuestionsForCourse } from "@/lib/kommunikation-storage";

type CourseRegistrationFormProps = {
  courseId: string;
  backHref?: string;
  backLabel?: string;
};

export function CourseRegistrationForm({
  courseId,
  backHref = "/katalog",
  backLabel = "← Tilbage",
}: CourseRegistrationFormProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [avail, setAvail] = useState(() => getEnrollmentAvailability(courseId));
  const [roomType, setRoomType] = useState<"ingen" | "enkelt" | "dobbelt">(
    "dobbelt",
  );
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCourse(getCourseDetailById(courseId) ?? null);
  }, [courseId]);

  useEffect(() => {
    function refresh() {
      setAvail(getEnrollmentAvailability(courseId));
    }
    refresh();
    window.addEventListener(KONTOR_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(KONTOR_UPDATED_EVENT, refresh);
  }, [courseId]);

  useEffect(() => {
    if (!avail.enkelt.open && roomType === "enkelt") {
      setRoomType(avail.dobbelt.open ? "dobbelt" : "ingen");
    } else if (!avail.dobbelt.open && roomType === "dobbelt") {
      setRoomType(avail.enkelt.open ? "enkelt" : "ingen");
    }
  }, [avail, roomType]);

  const questions = loadRegistrationQuestionsForCourse(courseId);

  if (!course) {
    return (
      <Card>
        <CardDescription>Kursus ikke fundet.</CardDescription>
      </Card>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;

    const result = registerNewParticipant(courseId, {
      name,
      email,
      phone,
      roomType,
    });
    if (!result.ok) {
      setError(result.error ?? "Tilmelding fejlede");
      return;
    }
    setDone(true);
  }

  const courseClosed = !avail.kursist.open;

  return (
    <div>
      <Link href={backHref} className="text-sm text-emerald-800 hover:underline">
        {backLabel}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold text-stone-900">{course.title}</h1>
          <p className="mt-2 text-stone-600">
            {formatDate(course.startDate)} – {formatDate(course.endDate)}
          </p>
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            {done ? (
              <>
                <CardTitle>Tilmelding modtaget</CardTitle>
                <CardDescription>
                  Du modtager bekræftelse på e-mail (mock).
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle>
                  {courseClosed ? "Tilmelding lukket" : "Tilmeld dig"}
                </CardTitle>
                <CardDescription>
                  {courseClosed
                    ? "Kurset har nået maks antal kursister"
                    : `${avail.kursist.max - avail.kursist.used} kursistpladser tilbage`}
                </CardDescription>

                <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                  <Field name="name" label="Fulde navn" disabled={courseClosed} />
                  <Field name="email" label="E-mail" type="email" disabled={courseClosed} />
                  <Field name="phone" label="Telefon" type="tel" disabled={courseClosed} />

                  <fieldset className="space-y-2" disabled={courseClosed}>
                    <legend className="text-xs font-medium text-stone-600">
                      Værelse (valgfrit)
                    </legend>
                    <RoomOption
                      id="room-enkelt"
                      label="Enkeltværelse"
                      detail={
                        avail.enkelt.open
                          ? `${avail.enkelt.max - avail.enkelt.used} ledige`
                          : "Fuldt — tilmelding lukket"
                      }
                      checked={roomType === "enkelt"}
                      disabled={!avail.enkelt.open || courseClosed}
                      onChange={() => setRoomType("enkelt")}
                    />
                    <RoomOption
                      id="room-dobbelt"
                      label="Dobbeltværelse"
                      detail={
                        avail.dobbelt.open
                          ? `${avail.dobbelt.max - avail.dobbelt.used} rum ledige`
                          : "Fuldt — tilmelding lukket"
                      }
                      checked={roomType === "dobbelt"}
                      disabled={!avail.dobbelt.open || courseClosed}
                      onChange={() => setRoomType("dobbelt")}
                    />
                    <RoomOption
                      id="room-ingen"
                      label="Intet værelse"
                      detail="Kursus uden overnatning"
                      checked={roomType === "ingen"}
                      disabled={courseClosed}
                      onChange={() => setRoomType("ingen")}
                    />
                  </fieldset>

                  {questions.map((q) => (
                    <label
                      key={q.id}
                      className="flex items-start gap-2 text-xs text-stone-600"
                    >
                      <input type="checkbox" className="mt-0.5" disabled={courseClosed} />
                      {q.questionText}
                    </label>
                  ))}

                  <label className="flex items-start gap-2 text-xs text-stone-600">
                    <input type="checkbox" className="mt-0.5" required disabled={courseClosed} />
                    Jeg accepterer behandling af mine oplysninger (GDPR)
                  </label>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <Button
                    className="w-full"
                    disabled={courseClosed}
                    type="submit"
                  >
                    {courseClosed
                      ? "Tilmelding lukket"
                      : `Betal ${formatDKK(course.price)}`}
                  </Button>
                </form>

                <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-500">
                  <StatusLine ok={avail.kursist.open} text="Kursistplads" />
                  <StatusLine ok={avail.enkelt.open} text="Enkeltværelse" />
                  <StatusLine ok={avail.dobbelt.open} text="Dobbeltværelse" />
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  disabled,
}: {
  name: string;
  label: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-stone-600">{label}</label>
      <input
        name={name}
        type={type}
        required
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-100"
      />
    </div>
  );
}

function RoomOption({
  id,
  label,
  detail,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  detail: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
        disabled
          ? "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-400"
          : checked
            ? "border-emerald-400 bg-emerald-50"
            : "border-stone-200"
      }`}
    >
      <input
        id={id}
        type="radio"
        name="roomType"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-0.5"
      />
      <span>
        <span className="font-medium">{label}</span>
        <span className="block text-xs opacity-80">{detail}</span>
      </span>
    </label>
  );
}

function StatusLine({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className="flex items-center gap-2">
      <CheckCircle2
        className={`h-3.5 w-3.5 ${ok ? "text-emerald-600" : "text-red-400"}`}
      />
      {text}: {ok ? "Åben" : "Lukket"}
    </p>
  );
}
