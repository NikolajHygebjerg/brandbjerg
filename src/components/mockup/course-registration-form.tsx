"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCourseDetailById } from "@/lib/course-list";
import { mergeCoursePlan } from "@/lib/course-plan-storage";
import { formatDate, formatDKK, type Course } from "@/lib/mock-data";
import {
  accommodationOptions,
  countryOptions,
  dietaryOptions,
  ENKELTVAERELSE_TILLÆG,
  heardFromOptions,
  INDMELDELSES_GEBYR,
  SENGETØJ_TILLÆG,
} from "@/lib/enrollment-form-options";
import type { RegistrationFormData } from "@/lib/enrollment-form-types";
import { getEnrollmentAvailability } from "@/lib/kontor-limits-utils";
import { registerNewParticipant } from "@/lib/kontor-registration";
import {
  KONTOR_UPDATED_EVENT,
  loadParticipantsForCourse,
} from "@/lib/kontor-storage";
import {
  countWorkshopEnrollments,
  getRegistrationWorkshopModules,
  isWorkshopOptionFull,
  visibleWorkshopOptions,
} from "@/lib/workshop-utils";

type CourseRegistrationFormProps = {
  courseId: string;
  backHref?: string;
  backLabel?: string;
};

const initialForm: RegistrationFormData = {
  firstName: "",
  lastName: "",
  email: "",
  emailConfirm: "",
  phone: "",
  address: "",
  postalCode: "",
  city: "",
  country: "Danmark",
  accommodation: "dobbelt",
  roomNeighbor: "",
  bedding: "nej",
  bhvMember: "nej",
  discountCode: "",
  elderCouncil: "nej",
  previousParticipant: "nej",
  heardFrom: "Vælg",
  dietaryNeeds: "Vælg",
  otherConsiderations: "",
  photoConsent: "nej",
  acceptDataTerms: false,
  acceptNewsletter: false,
  workshopChoices: {},
};

export function CourseRegistrationForm({
  courseId,
  backHref = "/katalog",
  backLabel = "← Tilbage",
}: CourseRegistrationFormProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [avail, setAvail] = useState(() => getEnrollmentAvailability(courseId));
  const [form, setForm] = useState<RegistrationFormData>(initialForm);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [participants, setParticipants] = useState(() =>
    loadParticipantsForCourse(courseId),
  );

  useEffect(() => {
    const found = getCourseDetailById(courseId);
    setCourse(found ? mergeCoursePlan(found) : null);
  }, [courseId]);

  useEffect(() => {
    function refresh() {
      setAvail(getEnrollmentAvailability(courseId));
      setParticipants(loadParticipantsForCourse(courseId));
    }
    refresh();
    window.addEventListener(KONTOR_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(KONTOR_UPDATED_EVENT, refresh);
  }, [courseId]);

  useEffect(() => {
    if (!avail.enkelt.open && form.accommodation === "enkelt") {
      setForm((f) => ({ ...f, accommodation: "dobbelt" }));
    }
  }, [avail.enkelt.open, form.accommodation]);

  const workshopModules = useMemo(
    () => (course ? getRegistrationWorkshopModules(course) : []),
    [course],
  );

  function setWorkshopChoice(moduleId: string, optionId: string) {
    setForm((prev) => ({
      ...prev,
      workshopChoices: { ...prev.workshopChoices, [moduleId]: optionId },
    }));
  }

  const courseClosed = !avail.kursist.open;

  const totalPrice = useMemo(() => {
    if (!course) return 0;
    return (
      course.price +
      (form.accommodation === "enkelt" ? ENKELTVAERELSE_TILLÆG : 0) +
      (form.bedding === "ja" ? SENGETØJ_TILLÆG : 0)
    );
  }, [course, form.accommodation, form.bedding]);

  if (!course) {
    return (
      <Card>
        <CardDescription>Kursus ikke fundet.</CardDescription>
      </Card>
    );
  }

  const courseLabel = `${course.title} uge ${course.weekNumber} — ${new Date(course.startDate).getFullYear()}`;

  function update<K extends keyof RegistrationFormData>(
    key: K,
    value: RegistrationFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.acceptDataTerms) {
      setError("Du skal acceptere betingelserne for databehandling.");
      return;
    }

    const result = registerNewParticipant(courseId, form, course!.price);
    if (!result.ok) {
      setError(result.error ?? "Tilmelding fejlede");
      return;
    }
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={backHref} className="text-sm text-emerald-800 hover:underline">
        {backLabel}
      </Link>

      <header className="mt-4 border-b border-stone-200 pb-6">
        <h1 className="text-3xl font-bold text-stone-900">Tilmeld dig</h1>
        <p className="mt-2 text-lg font-medium text-emerald-900">{courseLabel}</p>
        <p className="mt-1 text-sm text-stone-600">
          {formatDate(course.startDate)} – {formatDate(course.endDate)} ·{" "}
          {formatDKK(course.price)} + evt. tillæg
        </p>
      </header>

      <InfoBlock className="mt-6">
        <strong>Kontaktoplysninger på deltagere:</strong> Alle deltagere skal
        udfylde deres egen tilmeldingsformular.
      </InfoBlock>

      <InfoBlock className="mt-4">
        <strong>CPR-nummer:</strong> Indsamles ikke i denne version af
        platformen. Betalingsopgørelse sendes pr. mail få dage efter tilmelding.
      </InfoBlock>

      {done ? (
        <Card className="mt-8">
          <CardTitle>Tilmelding modtaget</CardTitle>
          <CardDescription className="mt-2">
            Tak for din tilmelding til {course.title}. Du modtager bekræftelse
            og betalingsopgørelse på e-mail (mock). Indmeldelsesgebyr på{" "}
            {formatDKK(INDMELDELSES_GEBYR)} er inkluderet i kursusgebyret.
          </CardDescription>
        </Card>
      ) : (
        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          <FormSection title="Kontaktoplysninger">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Fornavn"
                name="firstName"
                value={form.firstName}
                onChange={(v) => update("firstName", v)}
                disabled={courseClosed}
                required
              />
              <Field
                label="Efternavn"
                name="lastName"
                value={form.lastName}
                onChange={(v) => update("lastName", v)}
                disabled={courseClosed}
                required
              />
            </div>
            <Field
              label="E-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={(v) => update("email", v)}
              disabled={courseClosed}
              required
            />
            <Field
              label="Valider"
              name="emailConfirm"
              type="email"
              placeholder="Gentag e-mail"
              value={form.emailConfirm}
              onChange={(v) => update("emailConfirm", v)}
              disabled={courseClosed}
              required
            />
            <div>
              <label className="text-sm font-medium text-stone-700">
                Telefonnummer
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  className="rounded-lg border border-stone-200 bg-white px-2 py-2 text-sm"
                  disabled={courseClosed}
                  defaultValue="+45"
                >
                  <option value="+45">DK (+45)</option>
                </select>
                <input
                  name="phone"
                  type="tel"
                  required
                  disabled={courseClosed}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-100"
                />
              </div>
            </div>
            <Field
              label="Adresse"
              name="address"
              value={form.address}
              onChange={(v) => update("address", v)}
              disabled={courseClosed}
              required
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Postnummer"
                name="postalCode"
                value={form.postalCode}
                onChange={(v) => update("postalCode", v)}
                disabled={courseClosed}
                required
              />
              <Field
                label="By"
                name="city"
                value={form.city}
                onChange={(v) => update("city", v)}
                disabled={courseClosed}
                required
                className="sm:col-span-2"
              />
            </div>
            <SelectField
              label="Land"
              name="country"
              value={form.country}
              onChange={(v) => update("country", v)}
              disabled={courseClosed}
              options={countryOptions.map((c) => ({ value: c, label: c }))}
              required
            />
          </FormSection>

          <FormSection title="Oplysninger om kurset">
            <SelectField
              label="Indkvartering"
              name="accommodation"
              value={form.accommodation}
              onChange={(v) =>
                update("accommodation", v as RegistrationFormData["accommodation"])
              }
              disabled={courseClosed}
              options={accommodationOptions.map((o) => ({
                value: o.value,
                label: o.label,
                disabled: o.value === "enkelt" && !avail.enkelt.open,
              }))}
              required
            />
            {!avail.enkelt.open && (
              <p className="text-xs text-amber-700">
                Enkeltværelser er udsolgt — kun dobbeltværelse kan vælges.
              </p>
            )}
            <Field
              label="Ønsker værelse ved siden af (valgfri)"
              name="roomNeighbor"
              value={form.roomNeighbor}
              onChange={(v) => update("roomNeighbor", v)}
              disabled={courseClosed}
              hint="Oplys navn på medkursist, hvis I ønsker værelse sammen eller ved siden af hinanden."
            />
            <RadioGroup
              label="Sengetøj"
              hint="Linnedpakke: 150 kr."
              name="bedding"
              value={form.bedding}
              onChange={(v) => update("bedding", v as "ja" | "nej")}
              disabled={courseClosed}
              options={[
                { value: "ja", label: "Ja tak." },
                { value: "nej", label: "Nej tak." },
              ]}
            />
          </FormSection>

          <FormSection title="Andre informationer">
            <p className="text-xs text-stone-500">
              Rabatordningerne kan ikke kombineres — og der kan kun opnås én
              rabat.
            </p>
            <RadioGroup
              label="BHV-medlem / Brandbjerg Højskoles venner"
              name="bhvMember"
              value={form.bhvMember}
              onChange={(v) => update("bhvMember", v as "ja" | "nej")}
              disabled={courseClosed}
              options={[
                { value: "ja", label: "Ja" },
                { value: "nej", label: "Nej" },
              ]}
            />
            <Field
              label="Angiv evt. rabatkode"
              name="discountCode"
              value={form.discountCode}
              onChange={(v) => update("discountCode", v)}
              disabled={courseClosed}
            />
            <RadioGroup
              label="Har du et ældreråds nr., der skal tilføjes til tilmeldingen?"
              name="elderCouncil"
              value={form.elderCouncil}
              onChange={(v) => update("elderCouncil", v as "ja" | "nej")}
              disabled={courseClosed}
              options={[
                { value: "ja", label: "Ja" },
                { value: "nej", label: "Nej" },
              ]}
            />
            <RadioGroup
              label="Har du tidligere deltaget i et kursus hos os?"
              name="previousParticipant"
              value={form.previousParticipant}
              onChange={(v) =>
                update("previousParticipant", v as "ja" | "nej")
              }
              disabled={courseClosed}
              options={[
                { value: "ja", label: "Ja" },
                { value: "nej", label: "Nej" },
              ]}
            />
            <SelectField
              label="Hvor har du hørt om kurset?"
              name="heardFrom"
              value={form.heardFrom}
              onChange={(v) => update("heardFrom", v)}
              disabled={courseClosed}
              options={heardFromOptions.map((o) => ({
                value: o,
                label: o,
              }))}
            />
            <SelectField
              label="Særlige hensyn til kost?"
              name="dietaryNeeds"
              value={form.dietaryNeeds}
              onChange={(v) => update("dietaryNeeds", v)}
              disabled={courseClosed}
              options={dietaryOptions.map((o) => ({
                value: o,
                label: o,
              }))}
            />
            <Field
              label="Andre hensyn? (valgfri)"
              name="otherConsiderations"
              value={form.otherConsiderations}
              onChange={(v) => update("otherConsiderations", v)}
              disabled={courseClosed}
              hint="Fx gangbesvær, nedsat syn, nedsat hørelse"
            />
          </FormSection>

          {workshopModules.length > 0 && (
            <FormSection title="Vælg workshop">
              <p className="text-sm text-stone-600">
                Vælg én workshop pr. blok nedenfor. Fuldt bookede workshops kan
                ikke vælges.
              </p>
              {workshopModules.map((mod) => (
                <div
                  key={mod.id}
                  className="rounded-lg border border-violet-200 bg-violet-50/40 p-4"
                >
                  <p className="font-semibold text-violet-950">
                    {mod.overskrift || "Workshops"}
                  </p>
                  {mod.broedtekst.trim() && (
                    <p className="mt-1 text-sm text-violet-900/80">
                      {mod.broedtekst}
                    </p>
                  )}
                  <fieldset
                    className="mt-3 space-y-2"
                    disabled={courseClosed}
                  >
                    {visibleWorkshopOptions(mod).map((option) => {
                      const enrolled = countWorkshopEnrollments(
                        participants,
                        mod.id,
                        option.id,
                      );
                      const full = isWorkshopOptionFull(
                        participants,
                        mod.id,
                        option,
                      );
                      return (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
                            full
                              ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
                              : form.workshopChoices[mod.id] === option.id
                                ? "border-violet-400 bg-white"
                                : "border-violet-200 bg-white/80"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`workshop-${mod.id}`}
                            value={option.id}
                            checked={form.workshopChoices[mod.id] === option.id}
                            disabled={full || courseClosed}
                            onChange={() =>
                              setWorkshopChoice(mod.id, option.id)
                            }
                            className="mt-1"
                            required
                          />
                          <span>
                            <span className="font-medium text-slate-900">
                              {option.overskrift}
                              {full && " (fuldt)"}
                            </span>
                            {option.underviser.trim() && (
                              <span className="mt-0.5 block text-xs text-slate-600">
                                {option.underviser}
                              </span>
                            )}
                            {option.broedtekst.trim() && (
                              <span className="mt-1 block text-xs text-slate-500">
                                {option.broedtekst}
                              </span>
                            )}
                            <span className="mt-1 block text-xs text-violet-800">
                              {full
                                ? "Lukket"
                                : `${enrolled}/${option.maxDeltagere} pladser optaget`}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </fieldset>
                </div>
              ))}
            </FormSection>
          )}

          <FormSection title="Fotografering og optagelser">
            <p className="text-sm text-stone-600">
              På Brandbjerg Højskole tages der billeder og film med
              gæster/kursister i fokus, til brug på bl.a. sociale medier og
              hjemmesiden. Tilkendegiv herunder, om vi må bruge billeder eller
              video af dig, hvor du er i fokus.
            </p>
            <RadioGroup
              label=""
              name="photoConsent"
              value={form.photoConsent}
              onChange={(v) => update("photoConsent", v as "ja" | "nej")}
              disabled={courseClosed}
              options={[
                { value: "ja", label: "Ja / Yes" },
                { value: "nej", label: "Nej / No" },
              ]}
            />
          </FormSection>

          <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <label className="flex items-start gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.acceptDataTerms}
                onChange={(e) => update("acceptDataTerms", e.target.checked)}
                disabled={courseClosed}
                className="mt-0.5"
                required
              />
              Jeg accepterer betingelserne for databehandling
            </label>
            <label className="flex items-start gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.acceptNewsletter}
                onChange={(e) => update("acceptNewsletter", e.target.checked)}
                disabled={courseClosed}
                className="mt-0.5"
              />
              Jeg accepterer betingelserne for nyhedsbreve
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-4 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-stone-500">Estimeret kursusgebyr</p>
              <p className="text-2xl font-bold text-stone-900">
                {formatDKK(totalPrice)}
              </p>
              <p className="text-xs text-stone-500">
                {avail.kursist.max - avail.kursist.used} pladser tilbage
              </p>
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={courseClosed}
            >
              {courseClosed ? "Tilmelding lukket" : "Send tilmelding"}
            </Button>
          </div>
        </form>
      )}

      <aside className="mt-10 space-y-6 border-t border-stone-200 pt-8 text-sm text-stone-600">
        <div>
          <h2 className="font-semibold text-stone-900">
            Tilmelding, betaling og afbestilling
          </h2>
          <p className="mt-2">
            Betalingsopgørelse modtages pr. mail få dage efter tilmelding.
            Endeligt program sendes ca. 14 dage før kursusstart. Ved afbud
            senere end fire uger før start mister du det indbetalte kursusgebyr
            (indmeldelsesgebyr {formatDKK(INDMELDELSES_GEBYR)} refunderes ikke).
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-stone-900">Indkvartering</h2>
          <p className="mt-2">
            Du indkvarteres i dobbelt- eller enkeltværelse efter valg. Alle
            værelser har eget toilet og bad. Enkeltværelse koster{" "}
            {formatDKK(ENKELTVAERELSE_TILLÆG)} ekstra.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-stone-900">Spørgsmål?</h2>
          <p className="mt-2">
            Kontakt Brandbjerg Højskole på{" "}
            <a href="tel:75871500" className="text-emerald-800 hover:underline">
              75 87 15 00
            </a>{" "}
            eller{" "}
            <a
              href="mailto:bh@brandbjerg.dk"
              className="text-emerald-800 hover:underline"
            >
              bh@brandbjerg.dk
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-stone-500">
          <StatusLine ok={avail.kursist.open} text="Kursistplads" />
          <StatusLine ok={avail.enkelt.open} text="Enkeltværelse" />
          <StatusLine ok={avail.dobbelt.open} text="Dobbeltværelse" />
        </div>
      </aside>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-stone-200 pb-2 text-lg font-semibold text-stone-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex gap-2 rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-950 ${className ?? ""}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  disabled,
  required,
  className,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-100"
      />
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  disabled,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-stone-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm disabled:bg-stone-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RadioGroup({
  label,
  hint,
  name,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  hint?: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      {label && (
        <legend className="text-sm font-medium text-stone-700">{label}</legend>
      )}
      {hint && <p className="mt-0.5 text-xs text-stone-500">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-4">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
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
