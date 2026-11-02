"use client";

import { getSupabaseBrowserClient, isConfigured } from "./supabase/client";

/**
 * Progress storage.
 *
 * Signed in: rows go to Supabase and follow you between devices.
 * Not signed in: the same shape is kept in localStorage, so the course is
 * still usable before any setup. Reads merge both, preferring the server.
 */

const LOCAL_KEY = "trace:progress";

export type DayProgress = {
  dayKey: string;
  completedAt: string | null;
  quizScore: number | null;
  quizTotal: number | null;
};

function readLocal(): Record<string, DayProgress> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DayProgress>) : {};
  } catch {
    return {};
  }
}

function writeLocal(all: Record<string, DayProgress>): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch {
    // Private window, or site data blocked. Progress is best-effort here.
  }
}

export async function loadProgress(): Promise<Record<string, DayProgress>> {
  const local = readLocal();
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return local;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return local;

  const { data, error } = await supabase
    .from("progress")
    .select("day_key, completed_at, quiz_score, quiz_total");
  if (error || !data) return local;

  const merged = { ...local };
  for (const row of data) {
    merged[row.day_key] = {
      dayKey: row.day_key,
      completedAt: row.completed_at,
      quizScore: row.quiz_score,
      quizTotal: row.quiz_total,
    };
  }
  return merged;
}

export async function saveDay(entry: DayProgress): Promise<void> {
  const local = readLocal();
  local[entry.dayKey] = entry;
  writeLocal(local);

  if (!isConfigured()) return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  await supabase.from("progress").upsert(
    {
      user_id: auth.user.id,
      day_key: entry.dayKey,
      completed_at: entry.completedAt,
      quiz_score: entry.quizScore,
      quiz_total: entry.quizTotal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,day_key" },
  );
}
