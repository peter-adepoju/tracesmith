"use client";

import { useState } from "react";

/**
 * Write a bug report and have it checked.
 *
 * Three kinds of check, and the component is explicit about the difference:
 * structure (did you include the section), language (did you hedge or blame),
 * and safety (did you leave a credential in the evidence). None of them can
 * judge whether the bug is real or whether your diagnosis is right.
 *
 * The safety check matters most. A report that leaks a key is worse than no
 * report, and people only learn that by being caught doing it somewhere
 * harmless.
 */

type Fields = {
  title: string;
  environment: string;
  steps: string;
  expected: string;
  actual: string;
  evidence: string;
  severity: string;
  priority: string;
};

const BLANK: Fields = {
  title: "",
  environment: "",
  steps: "",
  expected: "",
  actual: "",
  evidence: "",
  severity: "",
  priority: "",
};

const EXAMPLE: Fields = {
  title: "Applying the same discount code twice stacks the reduction (cart)",
  environment: "Meridian sandbox, stage 3 · Chrome 131 · desktop · 7 Nov 2026 14:12",
  steps: `1. Add Harmattan Field Jacket to the cart
2. Open the cart
3. Enter SAVE10 and click Apply
4. Enter SAVE10 again and click Apply`,
  expected:
    "The second application is refused with a message that the code is already applied; the total stays at NGN 43,650.00",
  actual:
    "The second application is accepted and the discount becomes 20%. The total drops to NGN 38,800.00. Repeating it reaches NGN 0.00 after ten applications.",
  evidence:
    "Screenshot of the cart after two applications (attached). Network: POST /api/meridian/orders shows discountMinor growing on each apply. No credentials in the capture.",
  severity: "critical",
  priority: "highest",
};

const VAGUE = /\b(sometimes|occasionally|seems|appears to|maybe|might|kind of|weird|strange|broken|doesn't work|not working)\b/i;
const BLAME = /\b(you broke|your bug|whoever wrote|they broke|sloppy|careless|obviously)\b/i;
const SECRETS = [
  { re: /\bsk_(live|test)_[A-Za-z0-9]+/, what: "a secret API key" },
  { re: /\bBearer\s+[A-Za-z0-9._-]{12,}/i, what: "a bearer token" },
  { re: /\beyJ[A-Za-z0-9._-]{20,}/, what: "a JSON Web Token" },
  { re: /\b(?:\d[ -]?){13,19}\b/, what: "something shaped like a card number" },
  { re: /password\s*[:=]\s*\S+/i, what: "a password" },
  { re: /\bsession=\S+/i, what: "a session cookie" },
];

type Result = { label: string; pass: boolean; note: string; kind: "structure" | "language" | "safety" };

function grade(f: Fields): Result[] {
  const all = Object.values(f).join("\n");
  const leaked = SECRETS.filter((s) => s.re.test(all));

  return [
    {
      kind: "structure",
      label: "Title says what and where",
      pass: f.title.trim().split(/\s+/).length >= 5,
      note: "A title is read in a list of a hundred. Name the behaviour and the screen: 'Applying the same discount twice stacks the reduction (cart)'.",
    },
    {
      kind: "structure",
      label: "Environment stated",
      pass: f.environment.trim().length >= 8,
      note: "Which environment, which account, which browser, when. Half of 'cannot reproduce' is a difference nobody wrote down.",
    },
    {
      kind: "structure",
      label: "Steps numbered, at least two",
      pass: (f.steps.match(/^\s*\d+[.)]/gm) ?? []).length >= 2,
      note: "Numbered, one action each. An engineer should reach the bug without guessing.",
    },
    {
      kind: "structure",
      label: "Expected is specific",
      pass: f.expected.trim().length >= 15,
      note: "Say what should have happened, concretely. Without it the reader has to decide whether this is even a bug.",
    },
    {
      kind: "structure",
      label: "Actual is specific",
      pass: f.actual.trim().length >= 15,
      note: "What it did instead, with the observed values. This is the heart of the report.",
    },
    {
      kind: "structure",
      label: "Evidence referenced",
      pass: f.evidence.trim().length >= 10,
      note: "A screenshot, a recording, or the request and its status. A report with no evidence gets questioned rather than fixed.",
    },
    {
      kind: "structure",
      label: "Severity and priority both set",
      pass: f.severity.trim().length > 0 && f.priority.trim().length > 0,
      note: "Two separate judgements: how much damage, and how soon. Set both, and say why if they differ.",
    },
    {
      kind: "language",
      label: "No hedging words",
      pass: !VAGUE.test(`${f.title} ${f.actual} ${f.expected}`),
      note: "Words like 'sometimes', 'seems' and 'broken' hide the work. If it is intermittent, say how often out of how many attempts.",
    },
    {
      kind: "language",
      label: "Describes the system, not a person",
      pass: !BLAME.test(all),
      note: "Report the bug, never the author. 'The system does X; it should do Y' gets fixed faster than anything that sounds like an accusation.",
    },
    {
      kind: "safety",
      label: "No credentials or personal data",
      pass: leaked.length === 0,
      note: leaked.length
        ? `Found ${leaked.map((l) => l.what).join(", ")}. Redact before filing — a report that leaks a credential is worse than no report, and the value must now be rotated.`
        : "Nothing that looks like a key, token, card number or password.",
    },
  ];
}

export function BugReportGrader() {
  const [fields, setFields] = useState<Fields>(BLANK);
  const [checked, setChecked] = useState(false);

  const set = (k: keyof Fields, v: string) => {
    setFields((p) => ({ ...p, [k]: v }));
    setChecked(false);
  };

  const results = grade(fields);
  const passed = results.filter((r) => r.pass).length;
  const safetyFailed = results.some((r) => r.kind === "safety" && !r.pass);

  const F = ({
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
          onChange={(e) => set(k, e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-2.5 py-2 text-sm"
        />
      ) : (
        <input
          value={fields[k]}
          onChange={(e) => set(k, e.target.value)}
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
          Write a bug report
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
        <F k="title" label="Title" placeholder="What, and where" />
        <F
          k="environment"
          label="Environment"
          placeholder="Which environment, account, browser, when"
        />
        <F k="steps" label="Steps to reproduce" rows={4} placeholder={"1. ...\n2. ..."} />
        <div className="grid gap-3 sm:grid-cols-2">
          <F k="expected" label="Expected" rows={3} placeholder="What should have happened" />
          <F k="actual" label="Actual" rows={3} placeholder="What happened instead, with values" />
        </div>
        <F
          k="evidence"
          label="Evidence"
          rows={2}
          placeholder="Screenshot, recording, or the request and its status — redacted"
        />
        <div className="grid grid-cols-2 gap-3">
          <F k="severity" label="Severity" placeholder="critical / high / medium / low" />
          <F k="priority" label="Priority" placeholder="highest / high / medium / low" />
        </div>
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white"
        >
          Check the report
        </button>
      </div>

      {checked ? (
        <figcaption className="border-t border-border p-3 text-sm">
          {safetyFailed ? (
            <p className="mb-2 rounded-lg border border-bad/50 bg-bad-soft p-2.5 text-xs font-medium">
              Stop. There is a credential in this report. Fix that before
              anything else on the list.
            </p>
          ) : null}
          <p className="font-mono text-xs">
            <span className={passed === results.length ? "text-ok" : "text-warn"}>
              {passed}/{results.length} checks pass
            </span>
          </p>
          <ul className="mt-2 space-y-1.5">
            {results.map((r) => (
              <li key={r.label} className="flex gap-2 text-sm">
                <span className={r.pass ? "text-ok" : r.kind === "safety" ? "text-bad" : "text-warn"}>
                  {r.pass ? "✓" : "✕"}
                </span>
                <span className="flex-1">
                  {r.label}
                  <span className="ml-1.5 rounded bg-surface-2 px-1 text-[0.5625rem] uppercase tracking-wide text-muted">
                    {r.kind}
                  </span>
                  {!r.pass ? (
                    <span className="block text-xs text-muted">{r.note}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-surface-2 p-2.5 text-xs text-muted">
            These checks cover structure, language and safety. None of them can
            tell whether the bug is real, whether your severity call is right,
            or whether the steps actually reproduce it. Only running them does
            that.
          </p>
        </figcaption>
      ) : null}
    </figure>
  );
}
