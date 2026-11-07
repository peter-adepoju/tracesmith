"use client";

import { useState } from "react";

/**
 * Configure retries and see what you actually built.
 *
 * Every field here is one someone sets without thinking, and the
 * consequences only appear together: a generous timeout and three retries
 * is a worst case longer than the schedule interval, and a retried POST
 * without a key is a duplicate payment waiting for a slow afternoon.
 */

type Backoff = "fixed" | "exponential" | "jitter";

const BACKOFF_LABEL: Record<Backoff, string> = {
  fixed: "Fixed wait",
  exponential: "Exponential",
  jitter: "Exponential + jitter",
};

function waits(backoff: Backoff, base: number, attempts: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < attempts - 1; i += 1) {
    if (backoff === "fixed") out.push(base);
    else if (backoff === "exponential") out.push(base * 2 ** i);
    // Jitter is shown at its average; in reality it is random in [0, w].
    else out.push((base * 2 ** i) / 2);
  }
  return out;
}

export function RetryPlanner() {
  const [timeout_, setTimeout_] = useState(30);
  const [attempts, setAttempts] = useState(3);
  const [base, setBase] = useState(5);
  const [backoff, setBackoff] = useState<Backoff>("exponential");
  const [writes, setWrites] = useState(true);
  const [hasKey, setHasKey] = useState(false);
  const [retry4xx, setRetry4xx] = useState(false);
  const [interval, setInterval_] = useState(60);

  const gaps = waits(backoff, base, attempts);
  const worstCase = attempts * timeout_ + gaps.reduce((a, b) => a + b, 0);

  const timeline: { label: string; at: number }[] = [];
  let clock = 0;
  for (let i = 0; i < attempts; i += 1) {
    timeline.push({ label: `Attempt ${i + 1} starts`, at: clock });
    clock += timeout_;
    timeline.push({ label: `Attempt ${i + 1} times out`, at: clock });
    if (i < gaps.length) clock += gaps[i];
  }

  const problems: { level: "bad" | "warn"; text: string }[] = [];

  if (writes && !hasKey && attempts > 1) {
    problems.push({
      level: "bad",
      text: "This call writes, it is retried, and it sends no idempotency key. A timed-out request may well have succeeded at the other end, so every retry is a second write — a duplicate order, or a duplicate payment. This is the most expensive configuration on this page.",
    });
  }

  if (retry4xx) {
    problems.push({
      level: "bad",
      text: "Retrying 4xx. The request itself is wrong, so the same wrong request will be refused the same way every time. It wastes rate limit, delays the real failure, and on a 429 specifically it makes the rate limiting worse.",
    });
  }

  if (worstCase > interval) {
    problems.push({
      level: "bad",
      text: `Worst case is ${worstCase}s and the schedule runs every ${interval}s. A bad run overlaps the next one, and two copies process the same records. Turn on single-instance, or bring the worst case under the interval.`,
    });
  }

  if (backoff === "fixed" && attempts > 2) {
    problems.push({
      level: "warn",
      text: "A fixed wait means every client retries on the same rhythm. When a shared dependency recovers, they all arrive at once and knock it over again — the thundering herd. Exponential with jitter spreads them out.",
    });
  }

  if (backoff === "exponential" && attempts > 3) {
    problems.push({
      level: "warn",
      text: "Exponential without jitter still synchronises clients that failed at the same moment, because they all back off by the same amounts.",
    });
  }

  if (timeout_ >= 60) {
    problems.push({
      level: "warn",
      text: `A ${timeout_}s timeout is a long time to hold a run open. Most APIs that are going to answer answer in under ten seconds; a longer timeout mostly buys you a slower failure.`,
    });
  }

  if (attempts === 1) {
    problems.push({
      level: "warn",
      text: "No retries at all. A single network blip fails the whole run, and transient failures are the commonest kind.",
    });
  }

  const ok = problems.length === 0;

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Retry configuration
        </span>
      </div>

      <div className="grid gap-3 border-b border-border p-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            Timeout per attempt: {timeout_}s
          </span>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={timeout_}
            onChange={(e) => setTimeout_(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>

        <label className="text-sm">
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            Attempts: {attempts}
          </span>
          <input
            type="range"
            min={1}
            max={6}
            value={attempts}
            onChange={(e) => setAttempts(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>

        <label className="text-sm">
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            Base wait: {base}s
          </span>
          <input
            type="range"
            min={1}
            max={30}
            value={base}
            onChange={(e) => setBase(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>

        <label className="text-sm">
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            Schedule interval: {interval}s
          </span>
          <input
            type="range"
            min={30}
            max={900}
            step={30}
            value={interval}
            onChange={(e) => setInterval_(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
      </div>

      <div className="no-touch-target flex flex-wrap gap-x-4 gap-y-2 border-b border-border p-3 text-xs">
        <span className="flex items-center gap-1.5">
          {(["fixed", "exponential", "jitter"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBackoff(b)}
              className={`rounded-lg border px-2 py-1 ${
                backoff === b
                  ? "border-accent bg-accent-soft font-semibold"
                  : "border-border bg-surface-2"
              }`}
            >
              {BACKOFF_LABEL[b]}
            </button>
          ))}
        </span>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={writes}
            onChange={() => setWrites((v) => !v)}
          />
          This call writes something
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={hasKey}
            onChange={() => setHasKey((v) => !v)}
          />
          Sends an idempotency key
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={retry4xx}
            onChange={() => setRetry4xx((v) => !v)}
          />
          Retries on 4xx too
        </label>
      </div>

      <div className="border-b border-border p-3">
        <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
          Worst case, if every attempt times out
        </p>
        <ol className="mt-1.5 space-y-0.5 font-mono text-[0.6875rem]">
          {timeline.map((entry, i) => (
            <li key={i} className={entry.label.includes("times out") ? "text-muted" : ""}>
              {String(entry.at).padStart(4, " ")}s &nbsp;{entry.label}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-sm">
          <strong
            className={worstCase > interval ? "text-bad" : "text-ok"}
          >
            {worstCase}s total
          </strong>{" "}
          <span className="text-muted">
            against a {interval}s interval
          </span>
        </p>
      </div>

      <div className="space-y-2 p-3 text-sm">
        {ok ? (
          <p className="rounded-lg border border-ok/40 bg-ok-soft p-2.5">
            Nothing to flag. Retries on transient failures only, a worst case
            inside the interval, and writes protected by a key.
          </p>
        ) : (
          problems.map((problem) => (
            <p
              key={problem.text}
              className={`rounded-lg border p-2.5 ${
                problem.level === "bad"
                  ? "border-bad/40 bg-bad-soft"
                  : "border-warn/40 bg-warn-soft"
              }`}
            >
              {problem.text}
            </p>
          ))
        )}
      </div>

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Start from the default and turn on <em>sends an idempotency key</em>.
        That one checkbox is the difference between a retry that is safe and
        a retry that charges someone twice.
      </figcaption>
    </figure>
  );
}
