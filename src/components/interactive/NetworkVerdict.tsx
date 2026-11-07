"use client";

import { useState } from "react";

/**
 * Four failures that look identical to the customer.
 *
 * "It didn't work" covers all of these, and the Network panel separates them
 * in about ten seconds. Getting this right is what routes a ticket to the
 * correct team on the first attempt instead of the third.
 */

type Case = {
  id: string;
  label: string;
  /** What the Network panel shows. */
  network: string;
  console: string;
  screen: string;
  verdict: string;
  owner: string;
  why: string;
};

const CASES: Case[] = [
  {
    id: "none",
    label: "No request at all",
    network: "Nothing. The panel stays empty when the button is clicked.",
    console: "Uncaught TypeError: Cannot read properties of null (reading 'value')",
    screen: "The button appears to do nothing.",
    verdict: "Front end. The page never sent anything.",
    owner: "Front-end team",
    why: "The click handler threw before it could call the API, so the server has no idea this customer tried. Nothing will be in the server logs — and looking for it there is how an hour disappears.",
  },
  {
    id: "4xx",
    label: "Request sent, rejected",
    network: "POST /api/payments/initiate → 422, 180ms",
    console: "Clean.",
    screen: '"Something went wrong. Please try again."',
    verdict: "Both, in different ways.",
    owner: "Front end for the message, back end only if the rejection is wrong",
    why: "The server answered correctly and quickly; it refused the input and said why in the body. The real defect is that the page threw that explanation away and showed a generic message, so the customer cannot fix what is wrong.",
  },
  {
    id: "5xx",
    label: "Request sent, server broke",
    network: "POST /api/payments/initiate → 500, 2.4s",
    console: "Clean.",
    screen: '"Something went wrong. Please try again."',
    verdict: "Back end.",
    owner: "Back-end team",
    why: "A 500 means the server did not anticipate this and crashed inside. Get the request id from the response headers and send it with the escalation — that is what lets an engineer find the stack trace in seconds.",
  },
  {
    id: "success",
    label: "Request succeeded, screen disagrees",
    network: "POST /api/payments/initiate → 201, 240ms, body has reference PAY-8841",
    console: "Clean.",
    screen: '"Payment failed."',
    verdict: "Front end — and urgent.",
    owner: "Front-end team, escalated",
    why: "The money moved and the customer was told it did not. They will try again, and now you have a duplicate payment as well as a display bug. The most expensive of the four, and the only one that gets worse while you think about it.",
  },
];

export function NetworkVerdict() {
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState<string | null>(null);

  const current = CASES[index];

  const choose = (next: number) => {
    setIndex(next);
    setGuess(null);
  };

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Whose bug is it?
        </span>
        <select
          value={index}
          onChange={(event) => choose(Number(event.target.value))}
          className="ml-auto max-w-[14rem] rounded border border-border bg-bg px-1.5 py-1 text-xs"
          aria-label="Choose a case"
        >
          {CASES.map((c, i) => (
            <option key={c.id} value={i}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <p className="border-b border-border px-3 py-2 text-xs text-muted">
        The customer says the same thing every time: <em>it didn&apos;t
        work</em>. Here is what the evidence shows.
      </p>

      <dl className="divide-y divide-border text-sm">
        {[
          ["Network panel", current.network],
          ["Console", current.console],
          ["What they see", current.screen],
        ].map(([label, value]) => (
          <div key={label} className="p-3">
            <dt className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
              {label}
            </dt>
            <dd className="mt-0.5 font-mono text-xs">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="no-touch-target flex flex-wrap gap-2 border-t border-border p-3">
        {["Front end", "Back end", "Both"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setGuess(option)}
            className={`rounded-lg border px-2.5 py-1 text-xs ${
              guess === option
                ? "border-accent bg-accent-soft font-semibold"
                : "border-border bg-surface-2"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {guess ? (
        <div className="border-t border-border p-3 text-sm">
          <p className="rounded-lg border border-border bg-surface-2 p-2.5">
            <strong>{current.verdict}</strong> Route to:{" "}
            <strong>{current.owner}</strong>.
          </p>
          <p className="mt-2">{current.why}</p>
        </div>
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        The first case is the one that wastes the most time: with no request,
        there is nothing in the server logs, and a support agent can search
        for half an hour before realising the request was never made.
      </figcaption>
    </figure>
  );
}
