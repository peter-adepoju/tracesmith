"use client";

import { useState } from "react";

/**
 * Read a real response and mark what should not be in it.
 *
 * The skill is noticing. A response like this scrolls past in the Network
 * panel a hundred times a day and looks like ordinary JSON, and three of
 * its fields are a reportable finding.
 */

type Line = {
  text: string;
  /** null when the line is fine; the reason when it is not. */
  problem: string | null;
};

const LINES: Line[] = [
  { text: "{", problem: null },
  { text: '  "id": "cus_01",', problem: null },
  { text: '  "name": "Ada Nwosu",', problem: null },
  { text: '  "email": "ada@example.com",', problem: null },
  {
    text: '  "passwordHash": "$2b$12$Kq8xH2.pLm9vR3nT7wY1eO",',
    problem:
      "A password hash must never leave the server. It is offline-crackable, and it tells an attacker the algorithm and cost factor as well.",
  },
  {
    text: '  "cardNumber": "5399 8372 1049 6621",',
    problem:
      "A full card number, which the product should not be storing at all, let alone returning. This is a payment-industry violation, not only a bug.",
  },
  { text: '  "cardLast4": "6621",', problem: null },
  {
    text: '  "internalRiskScore": 0.82,',
    problem:
      "An internal score the customer is not meant to see. It reveals how the business profiles people, and it is the sort of field that turns into a complaint or a regulatory question.",
  },
  { text: '  "city": "Lagos",', problem: null },
  {
    text: '  "supportNotes": "Caller was abusive, flagged twice",',
    problem:
      "A staff note about the customer, returned to the customer's own browser. Nothing stops them reading it.",
  },
  { text: '  "orderCount": 4,', problem: null },
  {
    text: '  "dbHost": "prod-db-02.internal:5432",',
    problem:
      "Infrastructure detail. It tells anyone looking exactly what to attack and where it lives.",
  },
  { text: '  "createdAt": "2026-09-02T10:14:00Z"', problem: null },
  { text: "}", problem: null },
];

export function ExposureScan() {
  const [marked, setMarked] = useState<number[]>([]);
  const [shown, setShown] = useState(false);

  const problems = LINES.map((l, i) => (l.problem ? i : -1)).filter(
    (i) => i >= 0,
  );
  const found = problems.filter((i) => marked.includes(i));
  const wrong = marked.filter((i) => !LINES[i].problem);

  const toggle = (index: number) => {
    if (!LINES[index].text.includes(":")) return;
    setShown(false);
    setMarked((previous) =>
      previous.includes(index)
        ? previous.filter((p) => p !== index)
        : [...previous, index],
    );
  };

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          What should not be here?
        </span>
      </div>

      <p className="border-b border-border px-3 py-2 text-xs text-muted">
        <code>GET /api/customers/me</code> — the response your own browser
        receives. Click every line that should not be in it.
      </p>

      <div className="overflow-x-auto bg-[var(--code-bg)] p-3 font-mono text-[0.6875rem] text-[var(--code-text)]">
        {LINES.map((line, index) => {
          const clickable = line.text.includes(":");
          const on = marked.includes(index);
          const right = shown && on && line.problem;
          const missed = shown && !on && line.problem;
          const falsePositive = shown && on && !line.problem;
          return (
            <button
              key={index}
              type="button"
              disabled={!clickable}
              onClick={() => toggle(index)}
              className={`block w-full whitespace-pre text-left ${
                clickable ? "cursor-pointer hover:bg-white/10" : "opacity-60"
              } ${on ? "bg-white/15" : ""} ${
                right
                  ? "border-l-2 border-ok pl-1"
                  : missed
                    ? "border-l-2 border-bad pl-1"
                    : falsePositive
                      ? "border-l-2 border-warn pl-1"
                      : ""
              }`}
            >
              {line.text}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border p-3">
        <button
          type="button"
          onClick={() => setShown(true)}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          Check
        </button>
        <span className="text-sm text-muted">{marked.length} marked</span>
      </div>

      {shown ? (
        <div className="border-t border-border p-3 text-sm">
          <p className="mb-2 font-medium">
            You found {found.length} of {problems.length}
            {wrong.length > 0
              ? `, and marked ${wrong.length} that ${
                  wrong.length === 1 ? "is" : "are"
                } fine.`
              : "."}
          </p>
          <ul className="space-y-2">
            {problems.map((index) => (
              <li
                key={index}
                className={`rounded-lg border p-2.5 ${
                  marked.includes(index)
                    ? "border-ok/40 bg-ok-soft"
                    : "border-bad/40 bg-bad-soft"
                }`}
              >
                <code className="text-xs">{LINES[index].text.trim()}</code>
                <span className="mt-1 block">{LINES[index].problem}</span>
              </li>
            ))}
            {wrong.map((index) => (
              <li
                key={index}
                className="rounded-lg border border-border bg-surface-2 p-2.5"
              >
                <code className="text-xs">{LINES[index].text.trim()}</code>
                <span className="mt-1 block">
                  This one is fine. The customer&apos;s own name, email, city
                  and order count are theirs, and{" "}
                  <code>cardLast4</code> is the safe way to show a card.
                  Over-reporting costs you credibility for the five that are
                  real.
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Every one of these reaches the browser whether or not the page
        displays it. &ldquo;The UI does not show it&rdquo; is not a defence —
        anyone can open the Network panel.
      </figcaption>
    </figure>
  );
}
