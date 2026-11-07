"use client";

import { useState } from "react";

/**
 * Choose assertions, run them, and find out whether your set caught the bug.
 *
 * The lesson is the third scenario: a 200 with a correct shape and a wrong
 * number. A suite that only ever asserts on status is green for it, which is
 * how a money defect reaches production through a passing test run.
 */

type Response = { status: number; body: Record<string, unknown> };

type Scenario = {
  label: string;
  request: string;
  response: Response;
  /** What is actually wrong, or null when the response is correct. */
  defect: string | null;
};

const SCENARIOS: Scenario[] = [
  {
    label: "A healthy order",
    request: "GET /api/meridian/orders/ORD-1001",
    response: {
      status: 200,
      body: {
        id: "ORD-1001",
        email: "ada@example.com",
        subtotalMinor: 7600050,
        discountMinor: 0,
        totalMinor: 7600050,
        items: [{ productId: "mer-02", quantity: 1 }],
      },
    },
    defect: null,
  },
  {
    label: "200, right shape, wrong number",
    request: "GET /api/meridian/orders/ORD-1008",
    response: {
      status: 200,
      body: {
        id: "ORD-1008",
        email: "ada@example.com",
        subtotalMinor: 4450000,
        discountMinor: 0,
        totalMinor: 0,
        items: [{ productId: "mer-05", quantity: 2 }],
      },
    },
    defect:
      "totalMinor is 0 while the subtotal is 4,450,000 and no discount was applied. The order is free.",
  },
  {
    label: "201, but a field is missing",
    request: "POST /api/meridian/orders",
    response: {
      status: 201,
      body: {
        email: "ada@example.com",
        subtotalMinor: 1850000,
        discountMinor: 0,
        totalMinor: 1850000,
        items: [{ productId: "mer-05", quantity: 1 }],
      },
    },
    defect:
      "No id. The caller has created an order it cannot refer to, and nothing about the status says so.",
  },
  {
    label: "Money as a float",
    request: "GET /api/meridian/orders/ORD-1002",
    response: {
      status: 200,
      body: {
        id: "ORD-1002",
        email: "bola@example.com",
        subtotalMinor: 18500.0,
        discountMinor: 0,
        totalMinor: 18500.009999999998,
        items: [{ productId: "mer-05", quantity: 1 }],
      },
    },
    defect:
      "The amounts are floats, not integer minor units, and the total has already drifted in the fifteenth decimal place. Every arithmetic step from here makes it worse.",
  },
];

type Level = "status" | "schema" | "value";

type Assertion = {
  id: string;
  level: Level;
  label: string;
  /** True when the assertion holds for this response. */
  holds: (r: Response) => boolean;
};

const ASSERTIONS: Assertion[] = [
  {
    id: "status-2xx",
    level: "status",
    label: "Status is 2xx",
    holds: (r) => r.status >= 200 && r.status < 300,
  },
  {
    id: "status-exact",
    level: "status",
    label: "Status is exactly the one documented (200 for GET, 201 for POST)",
    holds: (r) => r.status === 200 || r.status === 201,
  },
  {
    id: "has-id",
    level: "schema",
    label: "Body has an id, and it is a non-empty string",
    holds: (r) => typeof r.body.id === "string" && r.body.id.length > 0,
  },
  {
    id: "money-integer",
    level: "schema",
    label: "Every amount is an integer (minor units, never a float)",
    holds: (r) =>
      ["subtotalMinor", "discountMinor", "totalMinor"].every((key) =>
        Number.isInteger(r.body[key]),
      ),
  },
  {
    id: "items-array",
    level: "schema",
    label: "items is an array with at least one entry",
    holds: (r) => Array.isArray(r.body.items) && r.body.items.length > 0,
  },
  {
    id: "total-arithmetic",
    level: "value",
    label: "totalMinor equals subtotalMinor minus discountMinor",
    holds: (r) =>
      r.body.totalMinor ===
      (r.body.subtotalMinor as number) - (r.body.discountMinor as number),
  },
  {
    id: "total-positive",
    level: "value",
    label: "totalMinor is greater than zero",
    holds: (r) => (r.body.totalMinor as number) > 0,
  },
];

const LEVEL_LABEL: Record<Level, string> = {
  status: "Status",
  schema: "Schema",
  value: "Value",
};

export function AssertionLab() {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string[]>(["status-2xx"]);
  const [ran, setRan] = useState(false);

  const scenario = SCENARIOS[index];
  const picked = ASSERTIONS.filter((a) => chosen.includes(a.id));
  const failing = picked.filter((a) => !a.holds(scenario.response));
  const caught = failing.length > 0;

  const toggle = (id: string) => {
    setRan(false);
    setChosen((previous) =>
      previous.includes(id)
        ? previous.filter((p) => p !== id)
        : [...previous, id],
    );
  };

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Assertion lab
        </span>
        <select
          value={index}
          onChange={(event) => {
            setIndex(Number(event.target.value));
            setRan(false);
          }}
          className="ml-auto max-w-[14rem] rounded border border-border bg-bg px-1.5 py-1 text-xs"
          aria-label="Choose a response"
        >
          {SCENARIOS.map((s, i) => (
            <option key={s.label} value={i}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 border-b border-border p-3 md:grid-cols-2">
        <div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            The response
          </p>
          <pre className="mt-1.5 overflow-x-auto rounded-lg bg-[var(--code-bg)] p-2.5 font-mono text-[0.6875rem] text-[var(--code-text)]">
            {`${scenario.request}\n\n${scenario.response.status} ${
              scenario.response.status === 201 ? "Created" : "OK"
            }\n${JSON.stringify(scenario.response.body, null, 2)}`}
          </pre>
        </div>

        <div className="no-touch-target">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
            Your assertions
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {ASSERTIONS.map((assertion) => {
              const on = chosen.includes(assertion.id);
              const holds = assertion.holds(scenario.response);
              return (
                <li key={assertion.id}>
                  <label className="flex items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(assertion.id)}
                      className="mt-0.5"
                    />
                    <span className="flex-1">
                      <span className="mr-1.5 rounded bg-surface-2 px-1 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wider text-muted">
                        {LEVEL_LABEL[assertion.level]}
                      </span>
                      {assertion.label}
                      {ran && on ? (
                        <strong className={holds ? "text-ok" : "text-bad"}>
                          {holds ? " — passed" : " — FAILED"}
                        </strong>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
        <button
          type="button"
          onClick={() => setRan(true)}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          Run assertions
        </button>
        <span className="text-sm text-muted">
          {chosen.length} selected
        </span>
      </div>

      {ran ? (
        <div className="p-3 text-sm">
          {scenario.defect === null ? (
            caught ? (
              <p className="rounded-lg border border-bad/40 bg-bad-soft p-2.5">
                <strong>False failure.</strong> This response is correct, but
                your set reports a failure. A suite that cries wolf gets
                ignored, which costs you the next real one.
              </p>
            ) : (
              <p className="rounded-lg border border-ok/40 bg-ok-soft p-2.5">
                All green, and the response really is correct. That is what a
                passing run should mean.
              </p>
            )
          ) : caught ? (
            <p className="rounded-lg border border-ok/40 bg-ok-soft p-2.5">
              <strong>Caught it.</strong> {scenario.defect}
            </p>
          ) : (
            <p className="rounded-lg border border-bad/40 bg-bad-soft p-2.5">
              <strong>All green, and the response is wrong.</strong>{" "}
              {scenario.defect}
              <br />
              This is the dangerous outcome: a passing test run that tells
              everyone the build is fine.
            </p>
          )}
        </div>
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        Start with only <em>Status is 2xx</em> selected and run every scenario.
        Three of the four are green. Then add the schema and value assertions
        and run them again.
      </figcaption>
    </figure>
  );
}
