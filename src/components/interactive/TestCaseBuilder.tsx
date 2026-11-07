"use client";

import { useState } from "react";

/**
 * Write a test case and have its structure checked.
 *
 * The checks are mechanical on purpose, and the component says so: it can
 * tell whether you numbered your steps, not whether the test is worth
 * running. Structure is what makes a case repeatable by someone else, and it
 * is the part a beginner most often leaves out.
 */

type Check = {
  id: string;
  label: string;
  test: (f: Fields) => boolean;
  fix: string;
};

type Fields = {
  id: string;
  title: string;
  preconditions: string;
  steps: string;
  expected: string;
};

const VAGUE = /\b(correct|proper|fine|work|works|properly|as expected|ok|good|appropriate)\b/i;

const CHECKS: Check[] = [
  {
    id: "id",
    label: "Has an identifier",
    test: (f) => f.id.trim().length >= 3,
    fix: "Give it a stable id like PAY-001. You will refer to it in a bug report, a test run and a conversation, and 'the third one' does not survive any of those.",
  },
  {
    id: "title",
    label: "Title says what is being checked",
    test: (f) => f.title.trim().split(/\s+/).length >= 4,
    fix: "A title should be readable on its own in a list of two hundred. 'Card payment of NGN 1,000 succeeds' beats 'Payment test'.",
  },
  {
    id: "pre",
    label: "Preconditions stated",
    test: (f) => f.preconditions.trim().length >= 10,
    fix: "Say what must already be true: a verified account, an item in stock, a specific environment. Without it the case passes for you and fails for everyone else.",
  },
  {
    id: "numbered",
    label: "Steps are numbered",
    test: (f) => (f.steps.match(/^\s*\d+[.)]/gm) ?? []).length >= 2,
    fix: "Number them, one line each. Numbering forces one action per step, which is what makes a case reproducible.",
  },
  {
    id: "steps-count",
    label: "At least three steps",
    test: (f) => (f.steps.match(/^\s*\d+[.)]/gm) ?? []).length >= 3,
    fix: "A case with one step is usually missing its setup or its verification. If it genuinely has one step, it may belong inside another case.",
  },
  {
    id: "expected",
    label: "Expected result is specific",
    test: (f) =>
      f.expected.trim().length >= 12 && !VAGUE.test(f.expected.trim()),
    fix: "Avoid 'works correctly' and 'behaves as expected'. Those cannot be disagreed with, which means they cannot be failed. Name the observable outcome: a status, a figure, a message.",
  },
  {
    id: "no-vague-steps",
    label: "Steps avoid vague wording",
    test: (f) => !VAGUE.test(f.steps),
    fix: "Words like 'correctly' and 'properly' in a step hide a decision. Say exactly what to type and exactly what to click.",
  },
];

const EXAMPLE: Fields = {
  id: "PAY-001",
  title: "Card payment of NGN 1,000 succeeds in the sandbox",
  preconditions:
    "Verified test merchant; test public key configured; Product A in stock; sandbox environment",
  steps: `1. Open the test store and add Product A to the cart
2. Go to the cart and click Checkout
3. Choose Card and enter the Interswitch test card
4. Enter the test OTP and submit`,
  expected:
    "Transaction appears in the Transactions list with status Success, amount NGN 1,000, channel Card; the order is marked paid",
};

const BLANK: Fields = {
  id: "",
  title: "",
  preconditions: "",
  steps: "",
  expected: "",
};

export function TestCaseBuilder() {
  const [fields, setFields] = useState<Fields>(BLANK);
  const [checked, setChecked] = useState(false);

  const set = (key: keyof Fields, value: string) => {
    setFields((previous) => ({ ...previous, [key]: value }));
    setChecked(false);
  };

  const results = CHECKS.map((check) => ({ ...check, pass: check.test(fields) }));
  const passed = results.filter((r) => r.pass).length;

  const Field = ({
    k,
    label,
    rows = 1,
    placeholder,
  }: {
    k: keyof Fields;
    label: string;
    rows?: number;
    placeholder: string;
  }) => (
    <label className="block">
      <span className="text-xs font-medium">{label}</span>
      {rows > 1 ? (
        <textarea
          value={fields[k]}
          onChange={(event) => set(k, event.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-sm"
        />
      ) : (
        <input
          value={fields[k]}
          onChange={(event) => set(k, event.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-sm"
        />
      )}
    </label>
  );

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Write a test case
        </span>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setFields(EXAMPLE);
              setChecked(false);
            }}
            className="rounded border border-border px-2 py-1 text-xs"
          >
            Load an example
          </button>
          <button
            type="button"
            onClick={() => {
              setFields(BLANK);
              setChecked(false);
            }}
            className="rounded border border-border px-2 py-1 text-xs"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
          <Field k="id" label="ID" placeholder="PAY-001" />
          <Field
            k="title"
            label="Title"
            placeholder="What this checks, in one line"
          />
        </div>
        <Field
          k="preconditions"
          label="Preconditions"
          rows={2}
          placeholder="What must already be true before step 1"
        />
        <Field
          k="steps"
          label="Steps"
          rows={5}
          placeholder={"1. ...\n2. ...\n3. ..."}
        />
        <Field
          k="expected"
          label="Expected result"
          rows={2}
          placeholder="The observable outcome: a status, a figure, a message"
        />

        <button
          type="button"
          onClick={() => setChecked(true)}
          className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white"
        >
          Check the structure
        </button>
      </div>

      {checked ? (
        <figcaption className="border-t border-border p-3 text-sm">
          <p className="font-mono text-xs">
            <span className={passed === CHECKS.length ? "text-ok" : "text-warn"}>
              {passed}/{CHECKS.length} structural checks pass
            </span>
          </p>
          <ul className="mt-2 space-y-1.5">
            {results.map((result) => (
              <li key={result.id} className="flex gap-2 text-sm">
                <span className={result.pass ? "text-ok" : "text-bad"}>
                  {result.pass ? "✓" : "✕"}
                </span>
                <span className="flex-1">
                  {result.label}
                  {!result.pass ? (
                    <span className="block text-xs text-muted">{result.fix}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-surface-2 p-2.5 text-xs text-muted">
            These checks are mechanical. They can tell whether you numbered
            your steps; they cannot tell whether this test is worth running,
            or whether it covers the risk you meant it to. That judgement is
            yours, and it is the part that takes years.
          </p>
        </figcaption>
      ) : null}
    </figure>
  );
}
