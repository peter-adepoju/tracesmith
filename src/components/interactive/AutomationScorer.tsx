"use client";

import { useState } from "react";

/**
 * Score a process before building anything.
 *
 * Automation is sold on enthusiasm and paid for in maintenance, so the
 * decision is arithmetic rather than instinct. The two deliberately bad
 * candidates here score badly for different reasons, which is the thing
 * worth learning: unstable and infrequent fail in different ways.
 */

type Process = {
  id: string;
  label: string;
  detail: string;
  /** Times per month. */
  frequency: number;
  minutesEach: number;
  /** 1 unstable, 5 unchanged for years. */
  stability: number;
  /** 1 a wrong result is invisible, 5 it costs money immediately. */
  costOfError: number;
  /** Rough build cost in hours. */
  buildHours: number;
  verdict: string;
};

const PROCESSES: Process[] = [
  {
    id: "report",
    label: "Daily settlement reconciliation report",
    detail:
      "Pull yesterday's payouts, match them against transactions, post the summary to a channel.",
    frequency: 22,
    minutesEach: 40,
    stability: 5,
    costOfError: 4,
    buildHours: 12,
    verdict:
      "The clearest yes here. Frequent, stable, and the person doing it by hand is bored — which is exactly when mistakes creep in.",
  },
  {
    id: "onboard",
    label: "New merchant welcome and document chase",
    detail:
      "Send the welcome, check which KYC documents are missing, chase after 3 and 7 days.",
    frequency: 30,
    minutesEach: 12,
    stability: 4,
    costOfError: 2,
    buildHours: 10,
    verdict:
      "Yes. High frequency, low per-item cost, and the chasing is the part humans forget. Keep a human in the loop for the document review itself.",
  },
  {
    id: "triage",
    label: "Draft first replies to incoming tickets",
    detail:
      "Read the ticket, classify it, draft a reply for a human to approve and send.",
    frequency: 400,
    minutesEach: 4,
    stability: 3,
    costOfError: 4,
    buildHours: 30,
    verdict:
      "Yes, with the human approval step as a hard requirement. Drafting is cheap to get slightly wrong and expensive to send wrong, so the approval is not a nicety — it is the whole design.",
  },
  {
    id: "redesign",
    label: "Export data from the dashboard being redesigned",
    detail:
      "Scrape the transactions page weekly and compile a spreadsheet. The page is mid-redesign.",
    frequency: 4,
    minutesEach: 25,
    stability: 1,
    costOfError: 2,
    buildHours: 8,
    verdict:
      "No, and not because of the frequency. It is built on a page that is actively changing, so it will break before it has repaid the build — and a scraper is the most fragile thing you can build. Wait, and ask for an API.",
  },
  {
    id: "quarterly",
    label: "Quarterly board pack assembly",
    detail: "Gather figures from four systems and assemble a deck. Four times a year.",
    frequency: 0.33,
    minutesEach: 240,
    stability: 4,
    costOfError: 5,
    buildHours: 25,
    verdict:
      "No, for a completely different reason: it is stable and it matters, but four runs a year will not repay 25 hours in any reasonable horizon. Document the steps instead and do it by hand.",
  },
];

function score(p: Process) {
  const monthlyMinutes = p.frequency * p.minutesEach;
  const annualHours = (monthlyMinutes * 12) / 60;
  const paybackMonths = p.buildHours / (monthlyMinutes / 60 || 0.01);
  // Stability matters because an unstable process breaks what you built.
  const worth =
    paybackMonths <= 6 && p.stability >= 3
      ? "build"
      : paybackMonths <= 12 && p.stability >= 4
        ? "maybe"
        : "no";
  return { monthlyMinutes, annualHours, paybackMonths, worth };
}

const VERDICT_STYLE: Record<string, string> = {
  build: "border-ok/40 bg-ok-soft",
  maybe: "border-warn/40 bg-warn-soft",
  no: "border-bad/40 bg-bad-soft",
};

const VERDICT_LABEL: Record<string, string> = {
  build: "Build it",
  maybe: "Marginal",
  no: "Do not build",
};

export function AutomationScorer() {
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [shown, setShown] = useState(false);

  const guess = (id: string, value: string) => {
    setShown(false);
    setGuesses((previous) => ({ ...previous, [id]: value }));
  };

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Which of these would you build?
        </span>
      </div>

      <ul className="divide-y divide-border">
        {PROCESSES.map((process) => {
          const s = score(process);
          const picked = guesses[process.id];
          const right = shown && picked === s.worth;
          return (
            <li key={process.id} className="p-3">
              <p className="text-sm font-medium">{process.label}</p>
              <p className="mt-0.5 text-xs text-muted">{process.detail}</p>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-muted">
                <span>
                  {process.frequency < 1
                    ? `${Math.round(process.frequency * 12)}× a year`
                    : `${process.frequency}× a month`}
                </span>
                <span>{process.minutesEach} min each</span>
                <span>stability {process.stability}/5</span>
                <span>cost of error {process.costOfError}/5</span>
                <span>~{process.buildHours}h to build</span>
              </div>

              <div className="no-touch-target mt-2 flex flex-wrap gap-1.5">
                {(["build", "maybe", "no"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => guess(process.id, option)}
                    className={`rounded-lg border px-2.5 py-1 text-xs ${
                      picked === option
                        ? "border-accent bg-accent-soft font-semibold"
                        : "border-border bg-surface-2"
                    }`}
                  >
                    {VERDICT_LABEL[option]}
                  </button>
                ))}
                {shown ? (
                  <span
                    className={`self-center text-xs font-semibold ${
                      right ? "text-ok" : "text-bad"
                    }`}
                  >
                    {right ? "agreed" : VERDICT_LABEL[s.worth]}
                  </span>
                ) : null}
              </div>

              {shown ? (
                <div
                  className={`mt-2 rounded-lg border p-2.5 text-xs ${VERDICT_STYLE[s.worth]}`}
                >
                  <p>
                    <strong>
                      {Math.round(s.annualHours)} hours a year by hand.
                    </strong>{" "}
                    Payback on {process.buildHours}h of build:{" "}
                    {s.paybackMonths < 1
                      ? "under a month"
                      : s.paybackMonths > 60
                        ? "never, realistically"
                        : `about ${Math.round(s.paybackMonths)} month${
                            Math.round(s.paybackMonths) === 1 ? "" : "s"
                          }`}
                    .
                  </p>
                  <p className="mt-1">{process.verdict}</p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={() => setShown(true)}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          Score them
        </button>
      </div>

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        The two rejections fail for different reasons, and that is the point.
        One is unstable, so it breaks before it repays. The other is rock
        solid and simply does not happen often enough. Only one of those
        becomes a yes later.
      </figcaption>
    </figure>
  );
}
