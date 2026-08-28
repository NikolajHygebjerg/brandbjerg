"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getEnabledQuestions,
  groupQuestionsBySection,
} from "@/lib/kursusleder-survey-storage";
import {
  SURVEY_SCALE_LABELS,
  type CourseSurveyConfig,
  type SurveyAnswerValue,
  type SurveyQuestion,
} from "@/lib/kursusleder-survey-types";
import { cn } from "@/lib/utils";

type KursuslederSurveyFormProps = {
  config: CourseSurveyConfig;
  preview?: boolean;
  onSubmit?: (answers: Record<string, SurveyAnswerValue>) => void;
};

export function KursuslederSurveyForm({
  config,
  preview = false,
  onSubmit,
}: KursuslederSurveyFormProps) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SurveyAnswerValue>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const enabled = useMemo(() => getEnabledQuestions(config), [config]);
  const sections = useMemo(() => groupQuestionsBySection(enabled), [enabled]);

  const totalSteps = sections.length;
  const current = sections[step];
  const progress = totalSteps > 0 ? (step + 1) / totalSteps : 0;

  function setAnswer(id: string, value: SurveyAnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function validateSection(sectionQuestions: SurveyQuestion[]): boolean {
    const nextErrors: Record<string, string> = {};
    for (const q of sectionQuestions) {
      if (!q.required) continue;
      const value = answers[q.id];
      if (q.type === "course_info") {
        if (!config.courseTitle.trim()) {
          nextErrors[q.id] = "Kursus mangler";
        }
        continue;
      }
      if (value === null || value === undefined || value === "") {
        nextErrors[q.id] = "Besvar venligst dette spørgsmål";
      }
      if (q.type === "multiple" && Array.isArray(value) && value.length === 0) {
        nextErrors[q.id] = "Vælg mindst én mulighed";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleNext() {
    if (!current) return;
    if (!validateSection(current.questions)) return;
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const finalAnswers = { ...answers };
      finalAnswers["bg-kursus"] = config.courseTitle;
      onSubmit?.(finalAnswers);
      if (!preview) setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-teal-200 bg-teal-50 p-8 text-center">
        <h2 className="text-xl font-bold text-teal-950">Tak for din evaluering!</h2>
        <p className="mt-2 text-sm text-teal-900">
          Din feedback hjælper os med at gøre fremtidige kurser endnu bedre.
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
            Brandbjerg Højskole
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Kursusevaluering — {config.courseTitle}
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
            {config.introduction}
          </p>
          {preview && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Forhåndsvisning — svar gemmes ikke.
            </p>
          )}
        </div>
        <Button type="button" className="w-full" onClick={() => setStarted(true)}>
          Start evaluering
        </Button>
      </div>
    );
  }

  if (!current) {
    return (
      <p className="text-center text-sm text-slate-500">
        Ingen aktive spørgsmål i evalueringen.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-teal-600 transition-transform duration-300"
          style={{ transform: `scaleX(${progress})`, transformOrigin: "left" }}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
          {current.title}
        </p>
        {current.instruction && (
          <p className="mt-1 text-sm text-slate-500">{current.instruction}</p>
        )}

        <div className="mt-6 space-y-8">
          {current.questions.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              courseTitle={config.courseTitle}
              value={answers[q.id] ?? null}
              error={errors[q.id]}
              onChange={(v) => setAnswer(q.id, v)}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="gap-1"
        >
          <ChevronLeft className="size-4" />
          Forrige
        </Button>
        <span className="text-xs text-slate-500">
          {step + 1} / {totalSteps}
        </span>
        <Button type="button" onClick={handleNext} className="gap-1">
          {step < totalSteps - 1 ? (
            <>
              Næste
              <ChevronRight className="size-4" />
            </>
          ) : preview ? (
            "Afslut forhåndsvisning"
          ) : (
            "Afslut"
          )}
        </Button>
      </div>
    </div>
  );
}

function QuestionField({
  question,
  courseTitle,
  value,
  error,
  onChange,
}: {
  question: SurveyQuestion;
  courseTitle: string;
  value: SurveyAnswerValue;
  error?: string;
  onChange: (value: SurveyAnswerValue) => void;
}) {
  if (question.type === "course_info") {
    return (
      <fieldset>
        <legend className="text-sm font-medium text-slate-900">
          {question.text}
        </legend>
        <p className="mt-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-950">
          {courseTitle}
        </p>
      </fieldset>
    );
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-900">
        {question.text}
        {question.required && <span className="text-red-500"> *</span>}
      </legend>

      {question.type === "single" && question.options && (
        <div className="mt-3 space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition",
                value === opt
                  ? "border-teal-400 bg-teal-50"
                  : "border-slate-200 hover:border-slate-300",
              )}
            >
              <input
                type="radio"
                name={question.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="text-teal-700"
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {question.type === "multiple" && question.options && (
        <div className="mt-3 space-y-2">
          {question.maxSelections && (
            <p className="text-xs text-slate-500">
              Vælg op til {question.maxSelections} muligheder
            </p>
          )}
          {question.options.map((opt) => {
            const selected = Array.isArray(value) ? value : [];
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition",
                  checked
                    ? "border-teal-400 bg-teal-50"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked) {
                      onChange(selected.filter((v) => v !== opt));
                    } else if (
                      !question.maxSelections ||
                      selected.length < question.maxSelections
                    ) {
                      onChange([...selected, opt]);
                    }
                  }}
                  className="rounded text-teal-700"
                />
                {opt}
              </label>
            );
          })}
        </div>
      )}

      {(question.type === "nps" || question.type === "interval") && (
        <ScaleInput question={question} value={value} onChange={onChange} />
      )}

      {question.type === "text" && (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          rows={question.multiline ? 4 : 2}
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Skriv dit svar…"
        />
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}

function ScaleInput({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: SurveyAnswerValue;
  onChange: (value: SurveyAnswerValue) => void;
}) {
  const min = question.scaleMin ?? (question.type === "nps" ? 0 : 1);
  const max = question.scaleMax ?? 10;
  const labels = question.scale
    ? SURVEY_SCALE_LABELS[question.scale]
    : SURVEY_SCALE_LABELS.satisfaction;
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-1.5">
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium tabular-nums transition",
              value === n
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300",
            )}
          >
            {n}
          </button>
        ))}
        {question.allowNa && (
          <button
            type="button"
            onClick={() => onChange("na")}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs font-medium transition",
              value === "na"
                ? "border-slate-600 bg-slate-600 text-white"
                : "border-slate-200 text-slate-600 hover:border-slate-400",
            )}
          >
            Ved ikke
          </button>
        )}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-500">
        <span>{labels.low}</span>
        <span>{labels.high}</span>
      </div>
    </div>
  );
}
