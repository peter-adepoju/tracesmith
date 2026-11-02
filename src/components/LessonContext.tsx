"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Tells components inside a lesson which day they are on.
 *
 * MDX cannot pass a callback to a component, so a quiz has no way to know
 * where to save its score. This supplies it from the page instead.
 */
const LessonContext = createContext<{ dayKey: string | null }>({ dayKey: null });

export function LessonProvider({
  dayKey,
  children,
}: {
  dayKey: string;
  children: ReactNode;
}) {
  return (
    <LessonContext.Provider value={{ dayKey }}>{children}</LessonContext.Provider>
  );
}

export function useLessonDay(): string | null {
  return useContext(LessonContext).dayKey;
}
