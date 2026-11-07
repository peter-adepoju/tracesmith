"use client";

import { useState } from "react";

/**
 * Send the same request twice and watch what the server keeps.
 *
 * Idempotency is easy to define and hard to feel until you have pressed Send
 * twice and seen two charges. The four methods behave differently on the
 * second press, and the difference is the whole lesson.
 */

type Method = "GET" | "PUT" | "DELETE" | "POST";

type Call = {
  n: number;
  status: number;
  note: string;
  replayed: boolean;
};

const DESCRIPTION: Record<Method, string> = {
  GET: "GET /api/meridian/orders/ORD-1001 — reads, changes nothing.",
  PUT: "PUT /api/meridian/orders/ORD-1001 {\"status\":\"paid\"} — sets a value.",
  DELETE: "DELETE /api/meridian/orders/ORD-1001 — removes it.",
  POST: "POST /api/meridian/orders {items:[…]} — creates a new order and charges the card.",
};

const VERDICT: Record<Method, string> = {
  GET: "Idempotent by definition. Any number of sends leaves the server exactly as it was — that is what safe means.",
  PUT: "Idempotent. It sets the status to paid. Setting it to paid again changes nothing, because PUT states the result rather than a delta.",
  DELETE:
    "Idempotent, with a wrinkle. The second call returns 404, which looks like a failure but is not: the end state is the same either way. Many teams return 204 both times to avoid the confusion.",
  POST: "NOT idempotent. Every send creates a new order and takes money again. This is the one that needs protecting.",
};

export function RunTwice() {
  const [method, setMethod] = useState<Method>("POST");
  const [key, setKey] = useState(false);
  const [calls, setCalls] = useState<Call[]>([]);
  const [orders, setOrders] = useState(0);
  const [chargedMinor, setCharged] = useState(0);
  const [deleted, setDeleted] = useState(false);

  const reset = () => {
    setCalls([]);
    setOrders(0);
    setCharged(0);
    setDeleted(false);
  };

  const switchMethod = (next: Method) => {
    setMethod(next);
    reset();
  };

  const send = () => {
    const n = calls.length + 1;

    if (method === "GET") {
      setCalls((c) => [
        ...c,
        { n, status: 200, note: "Returned the order. Nothing stored.", replayed: false },
      ]);
      return;
    }

    if (method === "PUT") {
      setCalls((c) => [
        ...c,
        {
          n,
          status: 200,
          note: "status is now paid. It was already paid after call 1.",
          replayed: false,
        },
      ]);
      return;
    }

    if (method === "DELETE") {
      if (deleted) {
        setCalls((c) => [
          ...c,
          {
            n,
            status: 404,
            note: "Already gone. End state identical to call 1.",
            replayed: false,
          },
        ]);
      } else {
        setDeleted(true);
        setCalls((c) => [
          ...c,
          { n, status: 204, note: "Deleted.", replayed: false },
        ]);
      }
      return;
    }

    // POST, the interesting one.
    if (key && calls.length > 0) {
      setCalls((c) => [
        ...c,
        {
          n,
          status: 200,
          note: "Same Idempotency-Key as call 1. The server replayed the stored response instead of creating anything.",
          replayed: true,
        },
      ]);
      return;
    }

    setOrders((o) => o + 1);
    setCharged((m) => m + 4850000);
    setCalls((c) => [
      ...c,
      {
        n,
        status: 201,
        note: key
          ? "New Idempotency-Key, so a genuine new order. Charged NGN 48,500.00."
          : "Created a new order and charged NGN 48,500.00.",
        replayed: false,
      },
    ]);
  };

  const money = (minor: number) =>
    "NGN " +
    (minor / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const duplicated = method === "POST" && orders > 1;

  return (
    <figure className="my-7 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted">
          Send it twice
        </span>
      </div>

      <div className="no-touch-target flex flex-wrap items-center gap-2 border-b border-border p-3">
        {(["GET", "PUT", "DELETE", "POST"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMethod(m)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-xs ${
              method === m
                ? "border-accent bg-accent-soft font-semibold"
                : "border-border bg-surface-2"
            }`}
          >
            {m}
          </button>
        ))}
        {method === "POST" ? (
          <label className="ml-auto flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={key}
              onChange={() => {
                setKey((k) => !k);
                reset();
              }}
            />
            Send an <code>Idempotency-Key</code>
          </label>
        ) : null}
      </div>

      <p className="border-b border-border px-3 py-2 font-mono text-[0.6875rem] text-muted">
        {DESCRIPTION[method]}
      </p>

      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
        <button
          type="button"
          onClick={send}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          Send
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Reset
        </button>
        {method === "POST" ? (
          <span className={`text-sm ${duplicated ? "text-bad" : "text-muted"}`}>
            {orders} order{orders === 1 ? "" : "s"} · {money(chargedMinor)}{" "}
            charged
          </span>
        ) : null}
      </div>

      {calls.length > 0 ? (
        <ol className="divide-y divide-border">
          {calls.map((call) => (
            <li key={call.n} className="flex gap-3 p-3 text-sm">
              <span className="font-mono text-xs text-muted">#{call.n}</span>
              <span
                className={`font-mono text-xs font-semibold ${
                  call.status >= 400
                    ? "text-warn"
                    : call.replayed
                      ? "text-ok"
                      : ""
                }`}
              >
                {call.status}
              </span>
              <span className="flex-1">{call.note}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="p-3 text-sm text-muted">
          Press Send twice and read what changed the second time.
        </p>
      )}

      {duplicated ? (
        <p className="border-t border-border p-3 text-sm">
          <span className="block rounded-lg border border-bad/40 bg-bad-soft p-2.5">
            <strong>{orders} orders, {money(chargedMinor)} taken.</strong> One
            customer, one intention, {orders} charges. Turn the
            Idempotency-Key on and do it again.
          </span>
        </p>
      ) : null}

      <figcaption className="border-t border-border p-3 text-sm text-muted">
        {VERDICT[method]}
      </figcaption>
    </figure>
  );
}
