import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/mockup/status-badge";
import {
  formatDate,
  formatDKK,
  getCourse,
} from "@/lib/mock-data";

export default async function KatalogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = getCourse(id);
  if (!course || course.status === "udkast") notFound();

  const spotsLeft = course.capacity - course.enrolled;
  const isFull = spotsLeft <= 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/katalog"
        className="text-sm text-emerald-800 hover:underline"
      >
        ← Tilbage til katalog
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              {course.category}
            </span>
            <StatusBadge status={course.status} />
          </div>

          <h1 className="text-3xl font-bold text-stone-900">{course.title}</h1>
          <p className="mt-4 text-stone-600">
            Et inspirerende kort kursus med fokus på praktisk læring og fællesskab.
            Kurset afholdes på {course.location} med {course.instructor} som
            underviser.
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["Dato", `${formatDate(course.startDate)} – ${formatDate(course.endDate)}`],
              ["Sted", course.location],
              ["Underviser", course.instructor],
              ["Pris", formatDKK(course.price)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white p-4 ring-1 ring-stone-200">
                <dt className="text-xs text-stone-500">{label}</dt>
                <dd className="mt-1 font-medium text-stone-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardTitle>
              {isFull ? "Tilmeld venteliste" : "Tilmeld dig"}
            </CardTitle>
            <CardDescription>
              {isFull
                ? "Kurset er fuldt — du kan skrive dig på ventelisten"
                : `${spotsLeft} pladser tilbage`}
            </CardDescription>

            <form className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-600">
                  Fulde navn
                </label>
                <input
                  type="text"
                  placeholder="Fx Anna Jensen"
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="anna@example.dk"
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600">
                  Telefon
                </label>
                <input
                  type="tel"
                  placeholder="+45 12 34 56 78"
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  readOnly
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-stone-600">
                <input type="checkbox" className="mt-0.5" readOnly checked />
                Jeg accepterer behandling af mine oplysninger (GDPR)
              </label>

              <Button className="w-full pointer-events-none">
                {isFull ? "Tilmeld venteliste" : `Betal ${formatDKK(course.price)}`}
              </Button>
            </form>

            <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-500">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Bekræftelsesmail sendes automatisk
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Sikker betaling via betalingsgateway
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Ingen CPR krævet
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
