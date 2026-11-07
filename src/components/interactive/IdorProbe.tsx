"use client";

import { useState } from "react";

/**
 * Change the id and send it again.
 *
 * The test is one character long and finds the most common serious defect
 * on the web. Four endpoints here are protected four different ways, and
 * only one of them is actually protected — the others illustrate the
 * mistakes that look like protection and are not.
 */

type Endpoint = {
  id: string;
  label: string;
  path: string;
  /** The id this account genuinely owns. */
  own: string;
  /** Someone else's, to try. */
  other: string;
  /** A third that does not exist at all. */
  missing: string;
  respond: (id: string, e: Endpoint) => { status: number; body: string };
  verdict: string;
  safe: boolean;
};

const ENDPOINTS: Endpoint[] = [
  {
    id: "scoped",
    label: "Properly scoped",
    path: "GET /api/orders/{id}",
    own: "ORD-1001",
    other: "ORD-1004",
    missing: "ORD-9999",
    safe: true,
    respond: (id, e) =>
      id === e.own
        ? {
            status: 200,
            body: '{\n  "id": "ORD-1001",\n  "customerId": "cus_01",\n  "totalMinor": 7600050\n}',
          }
        : {
            status: 404,
            body: '{\n  "error": "not_found",\n  "message": "No order ORD-…"\n}',
          },
    verdict:
      "Correct. The query is scoped to the signed-in customer, so someone else's order and an order that does not exist look identical. That sameness is deliberate: a 403 would confirm the order exists.",
  },
  {
    id: "idor",
    label: "Classic IDOR",
    path: "GET /api/orders/{id}",
    own: "ORD-1001",
    other: "ORD-1004",
    missing: "ORD-9999",
    safe: false,
    respond: (id, e) =>
      id === e.missing
        ? { status: 404, body: '{\n  "error": "not_found"\n}' }
        : {
            status: 200,
            body:
              id === e.own
                ? '{\n  "id": "ORD-1001",\n  "customerId": "cus_01",\n  "email": "ada@example.com",\n  "totalMinor": 7600050\n}'
                : '{\n  "id": "ORD-1004",\n  "customerId": "cus_03",\n  "email": "chidi@example.com",\n  "totalMinor": 12400000,\n  "address": "14 Awolowo Road, Ikoyi, Lagos"\n}',
          },
    verdict:
      "FINDING, critical. It checked that you are signed in and never checked whose order this is. Every order in the system is readable by changing four digits, names and addresses included.",
  },
  {
    id: "uuid",
    label: "Unguessable ids only",
    path: "GET /api/orders/{uuid}",
    own: "7f2a1c40-9b3e-4a11-9a2b-6c1d0f4e8a55",
    other: "b4e8c012-55af-4d37-8e6b-2f0a9c7d1e33",
    missing: "00000000-0000-0000-0000-000000000000",
    safe: false,
    respond: (id, e) =>
      id === e.missing
        ? { status: 404, body: '{\n  "error": "not_found"\n}' }
        : {
            status: 200,
            body:
              id === e.own
                ? '{\n  "id": "7f2a1c40-…",\n  "customerId": "cus_01"\n}'
                : '{\n  "id": "b4e8c012-…",\n  "customerId": "cus_03",\n  "email": "chidi@example.com"\n}',
          },
    verdict:
      "STILL A FINDING. A long random id is harder to guess, not impossible to obtain — ids leak through referrers, logs, screenshots, shared links and support tickets. This is obscurity, not access control. Lower severity than the classic IDOR; the same bug.",
  },
  {
    id: "client",
    label: "Hidden in the interface",
    path: "GET /api/orders/{id}",
    own: "ORD-1001",
    other: "ORD-1004",
    missing: "ORD-9999",
    safe: false,
    respond: (id, e) =>
      id === e.missing
        ? { status: 404, body: '{\n  "error": "not_found"\n}' }
        : {
            status: 200,
            body:
              id === e.own
                ? '{\n  "id": "ORD-1001",\n  "customerId": "cus_01"\n}'
                : '{\n  "id": "ORD-1004",\n  "customerId": "cus_03",\n  "email": "chidi@example.com"\n}',
          },
    verdict:
      "FINDING. The page only ever links to your own orders, so nothing in the interface looks wrong — and the server will hand over any of them to anyone who types a different id. A screen that does not offer something is not a control.",
  },
];

export function IdorProbe() {
  const [index, setIndex] = useState(0);
  const [id, setId] = useState(ENDPOINTS[0].own);
  const [sent, setSent] = useState<{ status: number; body: string } | null>(
    null,
  );

  const endpoint = ENDPOINTS[index];

  const choose = (next: number) => {
    setIndex(next);
    setId(ENDPOINTS[next].own);
    setSent(null);
  };

  const leaked =
    sent !== null && sent.status === 200 && id !== endpoint.own;

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Change the id
        </span>
        <select
          value={index}
          onChange={(event) => choose(Number(event.target.value))}
          className="ml-auto max-w-[13rem] rounded border border-border bg-bg px-1.5 py-1 text-xs"
          aria-label="Choose an implementation"
        >
          {ENDPOINTS.map((e, i) => (
            <option key={e.id} value={i}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <p className="border-b border-border px-3 py-2 text-xs text-muted">
        Signed in as <code>cus_01</code>. You own{" "}
        <code>{endpoint.own}</code>.
      </p>

      <div className="no-touch-target flex flex-wrap items-center gap-2 border-b border-border p-3">
        <button
          type="button"
          onClick={() => {
            setId(endpoint.own);
            setSent(null);
          }}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs"
        >
          Your own id
        </button>
        <button
          type="button"
          onClick={() => {
            setId(endpoint.other);
            setSent(null);
          }}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs"
        >
          Someone else&apos;s id
        </button>
        <button
          type="button"
          onClick={() => {
            setId(endpoint.missing);
            setSent(null);
          }}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs"
        >
          An id that does not exist
        </button>
      </div>

      <div className="border-b border-border p-3">
        <label className="block text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
          The request
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <code className="font-mono text-xs">
            {endpoint.path.replace(/\{\w+\}/, "")}
          </code>
          <input
            value={id}
            onChange={(event) => {
              setId(event.target.value);
              setSent(null);
            }}
            spellCheck={false}
            className="min-w-0 flex-1 rounded border border-border bg-bg px-2 py-1 font-mono text-xs"
            aria-label="The id to request"
          />
          <button
            type="button"
            onClick={() => setSent(endpoint.respond(id, endpoint))}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
          >
            Send
          </button>
        </div>
      </div>

      {sent ? (
        <div className="border-b border-border p-3">
          <p
            className={`font-mono text-xs font-semibold ${
              sent.status === 200
                ? leaked
                  ? "text-bad"
                  : "text-ok"
                : "text-muted"
            }`}
          >
            {sent.status}{" "}
            {sent.status === 200
              ? "OK"
              : sent.status === 404
                ? "Not Found"
                : ""}
          </p>
          <pre className="mt-1.5 overflow-x-auto rounded-lg bg-[var(--code-bg)] p-2.5 font-mono text-[0.6875rem] text-[var(--code-text)]">
            {sent.body}
          </pre>
          {leaked ? (
            <p className="mt-2 rounded-lg border border-bad/40 bg-bad-soft p-2.5 text-sm">
              <strong>That is not your order.</strong> The server returned
              another customer&apos;s data to an account with no right to it.
              Stop here and write it up — do not enumerate further ids to see
              how many you can get.
            </p>
          ) : null}
        </div>
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        {endpoint.verdict}
      </figcaption>
    </figure>
  );
}
