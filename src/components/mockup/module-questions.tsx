"use client";

import { useEffect, useState } from "react";
import { AlertCircle, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addModuleQuestion,
  countUnansweredForModule,
  countUnansweredQuestions,
  departmentLabel,
  formatQuestionTime,
  getUnansweredQuestions,
  replyToModuleQuestion,
  QUESTIONS_UPDATED_EVENT,
  type ModuleQuestion,
  type QuestionDepartment,
} from "@/lib/module-questions-storage";

type AskQuestionButtonProps = {
  courseId: string;
  moduleId: string;
  department: QuestionDepartment;
  moduleLabel: string;
  compact?: boolean;
};

export function AskQuestionButton({
  courseId,
  moduleId,
  department,
  moduleLabel,
  compact = false,
}: AskQuestionButtonProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  function refresh() {
    setPendingCount(
      getUnansweredQuestions(courseId, { department, moduleId }).length,
    );
  }

  useEffect(() => {
    refresh();
    function onUpdate() {
      refresh();
    }
    window.addEventListener(QUESTIONS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(QUESTIONS_UPDATED_EVENT, onUpdate);
  }, [courseId, moduleId, department]);

  function handleSubmit() {
    if (!text.trim()) return;
    addModuleQuestion(courseId, department, moduleId, text);
    setText("");
    setOpen(false);
    refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition ${
          compact
            ? "px-2 py-1 text-xs"
            : "px-2.5 py-1.5 text-sm"
        } ${
          pendingCount > 0
            ? "bg-red-50 text-red-700 hover:bg-red-100"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        {pendingCount > 0 ? (
          <AlertCircle className="h-3.5 w-3.5" />
        ) : (
          <MessageCircleQuestion className="h-3.5 w-3.5" />
        )}
        Spørg kursusleder
        {pendingCount > 0 && (
          <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Luk"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900">
              Spørgsmål til kursusleder
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {departmentLabel(department)} · {moduleLabel}
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Skriv dit spørgsmål her…"
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Annuller
              </Button>
              <Button onClick={handleSubmit} disabled={!text.trim()}>
                Send spørgsmål
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function QuestionCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white"
      title={`${count} ubesvarede spørgsmål`}
    >
      {count}
    </span>
  );
}

export function useCourseQuestionCount(courseId: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refresh() {
      setCount(countUnansweredQuestions(courseId));
    }
    refresh();
    function onUpdate() {
      refresh();
    }
    window.addEventListener(QUESTIONS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(QUESTIONS_UPDATED_EVENT, onUpdate);
  }, [courseId]);

  return count;
}

export function ModuleQuestionAlert({
  courseId,
  moduleId,
}: {
  courseId: string;
  moduleId: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refresh() {
      setCount(countUnansweredForModule(courseId, moduleId));
    }
    refresh();
    function onUpdate() {
      refresh();
    }
    window.addEventListener(QUESTIONS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(QUESTIONS_UPDATED_EVENT, onUpdate);
  }, [courseId, moduleId]);

  if (count <= 0) return null;

  return (
    <span
      className="inline-flex items-center text-red-600"
      title={`${count} ubesvaret spørgsmål`}
    >
      <AlertCircle className="h-4 w-4" />
    </span>
  );
}

export function ModuleQuestionsReplyPanel({
  courseId,
  moduleId,
}: {
  courseId: string;
  moduleId: string;
}) {
  const [questions, setQuestions] = useState<ModuleQuestion[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});

  function refresh() {
    setQuestions(getUnansweredQuestions(courseId, { moduleId }));
  }

  useEffect(() => {
    refresh();
    function onUpdate() {
      refresh();
    }
    window.addEventListener(QUESTIONS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(QUESTIONS_UPDATED_EVENT, onUpdate);
  }, [courseId, moduleId]);

  if (questions.length === 0) return null;

  function handleReply(questionId: string) {
    const reply = replies[questionId]?.trim();
    if (!reply) return;
    replyToModuleQuestion(courseId, questionId, reply);
    setReplies((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    refresh();
  }

  return (
    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <p className="text-sm font-semibold text-red-900">
          Spørgsmål fra køkken / pedel ({questions.length})
        </p>
      </div>
      <ul className="mt-3 space-y-4">
        {questions.map((q) => (
          <li
            key={q.id}
            className="rounded-lg border border-red-100 bg-white p-3"
          >
            <p className="text-xs font-medium text-slate-500">
              {departmentLabel(q.department)} ·{" "}
              {formatQuestionTime(q.createdAt)}
            </p>
            <p className="mt-1 text-sm text-slate-900">{q.text}</p>
            <textarea
              value={replies[q.id] ?? ""}
              onChange={(e) =>
                setReplies((prev) => ({ ...prev, [q.id]: e.target.value }))
              }
              rows={2}
              placeholder="Skriv svar til køkken/pedel — ret evt. felterne nedenfor"
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <Button
              className="mt-2 h-8 text-xs"
              onClick={() => handleReply(q.id)}
              disabled={!replies[q.id]?.trim()}
            >
              Send svar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
