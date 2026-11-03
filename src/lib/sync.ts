"use client";

import { getSupabaseBrowserClient } from "./supabase/client";
import type { DayProgress } from "./progress";
import type { StoredCard } from "./cards";

/**
 * Lift guest progress into the account, once, on sign-in.
 *
 * Everything works in guest mode, so by the time someone signs in they may
 * already have weeks of progress sitting in localStorage. Without this it
 * would stay on that one device forever, which quietly makes "your progress
 * follows you between devices" untrue.
 *
 * The rule is conservative: upload only what the account does not already
 * have. The server is never overwritten, so signing in on a second device
 * cannot clobber real progress with a stale local copy.
 */

const PROGRESS_KEY = "trace:progress";
const CARDS_KEY = "trace:cards";

function readLocal<T>(key: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, T>) : {};
  } catch {
    return {};
  }
}

export type SyncResult = { progress: number; cards: number };

export async function syncLocalToAccount(): Promise<SyncResult | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const result: SyncResult = { progress: 0, cards: 0 };

  // --- Progress -----------------------------------------------------------
  const localProgress = readLocal<DayProgress>(PROGRESS_KEY);
  const localDays = Object.values(localProgress).filter((d) => d?.dayKey);

  if (localDays.length > 0) {
    const { data: serverRows } = await supabase
      .from("progress")
      .select("day_key");
    const known = new Set((serverRows ?? []).map((r) => r.day_key));

    const missing = localDays.filter((d) => !known.has(d.dayKey));
    if (missing.length > 0) {
      const { error } = await supabase.from("progress").upsert(
        missing.map((d) => ({
          user_id: user.id,
          day_key: d.dayKey,
          completed_at: d.completedAt,
          quiz_score: d.quizScore,
          quiz_total: d.quizTotal,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "user_id,day_key" },
      );
      if (!error) result.progress = missing.length;
    }
  }

  // --- Flashcard schedules ------------------------------------------------
  const localCards = readLocal<StoredCard>(CARDS_KEY);
  const cards = Object.values(localCards).filter((c) => c?.cardId);

  if (cards.length > 0) {
    const { data: serverCards } = await supabase.from("cards").select("card_id");
    const known = new Set((serverCards ?? []).map((r) => r.card_id));

    const missing = cards.filter((c) => !known.has(c.cardId));
    if (missing.length > 0) {
      const { error } = await supabase.from("cards").upsert(
        missing.map((c) => ({
          user_id: user.id,
          card_id: c.cardId,
          due: c.due,
          stability: c.stability,
          difficulty: c.difficulty,
          learning_steps: c.learningSteps,
          scheduled_days: c.scheduledDays,
          reps: c.reps,
          lapses: c.lapses,
          state: c.state,
          last_review: c.lastReview,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "user_id,card_id" },
      );
      if (!error) result.cards = missing.length;
    }
  }

  return result;
}
