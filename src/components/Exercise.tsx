"use client";

import { useState } from "react";

/**
 * A short, auto-marked exercise.
 *
 * Marking is deliberately forgiving: it compares meaning, not punctuation, so
 * "404" and "404 Not Found" both count. Anything needing real judgement is a
 * written exercise with a model answer instead, revealed on request.
 */
export function Exercise({
  prompt,
  /** Accepted answers. Matched case-insensitively, ignoring spaces and punctuation. */
  accept,
  hint,
  solution,
  placeholder = "Your answer",
}: {
  prompt: string;
  accept?: string[];
  hint?: string;
  solution: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "right" | "wrong">("idle");
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const normalise = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  function check() {
    if (!accept || accept.length === 0) {
      setShowSolution(true);
      return;
    }
    const given = normalise(value);
    const ok = accept.some((candidate) => {
      const want = normalise(candidate);
      return given === want || given.includes(want);
    });
    setState(ok ? "right" : "wrong");
    if (ok) setShowSolution(true);
  }

  const selfMarked = !accept || accept.length === 0;

  return (
    <section className="my-7 rounded-xl border border-border bg-surface p-4">
      <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
        Exercise
      </div>
      <p className="mt-1.5 text-[0.9375rem]">{prompt}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setState("idle");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") check();
          }}
          placeholder={placeholder}
          spellCheck={false}
          className={`min-w-[12rem] flex-1 rounded-lg border bg-bg px-3 py-2 text-sm outline-none ${
            state === "right"
              ? "border-ok"
              : state === "wrong"
                ? "border-bad"
                : "border-border focus:border-accent"
          }`}
        />
        <button
          type="button"
          onClick={check}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white"
        >
          {selfMarked ? "Show answer" : "Check"}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        {hint ? (
          <button
            type="button"
            onClick={() => setShowHint((shown) => !shown)}
            className="text-muted underline"
          >
            {showHint ? "Hide hint" : "Hint"}
          </button>
        ) : null}
        {!showSolution ? (
          <button
            type="button"
            onClick={() => setShowSolution(true)}
            className="text-muted underline"
          >
            Show answer
          </button>
        ) : null}
      </div>

      {state === "right" ? (
        <p className="mt-2 text-sm text-ok">Correct.</p>
      ) : null}
      {state === "wrong" ? (
        <p className="mt-2 text-sm text-bad">
          Not quite. Try again, or reveal the answer.
        </p>
      ) : null}
      {showHint && hint ? (
        <p className="mt-2 rounded-lg bg-surface-2 p-2.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {showSolution ? (
        <div className="mt-2 rounded-lg border border-ok/40 bg-ok-soft p-2.5 text-sm">
          <span className="font-medium">Answer. </span>
          {solution}
        </div>
      ) : null}
    </section>
  );
}
