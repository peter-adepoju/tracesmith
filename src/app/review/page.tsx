"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Rating, type Grade } from "ts-fsrs";
import { CARDS } from "@content/cards";
import { freshCard, grade, loadCards, saveCard, type StoredCard } from "@/lib/cards";

const BUTTONS: { label: string; rating: Grade; tone: string }[] = [
  { label: "Again", rating: Rating.Again, tone: "border-bad/50 text-bad" },
  { label: "Hard", rating: Rating.Hard, tone: "border-warn/50 text-warn" },
  { label: "Good", rating: Rating.Good, tone: "border-ok/50 text-ok" },
  { label: "Easy", rating: Rating.Easy, tone: "border-border text-muted" },
];

export default function ReviewPage() {
  const [schedule, setSchedule] = useState<Record<string, StoredCard>>({});
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    let active = true;
    loadCards().then((all) => {
      if (!active) return;
      setSchedule(all);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Cards that are due now, oldest first. A card never seen is due immediately.
  const due = useMemo(() => {
    if (!ready) return [];
    const now = Date.now();
    return CARDS.filter((card) => {
      const stored = schedule[card.id];
      if (!stored) return true;
      return new Date(stored.due).getTime() <= now;
    }).sort((a, b) => {
      const da = schedule[a.id] ? new Date(schedule[a.id].due).getTime() : 0;
      const db = schedule[b.id] ? new Date(schedule[b.id].due).getTime() : 0;
      return da - db;
    });
    // `reviewed` is in the deps so the list is recomputed after each answer.
  }, [ready, schedule, reviewed]);

  const card = due[position];

  async function answer(rating: Grade) {
    if (!card) return;
    const stored = schedule[card.id] ?? freshCard(card.id);
    const next = grade(stored, rating);
    setSchedule((previous) => ({ ...previous, [card.id]: next }));
    await saveCard(next);
    setRevealed(false);
    setReviewed((count) => count + 1);
    setPosition((index) => index + 1);
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-sm text-muted">
        Loading your deck…
      </main>
    );
  }

  if (!card) {
    const nextDue = CARDS.map((item) => schedule[item.id]?.due)
      .filter(Boolean)
      .sort()[0];

    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {reviewed > 0 ? "Deck finished" : "Nothing due"}
        </h1>
        <p className="mt-2 text-muted">
          {reviewed > 0
            ? `You reviewed ${reviewed} ${reviewed === 1 ? "card" : "cards"}.`
            : "Every card is scheduled for later."}
          {nextDue
            ? ` Next card is due ${new Date(nextDue).toLocaleString()}.`
            : ""}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Back to the course
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-baseline justify-between text-sm text-muted">
        <h1 className="text-lg font-semibold text-text">Review</h1>
        <span>
          {position + 1} of {due.length} due
        </span>
      </div>

      <div className="mt-5 min-h-56 rounded-2xl border border-border bg-surface p-6">
        <p className="text-lg font-medium">{card.front}</p>
        {revealed ? (
          <>
            <hr className="my-5 border-border" />
            <p className="text-[0.9375rem] leading-relaxed text-muted">
              {card.back}
            </p>
          </>
        ) : null}
      </div>

      {revealed ? (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {BUTTONS.map((button) => (
            <button
              key={button.label}
              type="button"
              onClick={() => answer(button.rating)}
              className={`rounded-lg border bg-surface px-2 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2 ${button.tone}`}
            >
              {button.label}
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white"
        >
          Show answer
        </button>
      )}

      <p className="mt-6 text-xs text-muted">
        Answer honestly. &ldquo;Again&rdquo; brings a card back within minutes;
        &ldquo;Easy&rdquo; pushes it weeks out. Grading yourself generously only
        means forgetting it later.
      </p>
    </main>
  );
}
