"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Course, CourseChecklist } from "@/lib/mock-data";

export type CourseDetailSessionApi = {
  course: Course;
  updateChecklist: (patch: Partial<CourseChecklist>) => void;
  onMarkProgramDone: () => void;
  onGoToModulplan: () => void;
  mockAccountantView: boolean;
  setMockAccountantView: (value: boolean) => void;
};

type CourseDetailSessionContextValue = {
  session: CourseDetailSessionApi | null;
  registerSession: (api: CourseDetailSessionApi | null) => void;
};

const CourseDetailSessionContext =
  createContext<CourseDetailSessionContextValue | null>(null);

export function CourseDetailSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] = useState<CourseDetailSessionApi | null>(null);

  const registerSession = useCallback((api: CourseDetailSessionApi | null) => {
    setSession(api);
  }, []);

  const value = useMemo(
    () => ({ session, registerSession }),
    [session, registerSession],
  );

  return (
    <CourseDetailSessionContext.Provider value={value}>
      {children}
    </CourseDetailSessionContext.Provider>
  );
}

export function useCourseDetailSession() {
  const ctx = useContext(CourseDetailSessionContext);
  if (!ctx) {
    throw new Error(
      "useCourseDetailSession must be used within CourseDetailSessionProvider",
    );
  }
  return ctx;
}
