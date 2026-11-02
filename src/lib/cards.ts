"use client";

import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card as FsrsCard,
  type Grade,
} from "ts-fsrs";
import { getSupabaseBrowserClient, isConfigured } from "./supabase/client";

/**
 * Spaced repetition scheduling.
 *
 * The card text lives in content/cards.ts, in the repo. Only the schedule is
 * stored per person, so editing a card's wording never resets your progress.
 */

const LOCAL_KEY = "trace:cards";

export const scheduler = fsrs(
  generatorParameters({ enable_fuzz: true, maximum_interval: 365 }),
);

export type StoredCard = {
  cardId: string;
  due: string;
  stability: number;
  difficulty: number;
  learningSteps: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: string | null;
};

export function freshCard(cardId: string): StoredCard {
  return toStored(cardId, createEmptyCard(new Date()));
}

export function toStored(cardId: string, card: FsrsCard): StoredCard {
  return {
    cardId,
    due: new Date(card.due).toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    learningSteps: card.learning_steps,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review
      ? new Date(card.last_review).toISOString()
      : null,
  };
}

export function toFsrs(stored: StoredCard): FsrsCard {
  return {
    due: new Date(stored.due),
    stability: stored.stability,
    difficulty: stored.difficulty,
    learning_steps: stored.learningSteps,
    scheduled_days: stored.scheduledDays,
    reps: stored.reps,
    lapses: stored.lapses,
    state: stored.state,
    last_review: stored.lastReview ? new Date(stored.lastReview) : undefined,
  } as FsrsCard;
}

/** Apply a grade and return the next schedule. */
export function grade(stored: StoredCard, rating: Grade): StoredCard {
  const { card } = scheduler.next(toFsrs(stored), new Date(), rating);
  return toStored(stored.cardId, card);
}

function readLocal(): Record<string, StoredCard> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredCard>) : {};
  } catch {
    return {};
  }
}

function writeLocal(all: Record<string, StoredCard>): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch {
    // Best effort only.
  }
}

export async function loadCards(): Promise<Record<string, StoredCard>> {
  const local = readLocal();
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return local;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return local;

  const { data, error } = await supabase.from("cards").select("*");
  if (error || !data) return local;

  const merged = { ...local };
  for (const row of data) {
    merged[row.card_id] = {
      cardId: row.card_id,
      due: row.due,
      stability: row.stability,
      difficulty: row.difficulty,
      learningSteps: row.learning_steps,
      scheduledDays: row.scheduled_days,
      reps: row.reps,
      lapses: row.lapses,
      state: row.state,
      lastReview: row.last_review,
    };
  }
  return merged;
}

export async function saveCard(card: StoredCard): Promise<void> {
  const local = readLocal();
  local[card.cardId] = card;
  writeLocal(local);

  if (!isConfigured()) return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  await supabase.from("cards").upsert(
    {
      user_id: auth.user.id,
      card_id: card.cardId,
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      learning_steps: card.learningSteps,
      scheduled_days: card.scheduledDays,
      reps: card.reps,
      lapses: card.lapses,
      state: card.state,
      last_review: card.lastReview,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,card_id" },
  );
}
