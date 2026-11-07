"use client";

import { useState } from "react";

/**
 * Twenty held-out messages, two prompt versions, one accuracy number.
 *
 * The classifier is deterministic and simulated, which is the point: the
 * lesson is the measurement discipline, not the model. Version 2 fixes the
 * two rules version 1 got wrong and introduces nothing new, so the accuracy
 * moves for a reason you can name — which is what an eval is for.
 */

type Bucket = "billing" | "technical" | "account" | "sales";

const BUCKETS: Bucket[] = ["billing", "technical", "account", "sales"];

const LABEL: Record<Bucket, string> = {
  billing: "Billing",
  technical: "Technical",
  account: "Account",
  sales: "Sales",
};

type Case = {
  text: string;
  expected: Bucket;
  /** Why this one is in the set. */
  note?: string;
};

const CASES: Case[] = [
  { text: "I was charged twice for the same order.", expected: "billing" },
  { text: "The checkout page shows a blank total.", expected: "technical" },
  { text: "How do I change the email on my account?", expected: "account" },
  { text: "Do you support recurring payments?", expected: "sales" },
  { text: "My settlement for 6 November has not arrived.", expected: "billing" },
  { text: "Your API returns a 500 on POST /payments.", expected: "technical" },
  { text: "I cannot sign in, it says my password is wrong.", expected: "account" },
  { text: "What are your fees for a business doing 2m a month?", expected: "sales" },
  { text: "Please send me an invoice for last month.", expected: "billing" },
  { text: "The export button does nothing at all.", expected: "technical" },
  { text: "Can you add another user to our dashboard?", expected: "account" },
  { text: "We are comparing you with two other providers.", expected: "sales" },
  {
    text: "I want a refund for the duplicate payment on my card.",
    expected: "billing",
    note: "Contains 'payment' and 'card' — v1 is fine here.",
  },
  {
    text: "The payment page will not load on Safari.",
    expected: "technical",
    note: "Contains 'payment', which v1 reads as billing. The topic is the page, not the money.",
  },
  {
    text: "Please delete my account and all my data.",
    expected: "account",
    note: "A deletion request. v1 has no rule for it.",
  },
  {
    text: "Is there a discount for annual billing?",
    expected: "sales",
    note: "Contains 'billing' and is a pre-sales question. v1 sees the keyword and stops.",
  },
  { text: "Why is my payout smaller than my dashboard total?", expected: "billing" },
  { text: "Webhooks stopped delivering at 02:00.", expected: "technical" },
  {
    text: "Our finance lead left; who can approve invoices now?",
    expected: "account",
    note: "Mentions invoices and is about permissions. v1 goes to billing.",
  },
  { text: "Can we get a demo for our team next week?", expected: "sales" },
];

/** Version 1: keyword matching, in order. Naive on purpose. */
function classifyV1(text: string): Bucket {
  const t = text.toLowerCase();
  if (/charg|refund|invoic|payment|payout|settlement|billing|fee/.test(t))
    return "billing";
  if (/error|500|blank|load|export|webhook|api|crash/.test(t)) return "technical";
  if (/sign in|password|user|email on/.test(t)) return "account";
  return "sales";
}

/**
 * Version 2: the same, plus two rules added after reading v1's failures.
 * Intent is checked before topic, and account actions before money words.
 */
function classifyV2(text: string): Bucket {
  const t = text.toLowerCase();

  // Rule added: a question about buying is sales, whatever words it uses.
  if (/discount|pricing|how much|compar|demo|do you support|what are your fee/.test(t))
    return "sales";

  // Rule added: an action on the account beats a money word in the sentence.
  if (/delete my account|add (another )?user|who can approve|change the email|permission/.test(t))
    return "account";

  // Rule added: a broken page is technical even when it is a payment page.
  if (/will not load|does nothing|blank|500|error|webhook|api|crash|safari|chrome/.test(t))
    return "technical";

  if (/charg|refund|invoic|payment|payout|settlement|billing|fee/.test(t))
    return "billing";
  if (/sign in|password|user|email/.test(t)) return "account";
  return "sales";
}

export function EvalRunner() {
  const [version, setVersion] = useState<1 | 2>(1);
  const [threshold, setThreshold] = useState(90);
  const [ran, setRan] = useState(false);

  const classify = version === 1 ? classifyV1 : classifyV2;
  const results = CASES.map((c) => {
    const got = classify(c.text);
    return { ...c, got, pass: got === c.expected };
  });

  const passed = results.filter((r) => r.pass).length;
  const accuracy = Math.round((passed / results.length) * 100);
  const failures = results.filter((r) => !r.pass);
  const ships = accuracy >= threshold;

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Twenty held-out messages
        </span>
        <span className="no-touch-target ml-auto flex gap-1.5">
          {([1, 2] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setVersion(v);
                setRan(false);
              }}
              className={`rounded-lg border px-2.5 py-1 text-xs ${
                version === v
                  ? "border-accent bg-accent-soft font-semibold"
                  : "border-border bg-surface-2"
              }`}
            >
              Prompt v{v}
            </button>
          ))}
        </span>
      </div>

      <div className="no-touch-target flex flex-wrap items-center gap-3 border-b border-border p-3">
        <button
          type="button"
          onClick={() => setRan(true)}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          Run the evals
        </button>
        <label className="text-xs">
          Pass threshold: <strong>{threshold}%</strong>
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="ml-2 align-middle"
          />
        </label>
      </div>

      {ran ? (
        <>
          <div className="border-b border-border p-3">
            <p className="text-2xl font-semibold">
              {accuracy}%{" "}
              <span className="text-sm font-normal text-muted">
                — {passed} of {results.length} correct
              </span>
            </p>
            <p
              className={`mt-2 rounded-lg border p-2.5 text-sm ${
                ships
                  ? "border-ok/40 bg-ok-soft"
                  : "border-bad/40 bg-bad-soft"
              }`}
            >
              {ships ? (
                <>
                  <strong>Above your {threshold}% threshold.</strong> Shippable
                  — with the misroutes still going somewhere a human sees them,
                  because {100 - accuracy}% of messages still land in the wrong
                  queue.
                </>
              ) : (
                <>
                  <strong>Below your {threshold}% threshold.</strong> Do not
                  ship it as an automatic router. It may still be useful as a
                  suggestion a human confirms.
                </>
              )}
            </p>
          </div>

          <div className="border-b border-border p-3">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
              Where it went wrong
            </p>
            {failures.length === 0 ? (
              <p className="mt-1.5 text-sm">
                Nothing failed. Twenty cases is a small set — a perfect score
                means write harder cases, not that you are finished.
              </p>
            ) : (
              <ul className="mt-1.5 space-y-2">
                {failures.map((failure) => (
                  <li
                    key={failure.text}
                    className="rounded-lg border border-bad/40 bg-bad-soft p-2.5 text-xs"
                  >
                    <p className="italic">&ldquo;{failure.text}&rdquo;</p>
                    <p className="mt-1">
                      Expected <strong>{LABEL[failure.expected]}</strong>, got{" "}
                      <strong>{LABEL[failure.got]}</strong>.
                    </p>
                    {failure.note ? (
                      <p className="mt-1 text-muted">{failure.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-x-auto p-3">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
              Expected against predicted
            </p>
            <table className="mt-1.5 w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1" />
                  {BUCKETS.map((b) => (
                    <th key={b} className="px-2 py-1 text-center font-semibold">
                      {LABEL[b]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BUCKETS.map((expected) => (
                  <tr key={expected} className="border-t border-border">
                    <th className="px-2 py-1 font-semibold">
                      {LABEL[expected]}
                    </th>
                    {BUCKETS.map((got) => {
                      const n = results.filter(
                        (r) => r.expected === expected && r.got === got,
                      ).length;
                      const diagonal = expected === got;
                      return (
                        <td
                          key={got}
                          className={`px-2 py-1 text-center font-mono ${
                            n === 0
                              ? "text-muted"
                              : diagonal
                                ? "bg-ok-soft font-semibold"
                                : "bg-bad-soft font-semibold"
                          }`}
                        >
                          {n}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1.5 text-[0.6875rem] text-muted">
              Rows are what it should have been, columns what it predicted.
              Everything off the diagonal is a misroute, and the pattern tells
              you which rule to write next.
            </p>
          </div>
        </>
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Run v1, read the failures, then run v2 — which adds three rules
        written from exactly those failures and nothing else. That loop, not
        the model, is what makes a classifier good enough to ship.
      </figcaption>
    </figure>
  );
}
