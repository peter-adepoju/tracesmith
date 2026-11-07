"use client";

import { useState } from "react";

/**
 * Choose what to re-run after a change.
 *
 * Regression selection is the judgement that separates a tester who finishes
 * the day from one who re-runs everything and finishes nothing. Each suite
 * here carries a time cost and a verdict, so the choice has a price and the
 * feedback says what the price bought.
 */

type Verdict = "must" | "worth" | "skip";

type Suite = {
  id: string;
  label: string;
  minutes: number;
  verdict: Verdict;
  why: string;
};

type Scenario = {
  id: string;
  change: string;
  detail: string;
  budget: number;
  suites: Suite[];
};

const SCENARIOS: Scenario[] = [
  {
    id: "discount",
    change: "Fix: the same discount code can be applied twice",
    detail:
      "A one-line change in the cart's discount handler. Nothing else was touched, according to the developer.",
    budget: 40,
    suites: [
      {
        id: "discount-suite",
        label: "Discount codes",
        minutes: 12,
        verdict: "must",
        why: "The changed code itself. Not re-running this is not testing at all.",
      },
      {
        id: "cart-total",
        label: "Cart totals and tax",
        minutes: 10,
        verdict: "must",
        why: "The discount feeds the total. A fix that stops stacking but rounds the total differently is a new money bug, and nobody would be looking for it.",
      },
      {
        id: "checkout",
        label: "Checkout and payment",
        minutes: 15,
        verdict: "worth",
        why: "Downstream of the total. Worth a smoke pass — one order placed end to end — rather than the full suite.",
      },
      {
        id: "search",
        label: "Product search and filters",
        minutes: 14,
        verdict: "skip",
        why: "Shares no code and no data with the discount handler. Re-running it buys nothing but the feeling of being thorough.",
      },
      {
        id: "profile",
        label: "Account and profile editing",
        minutes: 11,
        verdict: "skip",
        why: "Unrelated. If this breaks from a discount fix, the problem is the architecture, and a regression run is not how you would find it.",
      },
    ],
  },
  {
    id: "library",
    change: "Upgrade: the date library, two major versions",
    detail:
      "A dependency bump. No application code changed, which is exactly what makes it dangerous.",
    budget: 60,
    suites: [
      {
        id: "orders-history",
        label: "Order history and date filters",
        minutes: 14,
        verdict: "must",
        why: "Dates are formatted and compared here. A major version of a date library changes parsing and formatting, and this is where that shows.",
      },
      {
        id: "delivery",
        label: "Delivery estimates and cut-off times",
        minutes: 12,
        verdict: "must",
        why: "Arithmetic on dates, across a timezone boundary. The classic place a library upgrade produces an off-by-one day that nobody notices for a month.",
      },
      {
        id: "reports",
        label: "Admin reports by date range",
        minutes: 16,
        verdict: "must",
        why: "Ranges are where inclusive and exclusive ends change between versions. A report quietly missing its last day is a reportable finding.",
      },
      {
        id: "cart-total",
        label: "Cart totals and tax",
        minutes: 10,
        verdict: "worth",
        why: "No dates in the arithmetic, but a smoke pass is cheap insurance after a dependency change, which can pull in transitive upgrades nobody listed.",
      },
      {
        id: "a11y",
        label: "Full accessibility audit",
        minutes: 45,
        verdict: "skip",
        why: "Nothing in the rendered markup changed, and it does not fit the budget. Valuable work, wrong week.",
      },
    ],
  },
];

export function RegressionPicker() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [shown, setShown] = useState(false);

  const scenario = SCENARIOS[index];
  const spent = scenario.suites
    .filter((s) => picked.includes(s.id))
    .reduce((total, s) => total + s.minutes, 0);

  const overBudget = spent > scenario.budget;

  const toggle = (id: string) => {
    setShown(false);
    setPicked((previous) =>
      previous.includes(id)
        ? previous.filter((p) => p !== id)
        : [...previous, id],
    );
  };

  const switchScenario = (next: number) => {
    setIndex(next);
    setPicked([]);
    setShown(false);
  };

  const missed = scenario.suites.filter(
    (s) => s.verdict === "must" && !picked.includes(s.id),
  );
  const wasted = scenario.suites.filter(
    (s) => s.verdict === "skip" && picked.includes(s.id),
  );

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          What would you re-run?
        </span>
        <select
          value={index}
          onChange={(event) => switchScenario(Number(event.target.value))}
          className="ml-auto max-w-[14rem] rounded border border-border bg-bg px-1.5 py-1 text-xs"
          aria-label="Choose a change"
        >
          {SCENARIOS.map((s, i) => (
            <option key={s.id} value={i}>
              {s.change}
            </option>
          ))}
        </select>
      </div>

      <div className="border-b border-border p-3">
        <p className="font-medium">{scenario.change}</p>
        <p className="mt-1 text-sm text-muted">{scenario.detail}</p>
        <p className="mt-2 text-xs text-muted">
          You have <strong>{scenario.budget} minutes</strong> before the release
          window closes.
        </p>
      </div>

      <div className="no-touch-target divide-y divide-border">
        {scenario.suites.map((suite) => {
          const on = picked.includes(suite.id);
          return (
            <label
              key={suite.id}
              className="flex cursor-pointer items-start gap-2.5 p-3 text-sm hover:bg-surface-2"
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(suite.id)}
                className="mt-0.5"
              />
              <span className="flex-1">
                <span className="font-medium">{suite.label}</span>
                <span className="ml-2 text-xs text-muted">
                  {suite.minutes} min
                </span>
                {shown ? (
                  <span
                    className={`mt-1 block text-xs ${
                      suite.verdict === "must"
                        ? "text-bad"
                        : suite.verdict === "worth"
                          ? "text-muted"
                          : "text-muted"
                    }`}
                  >
                    <strong>
                      {suite.verdict === "must"
                        ? "Must run. "
                        : suite.verdict === "worth"
                          ? "Worth a smoke pass. "
                          : "Skip. "}
                    </strong>
                    {suite.why}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border p-3">
        <button
          type="button"
          onClick={() => setShown(true)}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          Check my selection
        </button>
        <span
          className={`text-sm ${overBudget ? "text-bad" : "text-muted"}`}
        >
          {spent} of {scenario.budget} minutes
          {overBudget ? " — over the window" : ""}
        </span>
      </div>

      {shown ? (
        <div className="border-t border-border p-3 text-sm">
          {missed.length === 0 && wasted.length === 0 && !overBudget ? (
            <p className="rounded-lg border border-ok/40 bg-ok-soft p-2.5">
              Every suite that had to run, ran, nothing wasted, and inside the
              window. That is the whole skill.
            </p>
          ) : (
            <ul className="space-y-2">
              {missed.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-bad/40 bg-bad-soft p-2.5"
                >
                  <strong>Missed: {s.label}.</strong> {s.why}
                </li>
              ))}
              {wasted.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-border bg-surface-2 p-2.5"
                >
                  <strong>Spent {s.minutes} minutes on {s.label}.</strong>{" "}
                  {s.why}
                </li>
              ))}
              {overBudget ? (
                <li className="rounded-lg border border-bad/40 bg-bad-soft p-2.5">
                  <strong>Over the window by {spent - scenario.budget} minutes.</strong>{" "}
                  Either cut a suite to a smoke pass or say before the release,
                  not after, that the window is too short for the change.
                </li>
              ) : null}
            </ul>
          )}
        </div>
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        There is no selection that is both complete and free. Regression
        testing is choosing what not to run and being able to say why — which
        is also what you will be asked after an escape.
      </figcaption>
    </figure>
  );
}
