"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  GripVertical,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KursuslederSurveyForm } from "@/components/mockup/kursusleder-survey-form";
import {
  getSurveyPublicUrl,
  groupQuestionsBySection,
  listSurveyResponses,
  resetSurveyToDefault,
  saveSurveyConfig,
} from "@/lib/kursusleder-survey-storage";
import type {
  CourseSurveyConfig,
  SurveyQuestion,
  SurveyQuestionType,
} from "@/lib/kursusleder-survey-types";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<SurveyQuestionType, string> = {
  course_info: "Kursusinfo",
  single: "Enkeltvalg",
  multiple: "Flervalg",
  nps: "NPS (0–10)",
  interval: "Skala",
  text: "Tekst",
};

type Tab = "rediger" | "svar" | "forhåndsvis";

export function KursuslederSurveyEditor({
  initialConfig,
}: {
  initialConfig: CourseSurveyConfig;
}) {
  const [config, setConfig] = useState(initialConfig);
  const [tab, setTab] = useState<Tab>("rediger");
  const [expandedId, setExpandedId] = useState<string | null>(
    initialConfig.questions[0]?.id ?? null,
  );
  const [copied, setCopied] = useState(false);

  const sections = useMemo(
    () => groupQuestionsBySection(config.questions),
    [config.questions],
  );
  const responses = useMemo(
    () => listSurveyResponses(config.courseId),
    [config.courseId, tab],
  );

  function persist(next: CourseSurveyConfig) {
    const saved = saveSurveyConfig(next);
    setConfig(saved);
  }

  function updateQuestion(id: string, patch: Partial<SurveyQuestion>) {
    persist({
      ...config,
      questions: config.questions.map((q) =>
        q.id === id ? { ...q, ...patch } : q,
      ),
    });
  }

  function addOption(id: string) {
    const q = config.questions.find((x) => x.id === id);
    if (!q) return;
    updateQuestion(id, { options: [...(q.options ?? []), "Ny mulighed"] });
  }

  function updateOption(id: string, index: number, value: string) {
    const q = config.questions.find((x) => x.id === id);
    if (!q?.options) return;
    const options = [...q.options];
    options[index] = value;
    updateQuestion(id, { options });
  }

  function removeOption(id: string, index: number) {
    const q = config.questions.find((x) => x.id === id);
    if (!q?.options) return;
    updateQuestion(id, {
      options: q.options.filter((_, i) => i !== index),
    });
  }

  function copyLink() {
    void navigator.clipboard.writeText(getSurveyPublicUrl(config.courseId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Evalueringslink til kursister</CardTitle>
            <CardDescription className="mt-1">
              Del linket med deltagere når kurset er afsluttet
            </CardDescription>
            <code className="mt-3 block break-all rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-800">
              {getSurveyPublicUrl(config.courseId)}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" className="gap-2" onClick={copyLink}>
              <Copy className="size-4" />
              {copied ? "Kopieret!" : "Kopiér link"}
            </Button>
            <a
              href={getSurveyPublicUrl(config.courseId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ExternalLink className="size-4" />
              Åbn
            </a>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.published}
            onChange={(e) => persist({ ...config, published: e.target.checked })}
          />
          Evaluering er aktiv — kursister kan udfylde via linket
        </label>
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {(
          [
            ["rediger", "Tilret spørgsmål"],
            ["svar", `Svar (${responses.length})`],
            ["forhåndsvis", "Forhåndsvis"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              tab === key
                ? "bg-teal-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "rediger" && (
        <>
          <Card>
            <CardTitle className="text-base">Introduktion</CardTitle>
            <textarea
              value={config.introduction}
              onChange={(e) =>
                persist({ ...config, introduction: e.target.value })
              }
              rows={4}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => {
                if (
                  window.confirm(
                    "Nulstil alle spørgsmål til Players 1st-skabelonen?",
                  )
                ) {
                  setConfig(resetSurveyToDefault(config.courseId));
                }
              }}
            >
              <RotateCcw className="size-4" />
              Nulstil til standard
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => setTab("forhåndsvis")}
            >
              <Eye className="size-4" />
              Forhåndsvis
            </Button>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-teal-900">
                  {section.title}
                </h3>
                {section.instruction && (
                  <p className="text-xs text-slate-500">{section.instruction}</p>
                )}
                <div className="mt-3 space-y-2">
                  {section.questions.map((q) => (
                    <QuestionEditorRow
                      key={q.id}
                      question={q}
                      expanded={expandedId === q.id}
                      onToggle={() =>
                        setExpandedId((id) => (id === q.id ? null : q.id))
                      }
                      onChange={(patch) => updateQuestion(q.id, patch)}
                      onAddOption={() => addOption(q.id)}
                      onUpdateOption={(i, v) => updateOption(q.id, i, v)}
                      onRemoveOption={(i) => removeOption(q.id, i)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "svar" && (
        <SurveyResponsesList
          config={config}
          responses={responses}
        />
      )}

      {tab === "forhåndsvis" && (
        <KursuslederSurveyForm config={config} preview />
      )}
    </div>
  );
}

function QuestionEditorRow({
  question,
  expanded,
  onToggle,
  onChange,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: {
  question: SurveyQuestion;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<SurveyQuestion>) => void;
  onAddOption: () => void;
  onUpdateOption: (index: number, value: string) => void;
  onRemoveOption: (index: number) => void;
}) {
  const hasOptions =
    question.type === "single" || question.type === "multiple";

  return (
    <div
      className={cn(
        "rounded-lg border bg-white transition",
        question.enabled ? "border-slate-200" : "border-slate-100 opacity-60",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <GripVertical className="mt-0.5 size-4 shrink-0 text-slate-300" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600">
              {TYPE_LABELS[question.type]}
            </span>
            {!question.enabled && (
              <span className="text-[10px] text-slate-400">(skjult)</span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">
            {question.text}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Spørgsmålstekst</span>
            <textarea
              value={question.text}
              onChange={(e) => onChange({ text: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={question.enabled}
                onChange={(e) => onChange({ enabled: e.target.checked })}
              />
              Aktiv
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onChange({ required: e.target.checked })}
              />
              Obligatorisk
            </label>
            {question.type === "multiple" && (
              <label className="flex items-center gap-2">
                Max valg:
                <input
                  type="number"
                  min={1}
                  value={question.maxSelections ?? 3}
                  onChange={(e) =>
                    onChange({ maxSelections: Number(e.target.value) || 3 })
                  }
                  className="w-16 rounded border border-slate-200 px-2 py-1"
                />
              </label>
            )}
            {(question.type === "interval" || question.type === "nps") &&
              question.allowNa !== undefined && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={question.allowNa}
                    onChange={(e) => onChange({ allowNa: e.target.checked })}
                  />
                  Tillad &quot;Ved ikke&quot;
                </label>
              )}
          </div>

          {hasOptions && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Svarmuligheder
              </p>
              <ul className="mt-2 space-y-2">
                {question.options?.map((opt, i) => (
                  <li key={`${question.id}-opt-${i}`} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => onUpdateOption(i, e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveOption(i)}
                      className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Fjern mulighed"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="secondary"
                className="mt-2 h-8 gap-1 text-xs"
                onClick={onAddOption}
              >
                <Plus className="size-3.5" />
                Tilføj mulighed
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SurveyResponsesList({
  config,
  responses,
}: {
  config: CourseSurveyConfig;
  responses: ReturnType<typeof listSurveyResponses>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const questionMap = new Map(config.questions.map((q) => [q.id, q]));

  if (responses.length === 0) {
    return (
      <Card>
        <CardDescription>
          Ingen svar endnu — del evalueringslinket med kursisterne.
        </CardDescription>
      </Card>
    );
  }

  const npsQuestion = config.questions.find((q) => q.id === "ot-nps");
  const npsScores = responses
    .map((r) => r.answers["ot-nps"])
    .filter((v): v is number => typeof v === "number");
  const avgNps =
    npsScores.length > 0
      ? (npsScores.reduce((a, b) => a + b, 0) / npsScores.length).toFixed(1)
      : null;

  return (
    <div className="space-y-4">
      {avgNps && npsQuestion && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardDescription>Gns. anbefalingsscore (NPS-spørgsmål)</CardDescription>
          <CardTitle className="text-3xl text-teal-950">{avgNps} / 10</CardTitle>
          <p className="text-xs text-teal-800">
            Baseret på {npsScores.length} svar
          </p>
        </Card>
      )}

      {responses.map((record) => (
        <div
          key={record.id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Svar modtaget{" "}
                {new Date(record.submittedAt).toLocaleString("da-DK")}
              </p>
              <p className="text-xs text-slate-500">
                {Object.keys(record.answers).length} besvarelser
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setExpandedId((id) => (id === record.id ? null : record.id))
              }
              className="text-xs font-medium text-teal-800 hover:underline"
            >
              {expandedId === record.id ? "Skjul" : "Vis alle svar"}
            </button>
          </div>

          {expandedId === record.id && (
            <dl className="mt-4 max-h-96 space-y-3 overflow-y-auto text-sm">
              {Object.entries(record.answers).map(([qid, ans]) => {
                const q = questionMap.get(qid);
                if (!q) return null;
                const display =
                  ans === "na"
                    ? "Ved ikke"
                    : Array.isArray(ans)
                      ? ans.join(", ")
                      : String(ans ?? "—");
                return (
                  <div key={qid} className="border-t border-slate-100 pt-2">
                    <dt className="text-xs text-slate-500">{q.text}</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">
                      {display}
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </div>
      ))}
    </div>
  );
}
