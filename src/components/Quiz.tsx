"use client";

import { useState } from "react";
import { useLessonDay } from "./LessonContext";
import { loadProgress, saveDay } from "@/lib/progress";

export type Question = {
  q: string;
  options: string[];
  /** Index into options. */
  answer: number;
  /** Shown after answering, right or wrong. */
  why: string;
};

/**
 * End-of-lesson quiz. Marks immediately and explains every answer, because an
 * unexplained wrong answer teaches nothing.
 */
export function Quiz({
  questions,
  onComplete,
}: {
  questions: Question[];
  onComplete?: (score: number, total: number) => void;
}) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);
  const dayKey = useLessonDay();

  /** Keep the day's completion flag, and record the score alongside it. */
  async function persist(score: number, total: number) {
    if (!dayKey) return;
    const existing = (await loadProgress())[dayKey];
    await saveDay({
      dayKey,
      completedAt: existing?.completedAt ?? null,
      quizScore: score,
      quizTotal: total,
    });
  }

  const answeredAll = questions.every((_, index) => index in picked);
  const score = questions.reduce(
    (total, question, index) =>
      total + (picked[index] === question.answer ? 1 : 0),
    0,
  );

  return (
    <section className="my-10 rounded-xl border border-border bg-surface p-5">
      <h3 className="!mt-0 text-sm font-semibold uppercase tracking-wider text-muted">
        Check yourself
      </h3>

      <ol className="mt-4 space-y-6">
        {questions.map((question, qi) => {
          const choice = picked[qi];
          return (
            <li key={qi}>
              <p className="text-[0.9375rem] font-medium">
                {qi + 1}. {question.q}
              </p>
              <div className="mt-2.5 space-y-1.5">
                {question.options.map((option, oi) => {
                  const chosen = choice === oi;
                  const correct = question.answer === oi;
                  const reveal = done || choice !== undefined;

                  let tone = "border-border bg-bg hover:bg-surface-2";
                  if (reveal && correct) {
                    tone = "border-ok/50 bg-ok-soft";
                  } else if (reveal && chosen && !correct) {
                    tone = "border-bad/50 bg-bad-soft";
                  }

                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={choice !== undefined}
                      onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                      className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default ${tone}`}
                    >
                      <span className="mr-2 font-mono text-xs text-muted">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
              {choice !== undefined ? (
                <p className="mt-2 text-sm text-muted">{question.why}</p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {answeredAll ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <span className="text-sm font-medium">
            {score} out of {questions.length}
          </span>
          {!done ? (
            <button
              type="button"
              onClick={() => {
                setDone(true);
                void persist(score, questions.length);
                onComplete?.(score, questions.length);
              }}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
            >
              Save score
            </button>
          ) : (
            <span className="text-sm text-ok">Saved</span>
          )}
          <button
            type="button"
            onClick={() => {
              setPicked({});
              setDone(false);
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          >
            Try again
          </button>
        </div>
      ) : null}
    </section>
  );
}
