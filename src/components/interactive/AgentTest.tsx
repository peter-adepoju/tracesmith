"use client";

import { useState } from "react";

/**
 * Workflow or agent? Apply the one test that matters.
 *
 * Almost everything people call an agent is a workflow, and the cost of the
 * confusion is real: an agent is slower, more expensive, non-deterministic
 * and far harder to debug. The test is whether the steps can be written in
 * advance.
 */

type Answer = "workflow" | "agent";

type Task = {
  id: string;
  label: string;
  detail: string;
  answer: Answer;
  why: string;
};

const TASKS: Task[] = [
  {
    id: "recon",
    label: "Daily settlement reconciliation",
    detail:
      "Pull yesterday's payouts, match against transactions, report differences.",
    answer: "workflow",
    why: "Every step is known in advance and identical every day. An agent here is slower, costs money per run, and may reconcile differently on Tuesday — which is the one property reconciliation must not have.",
  },
  {
    id: "classify",
    label: "Route an incoming ticket to one of four queues",
    detail: "Read the message, decide the category, assign it.",
    answer: "workflow",
    why: "A model is doing real work here, but it is one step in a fixed sequence: read, classify, assign. That is a workflow with a model in it. Calling it an agent adds loops and tool choice it does not need.",
  },
  {
    id: "investigate",
    label: "Investigate why a specific payment failed",
    detail:
      "Could be the card, the webhook, the merchant's endpoint, a validation rule, or an outage. What to check next depends on what the last check found.",
    answer: "agent",
    why: "Genuinely agentic. The sequence cannot be written in advance because each finding changes the next question — the shape of the week 17 diagnosis work. Bound it with a step cap and read-only tools.",
  },
  {
    id: "invoice",
    label: "Generate and send monthly invoices",
    detail: "Pull usage per customer, calculate, generate a PDF, email it.",
    answer: "workflow",
    why: "Fixed steps, arithmetic, money leaving the business. An agent would be a liability: non-deterministic output on an invoice is a dispute, and arithmetic is the one thing a model must never be trusted with.",
  },
  {
    id: "research",
    label: "Research a prospective merchant before onboarding",
    detail:
      "Find the business, check it is real, look for obvious risk signals. Where to look depends on what you find.",
    answer: "agent",
    why: "The path is genuinely unknown — a company number leads one way, a dead website another. Suited to an agent with read-only tools, a step budget, and a human reading the summary at the end.",
  },
  {
    id: "chase",
    label: "Chase merchants with missing documents",
    detail: "Find who is missing what, send a reminder, stop after three.",
    answer: "workflow",
    why: "Entirely predictable: a query, a message, a counter. The only decision is a comparison against three, which is an IF node and not a reason to reach for an agent.",
  },
];

export function AgentTest() {
  const [picks, setPicks] = useState<Record<string, Answer>>({});
  const [shown, setShown] = useState(false);

  const pick = (id: string, answer: Answer) => {
    setShown(false);
    setPicks((previous) => ({ ...previous, [id]: answer }));
  };

  const right = TASKS.filter((t) => picks[t.id] === t.answer).length;
  const overAgented = TASKS.filter(
    (t) => picks[t.id] === "agent" && t.answer === "workflow",
  );

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Workflow or agent?
        </span>
      </div>

      <p className="border-b border-border px-3 py-2 text-xs text-muted">
        The test: <strong>can the steps be written in advance?</strong> If
        yes, it is a workflow, even when one of those steps uses a model.
      </p>

      <ul className="divide-y divide-border">
        {TASKS.map((task) => {
          const picked = picks[task.id];
          const correct = shown && picked === task.answer;
          return (
            <li key={task.id} className="p-3">
              <p className="text-sm font-medium">{task.label}</p>
              <p className="mt-0.5 text-xs text-muted">{task.detail}</p>

              <div className="no-touch-target mt-2 flex flex-wrap gap-1.5">
                {(["workflow", "agent"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => pick(task.id, option)}
                    className={`rounded-lg border px-2.5 py-1 text-xs capitalize ${
                      picked === option
                        ? "border-accent bg-accent-soft font-semibold"
                        : "border-border bg-surface-2"
                    }`}
                  >
                    {option}
                  </button>
                ))}
                {shown ? (
                  <span
                    className={`self-center text-xs font-semibold ${
                      correct ? "text-ok" : "text-bad"
                    }`}
                  >
                    {correct ? "correct" : `it is a ${task.answer}`}
                  </span>
                ) : null}
              </div>

              {shown ? (
                <p className="mt-1.5 text-xs text-muted">{task.why}</p>
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
          Check
        </button>
      </div>

      {shown ? (
        <div className="space-y-2 border-t border-border p-3 text-sm">
          <p className="font-medium">
            {right} of {TASKS.length} correct. Four of the six are workflows.
          </p>
          {overAgented.length > 0 ? (
            <p className="rounded-lg border border-warn/40 bg-warn-soft p-2.5">
              <strong>
                You called {overAgented.length} workflow
                {overAgented.length === 1 ? "" : "s"} an agent.
              </strong>{" "}
              That is the expensive direction, and the common one. An agent is
              slower, costs money per run, produces different output on
              different days and is far harder to debug — all of which you
              accept only when the steps genuinely cannot be written in
              advance.
            </p>
          ) : (
            <p className="rounded-lg border border-ok/40 bg-ok-soft p-2.5">
              Nothing over-agented. Most teams get this wrong in the other
              direction and spend a quarter on it.
            </p>
          )}
        </div>
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        A workflow with a model step in it is still a workflow. The
        distinction is not whether a model is involved — it is whether the
        sequence is decided before the run or during it.
      </figcaption>
    </figure>
  );
}
