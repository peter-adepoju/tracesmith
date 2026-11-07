"use client";

import { useState } from "react";

/**
 * Deliver a webhook to an endpoint you control the behaviour of.
 *
 * Choose how your server responds and watch what the sender does about it.
 * Retries, duplicates and the difference an idempotency check makes are all
 * things people are told about and rarely see. Here the order count goes up
 * twice in front of you, which is more persuasive than any paragraph.
 */

type Attempt = {
  n: number;
  at: string;
  status: number | "timeout";
  outcome: string;
  created: boolean;
};

type Behaviour = "ok" | "slow" | "error";

const BEHAVIOUR: Record<Behaviour, { label: string; note: string }> = {
  ok: {
    label: "200 OK",
    note: "Your server acknowledges immediately. One delivery, one order, done.",
  },
  slow: {
    label: "Times out",
    note: "Your server does the work but takes too long to answer. The sender never hears the acknowledgement, so it assumes failure and tries again — while the work has already happened.",
  },
  error: {
    label: "500 error",
    note: "Your server fails. The sender retries with growing gaps, which is what you want: a brief outage recovers on its own.",
  },
};

export function WebhookSimulator() {
  const [behaviour, setBehaviour] = useState<Behaviour>("slow");
  const [idempotent, setIdempotent] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [orders, setOrders] = useState(0);
  const [running, setRunning] = useState(false);

  async function deliver() {
    setAttempts([]);
    setOrders(0);
    setRunning(true);

    const backoff = [0, 5, 25, 120];
    let created = false;

    for (let n = 1; n <= 4; n += 1) {
      await new Promise((resolve) => setTimeout(resolve, 520));

      // Would this attempt create an order?
      // Idempotency means: already handled this event, so do nothing again.
      const makesOrder =
        behaviour !== "error" && !(idempotent && created);

      if (makesOrder) {
        created = true;
        setOrders((count) => count + 1);
      }

      const status: number | "timeout" =
        behaviour === "ok" ? 200 : behaviour === "error" ? 500 : "timeout";

      const outcome =
        behaviour === "ok"
          ? "Acknowledged. The sender stops."
          : behaviour === "slow"
            ? idempotent && !makesOrder
              ? "Timed out again. The event was already handled, so nothing new was created."
              : "Work done, but the acknowledgement never arrived. The sender will retry."
            : "Failed. The sender will retry.";

      setAttempts((previous) => [
        ...previous,
        {
          n,
          at: `+${backoff[n - 1]}s`,
          status,
          outcome,
          created: makesOrder,
        },
      ]);

      if (behaviour === "ok") break;
    }

    setRunning(false);
  }

  const duplicated = orders > 1;

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Webhook delivery
        </span>
        <button
          type="button"
          onClick={deliver}
          disabled={running}
          className="ml-auto rounded bg-accent px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {running ? "Delivering…" : "Send the event"}
        </button>
      </div>

      <div className="no-touch-target flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border p-3 text-sm">
        <span className="text-xs text-muted">Your endpoint responds:</span>
        {(Object.keys(BEHAVIOUR) as Behaviour[]).map((key) => (
          <label key={key} className="flex items-center gap-1.5 text-xs">
            <input
              type="radio"
              name="behaviour"
              checked={behaviour === key}
              onChange={() => setBehaviour(key)}
            />
            {BEHAVIOUR[key].label}
          </label>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={idempotent}
            onChange={(event) => setIdempotent(event.target.checked)}
          />
          <span>
            Check the event id before acting <em>(idempotent)</em>
          </span>
        </label>
      </div>

      <div className="min-h-32 p-3">
        {attempts.length === 0 ? (
          <p className="text-sm text-muted">
            Press <strong>Send the event</strong>. One payment succeeded, and
            the gateway is about to tell your server about it.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {attempts.map((attempt) => (
              <li
                key={attempt.n}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2 text-xs"
              >
                <span className="font-mono text-muted">
                  attempt {attempt.n} · {attempt.at}
                </span>
                <span
                  className={`font-mono font-semibold ${
                    attempt.status === 200 ? "text-ok" : "text-bad"
                  }`}
                >
                  {attempt.status}
                </span>
                {attempt.created ? (
                  <span className="rounded bg-warn-soft px-1.5 py-0.5 text-[0.625rem] uppercase text-warn">
                    order created
                  </span>
                ) : null}
                <span className="w-full text-muted">{attempt.outcome}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <figcaption className="border-t border-border p-3 text-sm">
        <p className="font-mono text-xs">
          Orders created:{" "}
          <strong className={duplicated ? "text-bad" : "text-ok"}>{orders}</strong>
          {duplicated ? (
            <span className="text-bad"> — the customer has been charged {orders} times</span>
          ) : null}
        </p>
        <p className="mt-2 text-muted">{BEHAVIOUR[behaviour].note}</p>
        {duplicated ? (
          <p className="mt-2 rounded-lg border border-bad/40 bg-bad-soft p-2.5 text-xs">
            This is the bug. The sender behaved correctly — it could not tell a
            slow success from a failure, so it retried, which is exactly what
            you want it to do. The duplicate is <strong>your</strong> endpoint&apos;s
            fault for acting on the same event twice. Tick the idempotency box
            and send it again.
          </p>
        ) : null}
        {idempotent && attempts.length > 1 && orders === 1 ? (
          <p className="mt-2 rounded-lg border border-ok/40 bg-ok-soft p-2.5 text-xs">
            Four deliveries, one order. The endpoint recognised an event it had
            already handled and did nothing the second time. That is all
            idempotency is, and it is the difference between a reliable
            integration and an expensive one.
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}
