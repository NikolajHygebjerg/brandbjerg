"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Image,
  List,
  Mail,
  Send,
  Utensils,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  formatDate,
  getAllModules,
  getIncompleteModules,
  getUnreadyModules,
  isModuleFilled,
  type Course,
  type CourseChecklist,
} from "@/lib/mock-data";

type ChecklistProps = {
  course: Course;
  onUpdateChecklist: (patch: Partial<CourseChecklist>) => void;
  onMarkProgramDone: () => void;
  onGoToModulplan: () => void;
  mockAccountantView?: boolean;
  variant?: "default" | "sidebar";
};

export function CourseChecklistPanel({
  course,
  onUpdateChecklist,
  onMarkProgramDone,
  onGoToModulplan,
  mockAccountantView = false,
  variant = "default",
}: ChecklistProps) {
  const [showMissingModules, setShowMissingModules] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const checklist = course.checklist;
  const allModules = useMemo(() => getAllModules(course), [course]);
  const unreadyModules = useMemo(() => getUnreadyModules(course), [course]);
  const incompleteModules = useMemo(() => getIncompleteModules(course), [course]);

  const allModulesReady =
    allModules.length > 0 && unreadyModules.length === 0;
  const allModulesFilled =
    allModules.length > 0 && incompleteModules.length === 0;

  const daysUntilStart = Math.ceil(
    (new Date(course.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const welcomeReminderDue = daysUntilStart <= 21 && daysUntilStart > 0;

  const items = [
    {
      id: "program",
      label: "Kursusprogram planlagt",
      done: checklist.programPlanned,
      hint: "Markér færdig når alle moduler er udfyldt",
      icon: List,
    },
    {
      id: "modules-ready",
      label: "Alle moduler klar",
      done: allModulesReady,
      hint: `${allModules.length - unreadyModules.length}/${allModules.length} moduler meldt klar`,
      icon: CheckCircle2,
      hasDetail: unreadyModules.length > 0,
    },
    {
      id: "economy",
      label: "Økonomi godkendt",
      done: checklist.economyStatus === "approved",
      hint:
        checklist.economyStatus === "approved"
          ? "Godkendt af bogholder"
          : checklist.economyStatus === "sent"
            ? "Afventer bogholder"
            : "Send økonomiforslag til bogholder",
      icon: CheckCircle2,
    },
    {
      id: "kmr",
      label: "Billeder uploadet til KMR",
      done: checklist.kmrImagesUploaded,
      hint: checklist.kmrImageCount
        ? `${checklist.kmrImageCount} billeder uploadet`
        : "Upload til markedsføringsafdelingen",
      icon: Image,
    },
    {
      id: "website",
      label: "Tekst til hjemmesiden klar",
      done: checklist.websiteTextDone,
      hint: "Tekst der vises over programmet på hjemmesiden",
      icon: List,
    },
    {
      id: "kitchen",
      label: "Køkkenplan udfyldt",
      done: checklist.kitchenPlanSent,
      hint: "Måltider, kaffepauser, madpakker m.m.",
      icon: Utensils,
    },
    {
      id: "pedel",
      label: "Pedelplan udfyldt",
      hint: "Ønsker til lokaleopsætning",
      done: checklist.pedelPlanSent,
      icon: Wrench,
    },
    {
      id: "welcome",
      label: "Sendt velkomstbrev",
      done: checklist.welcomeLetterSent,
      hint: welcomeReminderDue
        ? `Påmindelse: ${daysUntilStart} dage til kursus — send nu`
        : "Skabelon redigeres og sendes 3 uger før",
      icon: Mail,
      urgent: welcomeReminderDue && !checklist.welcomeLetterSent,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const isSidebar = variant === "sidebar";

  const content = (
    <>
      <div
        className={
          isSidebar
            ? "flex flex-col gap-2"
            : "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
        }
      >
        <div>
          <CardTitle className={isSidebar ? "text-sm" : undefined}>
            Kursus-checkliste
          </CardTitle>
          <CardDescription className={isSidebar ? "text-xs" : undefined}>
            {isSidebar ? (
              <>
                {course.title} · {doneCount}/{items.length} færdige
              </>
            ) : (
              <>
                Kursusleder kan altid se hvad der mangler · {doneCount}/
                {items.length} færdige
              </>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 overflow-hidden rounded-full bg-slate-200 ${isSidebar ? "w-full flex-1" : "w-32"}`}
          >
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{
                width: `${Math.round((doneCount / items.length) * 100)}%`,
              }}
            />
          </div>
          <span
            className={`font-medium text-slate-700 ${isSidebar ? "text-xs" : "text-sm"}`}
          >
            {Math.round((doneCount / items.length) * 100)}%
          </span>
        </div>
      </div>

      <ul className={`space-y-2 ${isSidebar ? "mt-3" : "mt-4"}`}>
        {items.map((item) => {
          const isOpen = expandedId === item.id;
          return (
            <li
              key={item.id}
              className={`rounded-lg border ${
                item.urgent
                  ? "border-amber-300 bg-amber-50"
                  : item.done
                    ? "border-emerald-100 bg-emerald-50/50"
                    : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`flex items-center gap-2 ${isSidebar ? "p-2" : "gap-3 p-3"}`}
              >
                {item.done ? (
                  <CheckCircle2
                    className={`shrink-0 text-emerald-600 ${isSidebar ? "h-4 w-4" : "h-5 w-5"}`}
                  />
                ) : item.urgent ? (
                  <AlertCircle
                    className={`shrink-0 text-amber-600 ${isSidebar ? "h-4 w-4" : "h-5 w-5"}`}
                  />
                ) : (
                  <Circle
                    className={`shrink-0 text-slate-300 ${isSidebar ? "h-4 w-4" : "h-5 w-5"}`}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium ${
                      isSidebar ? "text-xs" : "text-sm"
                    } ${item.done ? "text-emerald-900" : "text-slate-900"}`}
                  >
                    {item.label}
                  </p>
                  {!isSidebar && (
                    <p className="text-xs text-slate-500">{item.hint}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {item.id === "modules-ready" && item.hasDetail && (
                    <button
                      type="button"
                      onClick={() => setShowMissingModules(!showMissingModules)}
                      className={`rounded-lg bg-slate-100 font-medium text-slate-700 hover:bg-slate-200 ${
                        isSidebar ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
                      }`}
                    >
                      {isSidebar
                        ? `(${unreadyModules.length})`
                        : `Se manglende (${unreadyModules.length})`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isSidebar && !isOpen && (
                <p className="px-2 pb-2 text-[10px] leading-snug text-slate-500">
                  {item.hint}
                </p>
              )}

              {item.id === "modules-ready" && showMissingModules && (
                <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="mb-2 text-xs font-semibold text-slate-600">
                    Moduler der mangler at meldes klar:
                  </p>
                  {unreadyModules.length === 0 ? (
                    <p className="text-xs text-emerald-700">Alle moduler er klar</p>
                  ) : (
                    <ul className="space-y-1">
                      {unreadyModules.map((m) => (
                        <li key={m.id} className="text-xs text-slate-700">
                          · {m.dayLabel}: {m.overskrift || "Uden titel"}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    onClick={onGoToModulplan}
                    variant="ghost"
                    className="mt-2 h-8 text-xs"
                  >
                    Gå til modulplan
                  </Button>
                </div>
              )}

              {isOpen && (
                <div className="border-t border-slate-100 p-3">
                  <ChecklistAction
                    itemId={item.id}
                    course={course}
                    checklist={checklist}
                    allModulesFilled={allModulesFilled}
                    mockAccountantView={mockAccountantView}
                    onUpdateChecklist={onUpdateChecklist}
                    onMarkProgramDone={onMarkProgramDone}
                    onGoToModulplan={onGoToModulplan}
                    incompleteModules={incompleteModules}
                    compact={isSidebar}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  if (isSidebar) {
    return <div className="min-w-0">{content}</div>;
  }

  return (
    <Card className="border-emerald-200">
      {content}
    </Card>
  );
}

function ChecklistAction({
  itemId,
  course,
  checklist,
  allModulesFilled,
  mockAccountantView,
  onUpdateChecklist,
  onMarkProgramDone,
  onGoToModulplan,
  incompleteModules,
  compact = false,
}: {
  itemId: string;
  course: Course;
  checklist: CourseChecklist;
  allModulesFilled: boolean;
  mockAccountantView: boolean;
  onUpdateChecklist: (patch: Partial<CourseChecklist>) => void;
  onMarkProgramDone: () => void;
  onGoToModulplan: () => void;
  incompleteModules: ReturnType<typeof getIncompleteModules>;
  compact?: boolean;
}) {
  const buttonClass = compact ? "h-7 text-[11px]" : "h-8 text-xs";
  switch (itemId) {
    case "program":
      return (
        <div className="space-y-2">
          {!allModulesFilled && incompleteModules.length > 0 && (
            <p className="text-xs text-amber-700">
              {incompleteModules.length} modul(er) mangler udfyldning (overskrift,
              underviser eller tid).
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onMarkProgramDone}
              disabled={!allModulesFilled || checklist.programPlanned}
              className={buttonClass}
            >
              {checklist.programPlanned ? "Program markeret færdigt" : "Færdig"}
            </Button>
            <Button
              onClick={onGoToModulplan}
              variant="secondary"
              className={buttonClass}
            >
              Rediger modulplan
            </Button>
          </div>
        </div>
      );

    case "modules-ready":
      return (
        <p className="text-xs text-slate-600">
          Markér hvert modul som &quot;Klar&quot; i modulplanen, når f.eks.
          foredragsholder er booket. Brug &quot;Se manglende&quot; for overblik.
        </p>
      );

    case "economy":
      return (
        <div className="space-y-2">
          <p className="text-xs text-slate-600">
            Budget: {course.budget.toLocaleString("da-DK")} kr · Marketing:{" "}
            {course.marketingBudget.toLocaleString("da-DK")} kr
          </p>
          {checklist.economyStatus === "pending" && (
            <Button
              onClick={() => onUpdateChecklist({ economyStatus: "sent" })}
              className={buttonClass}
            >
              <Send className="h-3.5 w-3.5" />
              Send økonomiforslag til bogholder
            </Button>
          )}
          {checklist.economyStatus === "sent" && (
            <div className="space-y-2">
              <p className="text-xs text-amber-700">Afventer godkendelse fra bogholder</p>
              {mockAccountantView && (
                <Button
                  onClick={() => onUpdateChecklist({ economyStatus: "approved" })}
                  variant="secondary"
                  className={buttonClass}
                >
                  Bogholder: Godkend (mock)
                </Button>
              )}
            </div>
          )}
          {checklist.economyStatus === "approved" && (
            <p className="text-xs text-emerald-700">Økonomi er godkendt</p>
          )}
        </div>
      );

    case "kmr":
      return (
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600">
            <Image className="h-4 w-4" />
            <span>Klik for at uploade billeder til KMR (mock)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const count = e.target.files?.length ?? 0;
                if (count > 0) {
                  onUpdateChecklist({
                    kmrImagesUploaded: true,
                    kmrImageCount: count,
                  });
                }
              }}
            />
          </label>
          {checklist.kmrImagesUploaded && (
            <p className="text-xs text-emerald-700">
              {checklist.kmrImageCount} billede(r) sendt til KMR
            </p>
          )}
        </div>
      );

    case "website":
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">
            Tekst over programmet på hjemmesiden
          </label>
          <textarea
            value={checklist.websiteText}
            onChange={(e) =>
              onUpdateChecklist({
                websiteText: e.target.value,
                websiteTextDone: e.target.value.trim().length > 20,
              })
            }
            rows={4}
            placeholder="Skriv en kort introduktion til kurset..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      );

    case "kitchen":
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">
            Køkkenplan — måltider, kaffepauser, madpakker m.m.
          </label>
          <textarea
            value={checklist.kitchenPlan}
            onChange={(e) => onUpdateChecklist({ kitchenPlan: e.target.value })}
            rows={4}
            placeholder="Fx: Fredag frokost 12:30 — vegetar. Lørdag morgenmad 8:00..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <Button
            onClick={() => onUpdateChecklist({ kitchenPlanSent: true })}
            disabled={!checklist.kitchenPlan.trim() || checklist.kitchenPlanSent}
            className={buttonClass}
          >
            <Send className="h-3.5 w-3.5" />
            {checklist.kitchenPlanSent ? "Sendt til køkken" : "Send til køkken"}
          </Button>
        </div>
      );

    case "pedel":
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">
            Pedelplan — lokaleopsætning og praktiske ønsker
          </label>
          <textarea
            value={checklist.pedelPlan}
            onChange={(e) => onUpdateChecklist({ pedelPlan: e.target.value })}
            rows={4}
            placeholder="Fx: Stole i cirkel, ekstra borde i atelier, ophængning af billeder..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <Button
            onClick={() => onUpdateChecklist({ pedelPlanSent: true })}
            disabled={!checklist.pedelPlan.trim() || checklist.pedelPlanSent}
            className={buttonClass}
          >
            <Send className="h-3.5 w-3.5" />
            {checklist.pedelPlanSent ? "Sendt til pedel" : "Send til pedel"}
          </Button>
        </div>
      );

    case "welcome":
      return (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Kursus starter {formatDate(course.startDate)}. Påmindelse 3 uger før.
          </p>
          <label className="text-xs font-medium text-slate-500">
            Velkomstbrev (skabelon — redigeres her)
          </label>
          <textarea
            value={checklist.welcomeLetterDraft}
            onChange={(e) =>
              onUpdateChecklist({ welcomeLetterDraft: e.target.value })
            }
            rows={5}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <Button
            onClick={() => onUpdateChecklist({ welcomeLetterSent: true })}
            disabled={checklist.welcomeLetterSent}
            className={buttonClass}
          >
            <Mail className="h-3.5 w-3.5" />
            {checklist.welcomeLetterSent ? "Velkomstbrev sendt" : "Send velkomstbrev"}
          </Button>
        </div>
      );

    default:
      return null;
  }
}
